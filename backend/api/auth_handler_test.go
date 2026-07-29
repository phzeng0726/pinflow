package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pinflow/store"
	pinflowsync "pinflow/sync"

	"github.com/gin-gonic/gin"
)

func TestCreateSessionPersistsRotatedRefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/auth/v1/user":
			http.Error(w, "invalid access token", http.StatusUnauthorized)
		case "/auth/v1/token":
			if r.URL.Query().Get("grant_type") != "refresh_token" {
				t.Errorf("unexpected grant type: %s", r.URL.RawQuery)
			}
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]any{
				"access_token":  "new-access-token",
				"refresh_token": "rotated-refresh-token",
				"user": map[string]string{
					"id":    "user-1",
					"email": "user@example.com",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer supabase.Close()

	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	auth := &pinflowsync.AuthManager{}
	handler := NewAuthHandler(auth, nil)
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

	state := auth.Get()
	if state.AccessToken != "new-access-token" {
		t.Fatalf("expected refreshed access token, got %q", state.AccessToken)
	}
	if state.RefreshToken != "rotated-refresh-token" {
		t.Fatalf("expected rotated refresh token in auth state, got %q", state.RefreshToken)
	}
}

func TestAuthSessionInitializesAndClearsWorkspaceSourceDecision(t *testing.T) {
	gin.SetMode(gin.TestMode)

	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	}))
	defer supabase.Close()

	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("create store: %v", err)
	}
	auth := &pinflowsync.AuthManager{}
	manager := pinflowsync.NewManager(fs, auth, nil)
	handler := NewAuthHandler(auth, manager)
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
