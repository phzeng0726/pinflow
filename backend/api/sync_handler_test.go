package api

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"pinflow/store"
	pinflowsync "pinflow/sync"
)

func TestSyncSourceEndpointsGateSyncAndResolveLocalSource(t *testing.T) {
	gin.SetMode(gin.TestMode)

	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.Method {
		case http.MethodGet:
			_, _ = w.Write([]byte(`[{"path":"manifest.json","content":{"version":"1.0"}}]`))
		case http.MethodDelete:
			w.WriteHeader(http.StatusNoContent)
		case http.MethodPost:
			w.WriteHeader(http.StatusCreated)
		default:
			http.Error(w, "unexpected method", http.StatusMethodNotAllowed)
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
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager := pinflowsync.NewManager(fs, auth, nil)
	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	handler := NewSyncHandler(manager, fs)
	router := gin.New()
	router.GET("/api/v1/sync/source", handler.GetSource)
	router.POST("/api/v1/sync/source", handler.ResolveSource)
	router.POST("/api/v1/sync/trigger", handler.Trigger)
	router.PATCH("/api/v1/sync/enable", handler.Enable)

	response := httptest.NewRecorder()
	router.ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/api/v1/sync/source", nil),
	)
	if response.Code != http.StatusOK || !bytes.Contains(response.Body.Bytes(), []byte(`"pending":true`)) {
		t.Fatalf("expected pending source response, got %d: %s", response.Code, response.Body.String())
	}

	for _, request := range []*http.Request{
		httptest.NewRequest(http.MethodPost, "/api/v1/sync/trigger", nil),
		httptest.NewRequest(
			http.MethodPatch,
			"/api/v1/sync/enable",
			bytes.NewBufferString(`{"enabled":true}`),
		),
	} {
		request.Header.Set("Content-Type", "application/json")
		response = httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != http.StatusConflict {
			t.Fatalf("expected pending decision conflict, got %d: %s", response.Code, response.Body.String())
		}
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/sync/source",
		bytes.NewBufferString(`{"source":"local"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response = httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusOK || !bytes.Contains(response.Body.Bytes(), []byte(`"pending":false`)) {
		t.Fatalf("expected resolved source response, got %d: %s", response.Code, response.Body.String())
	}
}
