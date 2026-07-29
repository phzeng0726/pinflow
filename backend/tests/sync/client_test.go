package sync_test

import (
	"encoding/json"
	"net/http"
	"testing"

	pinflowsync "pinflow/sync"
	"pinflow/tests/testutil"
)

func TestUpsertFileIncludesAuthenticatedUserAndUpsertHeaders(t *testing.T) {
	var received []struct {
		UserID  string         `json:"user_id"`
		Path    string         `json:"path"`
		Content map[string]any `json:"content"`
	}

	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/workspace_files" {
			t.Fatalf("unexpected request path: %s", r.URL.Path)
		}
		if got := r.Header.Get("apikey"); got != "publishable-test-key" {
			t.Errorf("unexpected apikey header: %q", got)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer access-token" {
			t.Errorf("unexpected authorization header: %q", got)
		}
		if got := r.Header.Get("Prefer"); got != "resolution=merge-duplicates" {
			t.Errorf("unexpected Prefer header: %q", got)
		}
		if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
			t.Fatalf("decode request body: %v", err)
		}
		w.WriteHeader(http.StatusCreated)
	})

	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{
		AccessToken: "access-token",
		UserID:      "user-1",
	})

	client := pinflowsync.NewClient(auth)
	if err := client.UpsertFile("boards/board-1/board.json", []byte(`{"name":"Board 1"}`)); err != nil {
		t.Fatalf("UpsertFile returned an error: %v", err)
	}

	if len(received) != 1 {
		t.Fatalf("expected one upsert row, got %d", len(received))
	}
	if received[0].UserID != "user-1" {
		t.Fatalf("expected user_id user-1, got %q", received[0].UserID)
	}
	if received[0].Path != "boards/board-1/board.json" {
		t.Fatalf("unexpected path: %q", received[0].Path)
	}
	if received[0].Content["name"] != "Board 1" {
		t.Fatalf("unexpected content: %#v", received[0].Content)
	}
}

func TestDeleteAllFilesScopesRequestToAuthenticatedUser(t *testing.T) {
	requests := 0
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		requests++
		if r.Method != http.MethodDelete {
			t.Errorf("expected DELETE request, got %s", r.Method)
		}
		if r.URL.Path != "/rest/v1/workspace_files" {
			t.Errorf("unexpected request path: %s", r.URL.Path)
		}
		if got := r.URL.Query().Get("user_id"); got != "eq.user-1" {
			t.Errorf("expected authenticated user filter, got %q", got)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer access-token" {
			t.Errorf("unexpected authorization header: %q", got)
		}
		w.WriteHeader(http.StatusNoContent)
	})

	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	if err := pinflowsync.NewClient(auth).DeleteAllFiles(); err != nil {
		t.Fatalf("DeleteAllFiles returned an error: %v", err)
	}
	if requests != 1 {
		t.Fatalf("expected one delete request, got %d", requests)
	}
}

func TestDeleteAllFilesRequiresAuthenticatedUserID(t *testing.T) {
	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token"})

	if err := pinflowsync.NewClient(auth).DeleteAllFiles(); err == nil {
		t.Fatal("expected missing user ID to prevent unscoped delete")
	}
}

func TestClientRetriesUnauthorizedRequestOnlyOnce(t *testing.T) {
	restRequests := 0
	refreshRequests := 0
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/rest/v1/workspace_files":
			restRequests++
			http.Error(w, "unauthorized", http.StatusUnauthorized)
		case "/auth/v1/token":
			refreshRequests++
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]any{
				"access_token":  "refreshed-access-token",
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
	auth.Set(pinflowsync.AuthState{
		AccessToken:  "expired-access-token",
		RefreshToken: "refresh-token",
		UserID:       "user-1",
	})
	if _, err := pinflowsync.NewClient(auth).ListFiles(); err == nil {
		t.Fatal("expected the retried unauthorized request to fail")
	}
	if restRequests != 2 {
		t.Fatalf("expected exactly two REST attempts, got %d", restRequests)
	}
	if refreshRequests != 1 {
		t.Fatalf("expected exactly one token refresh, got %d", refreshRequests)
	}
}

func TestClientClearsAuthWhenRefreshFails(t *testing.T) {
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/rest/v1/workspace_files" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		http.Error(w, "expired refresh token", http.StatusUnauthorized)
	})

	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{
		AccessToken:  "expired-access-token",
		RefreshToken: "expired-refresh-token",
		UserID:       "user-1",
	})
	if _, err := pinflowsync.NewClient(auth).ListFiles(); err == nil {
		t.Fatal("expected refresh failure")
	}
	if auth.Authenticated() {
		t.Fatal("expected failed refresh to clear auth state")
	}
}
