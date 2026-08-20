package sync_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"
	"time"

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

func TestGetLatestUpdatedAtQueriesNewestCloudTimestamp(t *testing.T) {
	const timestamp = "2026-07-30T01:23:45Z"
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/workspace_files" {
			t.Fatalf("unexpected request path: %s", r.URL.Path)
		}
		if got := r.URL.Query().Get("select"); got != "updated_at" {
			t.Errorf("unexpected select query: %q", got)
		}
		if got := r.URL.Query().Get("and"); got != "(path.not.like..snapshots/*,path.not.like.*/.snapshots/*)" {
			t.Errorf("unexpected snapshot exclusion query: %q", got)
		}
		if got := r.URL.Query().Get("order"); got != "updated_at.desc" {
			t.Errorf("unexpected order query: %q", got)
		}
		if got := r.URL.Query().Get("limit"); got != "1" {
			t.Errorf("unexpected limit query: %q", got)
		}
		_ = json.NewEncoder(w).Encode([]map[string]string{{"updated_at": timestamp}})
	})

	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	updatedAt, err := pinflowsync.NewClient(auth).GetLatestUpdatedAt()
	if err != nil {
		t.Fatalf("GetLatestUpdatedAt returned an error: %v", err)
	}
	want, _ := time.Parse(time.RFC3339, timestamp)
	if updatedAt == nil || !updatedAt.Equal(want) {
		t.Fatalf("expected %v, got %v", want, updatedAt)
	}
}

func TestGetLatestUpdatedAtReturnsNilForEmptyCloud(t *testing.T) {
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode([]map[string]string{})
	})

	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	updatedAt, err := pinflowsync.NewClient(auth).GetLatestUpdatedAt()
	if err != nil {
		t.Fatalf("GetLatestUpdatedAt returned an error: %v", err)
	}
	if updatedAt != nil {
		t.Fatalf("expected nil timestamp, got %v", updatedAt)
	}
}

func TestClientMarksUnauthorizedSessionForRenewalWithoutRefreshing(t *testing.T) {
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
	if _, err := pinflowsync.NewClient(auth).ListFiles(); !errors.Is(err, pinflowsync.ErrSessionRenewalRequired) {
		t.Fatalf("expected renewal-required error, got %v", err)
	}
	if restRequests != 1 {
		t.Fatalf("expected exactly one REST attempt, got %d", restRequests)
	}
	if refreshRequests != 0 {
		t.Fatalf("expected no hidden token refresh, got %d", refreshRequests)
	}
	state := auth.Get()
	if !state.RenewalRequired || state.AccessToken == "" {
		t.Fatalf("expected existing session to require renewal, got %#v", state)
	}
}

func TestClientUsesRenewedSessionAfterUnauthorizedResponse(t *testing.T) {
	restRequests := 0
	testutil.NewSupabaseMock(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/workspace_files" {
			http.NotFound(w, r)
			return
		}
		restRequests++
		if r.Header.Get("Authorization") == "Bearer expired-access-token" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		_ = json.NewEncoder(w).Encode([]map[string]any{})
	})

	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{
		AccessToken:  "expired-access-token",
		RefreshToken: "refresh-token",
		UserID:       "user-1",
	})
	client := pinflowsync.NewClient(auth)
	if _, err := client.ListFiles(); !errors.Is(err, pinflowsync.ErrSessionRenewalRequired) {
		t.Fatalf("expected renewal-required error, got %v", err)
	}
	auth.Set(pinflowsync.AuthState{
		AccessToken:  "renewed-access-token",
		RefreshToken: "rotated-refresh-token",
		UserID:       "user-1",
	})
	if _, err := client.ListFiles(); err != nil {
		t.Fatalf("expected request after renewal to succeed: %v", err)
	}
	if restRequests != 2 {
		t.Fatalf("expected one request before and after renewal, got %d", restRequests)
	}
}
