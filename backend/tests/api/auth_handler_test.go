package api_test

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pinflow/api"
	pinflowsync "pinflow/sync"
	"pinflow/tests/testutil"

	"github.com/gin-gonic/gin"
)

func TestCreateSessionPersistsRotatedRefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	expiresAt := time.Now().UTC().Add(time.Hour).Truncate(time.Second)
	accessToken := testAccessToken(t, expiresAt)
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/auth/v1/user":
			http.Error(w, "invalid access token", http.StatusUnauthorized)
		case "/auth/v1/token":
			if r.URL.Query().Get("grant_type") != "refresh_token" {
				t.Errorf("unexpected grant type: %s", r.URL.RawQuery)
			}
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]any{
				"access_token":  accessToken,
				"refresh_token": "rotated-refresh-token",
				"user": map[string]string{
					"id":    "user-1",
					"email": "user@example.com",
				},
			})
		default:
			http.NotFound(w, r)
		}
	})

	auth := &pinflowsync.AuthManager{}
	handler := api.NewAuthHandler(auth, nil)
	router := gin.New()
	router.POST("/api/v1/auth/session", handler.CreateSession)

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/auth/session",
		bytes.NewBufferString(`{"accessToken":"","refreshToken":"saved-refresh-token"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}

	var body struct {
		Authenticated bool   `json:"authenticated"`
		RefreshToken  string `json:"refreshToken"`
		ExpiresAt     string `json:"expiresAt"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !body.Authenticated {
		t.Fatal("expected authenticated response")
	}
	if body.RefreshToken != "rotated-refresh-token" {
		t.Fatalf("expected rotated refresh token, got %q", body.RefreshToken)
	}
	gotExpiry, err := time.Parse(time.RFC3339, body.ExpiresAt)
	if err != nil || !gotExpiry.Equal(expiresAt) {
		t.Fatalf("expected expiry %v, got %q", expiresAt, body.ExpiresAt)
	}

	state := auth.Get()
	if state.AccessToken != accessToken {
		t.Fatalf("expected refreshed access token, got %q", state.AccessToken)
	}
	if state.RefreshToken != "rotated-refresh-token" {
		t.Fatalf("expected rotated refresh token in auth state, got %q", state.RefreshToken)
	}
}

func TestGetSessionIncludesExpiryAndRenewalStateWithoutRefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	expiresAt := time.Now().UTC().Add(time.Hour).Truncate(time.Second)
	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{
		AccessToken:     "access-token",
		RefreshToken:    "secret-refresh-token",
		UserID:          "user-1",
		Email:           "user@example.com",
		ExpiresAt:       &expiresAt,
		RenewalRequired: true,
	})
	handler := api.NewAuthHandler(auth, nil)
	router := gin.New()
	router.GET("/api/v1/auth/session", handler.GetSession)

	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/v1/auth/session", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["renewalRequired"] != true || body["expiresAt"] != expiresAt.Format(time.RFC3339) {
		t.Fatalf("unexpected session metadata: %#v", body)
	}
	if _, exposed := body["refreshToken"]; exposed {
		t.Fatal("GET session must not expose refresh token")
	}
}

func testAccessToken(t *testing.T, expiresAt time.Time) string {
	t.Helper()
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"none"}`))
	payload, err := json.Marshal(map[string]int64{"exp": expiresAt.Unix()})
	if err != nil {
		t.Fatalf("marshal JWT payload: %v", err)
	}
	return header + "." + base64.RawURLEncoding.EncodeToString(payload) + ".signature"
}

func TestAuthSessionInitializesAndClearsWorkspaceSourceDecision(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/auth/v1/user":
			_ = json.NewEncoder(w).Encode(map[string]string{
				"id":    "user-1",
				"email": "user@example.com",
			})
		case "/rest/v1/workspace_files":
			_ = json.NewEncoder(w).Encode([]map[string]any{{
				"path":    "manifest.json",
				"content": map[string]any{"version": "1.0"},
			}})
		default:
			http.NotFound(w, r)
		}
	})

	fs := testutil.NewStore(t)
	auth := &pinflowsync.AuthManager{}
	manager := pinflowsync.NewManager(fs, auth, nil)
	handler := api.NewAuthHandler(auth, manager)
	router := gin.New()
	router.POST("/api/v1/auth/session", handler.CreateSession)
	router.DELETE("/api/v1/auth/session", handler.DeleteSession)

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/auth/session",
		bytes.NewBufferString(`{"accessToken":"access-token","refreshToken":"refresh-token"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}
	if source := manager.SourceState(); !source.Pending || !source.CloudHasData {
		t.Fatalf("expected pending cloud source decision, got %#v", source)
	}

	response = httptest.NewRecorder()
	router.ServeHTTP(
		response,
		httptest.NewRequest(http.MethodDelete, "/api/v1/auth/session", nil),
	)
	if response.Code != http.StatusOK {
		t.Fatalf("expected logout status 200, got %d", response.Code)
	}
	if source := manager.SourceState(); source != (pinflowsync.SourceState{}) {
		t.Fatalf("expected source decision to clear on logout, got %#v", source)
	}
}
