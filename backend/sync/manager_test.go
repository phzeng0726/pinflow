package sync

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"pinflow/store"
)

func TestManagerSetEnabledUpdatesDisabledStatus(t *testing.T) {
	manager := &Manager{status: SyncStatus{State: "disabled"}}

	manager.SetEnabled(true)
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected idle status after enabling sync, got %q", status.State)
	}

	manager.SetEnabled(false)
	if status := manager.Status(); status.State != "disabled" {
		t.Fatalf("expected disabled status after disabling sync, got %q", status.State)
	}
}

func newTestManager(t *testing.T) (*Manager, *store.FileStore, *AuthManager) {
	t.Helper()
	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("create test store: %v", err)
	}
	auth := &AuthManager{}
	return NewManager(fs, auth, nil), fs, auth
}

func TestManagerTriggerRequiresAuthenticationAndEnabledSync(t *testing.T) {
	manager, fs, auth := newTestManager(t)
	manager.runFullSync = func() { t.Error("full sync should not run") }

	if manager.Trigger() {
		t.Fatal("expected disabled sync not to start")
	}

	fs.SetSyncEnabled(true)
	if manager.Trigger() {
		t.Fatal("expected unauthenticated sync not to start")
	}

	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	started := make(chan struct{})
	manager.runFullSync = func() { close(started) }
	if !manager.Trigger() {
		t.Fatal("expected authenticated and enabled sync to start")
	}
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for full sync")
	}
}

func TestManagerTriggerSkipsOverlappingFullSync(t *testing.T) {
	manager, fs, auth := newTestManager(t)
	fs.SetSyncEnabled(true)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})

	started := make(chan struct{})
	release := make(chan struct{})
	manager.runFullSync = func() {
		close(started)
		<-release
	}

	if !manager.Trigger() {
		t.Fatal("expected first full sync to start")
	}
	<-started
	if manager.Trigger() {
		t.Fatal("expected overlapping full sync to be skipped")
	}
	close(release)
}

func TestManagerRunTriggersPeriodicReconciliation(t *testing.T) {
	manager, fs, auth := newTestManager(t)
	fs.SetSyncEnabled(true)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager.reconcileEvery = 10 * time.Millisecond

	started := make(chan struct{}, 1)
	manager.runFullSync = func() { started <- struct{}{} }
	done := make(chan struct{})
	go manager.Run(done)
	defer close(done)

	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for periodic reconciliation")
	}
}

func TestManagerInitializeSourceDecisionBlocksSyncWhenCloudDataExists(t *testing.T) {
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/workspace_files" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[{"path":"manifest.json","content":{"version":"1.0"}}]`))
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, fs, auth := newTestManager(t)
	fs.SetSyncEnabled(true)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	source := manager.SourceState()
	if !source.Pending || !source.CloudHasData {
		t.Fatalf("expected pending cloud source decision, got %#v", source)
	}
	if fs.GetSettings().SyncEnabled {
		t.Fatal("expected sync to be disabled while source decision is pending")
	}
	manager.runFullSync = func() { t.Error("full sync should not run") }
	if manager.Trigger() {
		t.Fatal("expected source decision to block manual and periodic full sync")
	}
}

func TestManagerInitializeSourceDecisionAllowsLocalWorkspaceWhenCloudIsEmpty(t *testing.T) {
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[]`))
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, fs, auth := newTestManager(t)
	fs.SetSyncEnabled(true)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	source := manager.SourceState()
	if source.Pending || source.CloudHasData {
		t.Fatalf("expected resolved local source, got %#v", source)
	}
	if !fs.GetSettings().SyncEnabled {
		t.Fatal("expected existing sync setting to remain enabled")
	}
}

func TestManagerClearSourceDecisionOnLogout(t *testing.T) {
	manager, _, _ := newTestManager(t)
	manager.source = SourceState{Pending: true, CloudHasData: true}
	manager.sourceUserID = "user-1"

	manager.ClearSourceDecision()

	if source := manager.SourceState(); source != (SourceState{}) {
		t.Fatalf("expected cleared source state, got %#v", source)
	}
}

func TestManagerReplaceLocalFromCloudFetchesBeforeReplacing(t *testing.T) {
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[
			{"path":"manifest.json","content":{"version":"1.0","workspaceId":"cloud-workspace","next_ids":{"board":1}}},
			{"path":"settings.json","content":{"theme":"dark","locale":"en-US","syncEnabled":false}}
		]`))
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, fs, auth := newTestManager(t)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager.source = SourceState{Pending: true, CloudHasData: true}
	localOnlyPath := filepath.Join(fs.BasePath(), "boards", "local-only.json")
	if err := os.WriteFile(localOnlyPath, []byte(`{"local":true}`), 0644); err != nil {
		t.Fatalf("write local file: %v", err)
	}

	if err := manager.ReplaceLocalFromCloud(); err != nil {
		t.Fatalf("replace local from cloud: %v", err)
	}
	if _, err := os.Stat(localOnlyPath); !os.IsNotExist(err) {
		t.Fatalf("expected local-only JSON to be removed, got %v", err)
	}
	if got := fs.WorkspaceID(); got != "cloud-workspace" {
		t.Fatalf("expected cloud workspace to be reloaded, got %q", got)
	}
	if source := manager.SourceState(); source.Pending {
		t.Fatalf("expected source decision to be resolved, got %#v", source)
	}
}

func TestManagerReplaceLocalFromCloudPreservesLocalDataWhenFetchFails(t *testing.T) {
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "unavailable", http.StatusServiceUnavailable)
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, fs, auth := newTestManager(t)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager.source = SourceState{Pending: true, CloudHasData: true}
	localPath := filepath.Join(fs.BasePath(), "boards", "local.json")
	const localData = `{"local":true}`
	if err := os.WriteFile(localPath, []byte(localData), 0644); err != nil {
		t.Fatalf("write local file: %v", err)
	}

	if err := manager.ReplaceLocalFromCloud(); err == nil {
		t.Fatal("expected cloud fetch failure")
	}
	after, err := os.ReadFile(localPath)
	if err != nil {
		t.Fatalf("read preserved local file: %v", err)
	}
	if string(after) != localData {
		t.Fatalf("expected local data to remain unchanged, got %q", after)
	}
	if source := manager.SourceState(); !source.Pending {
		t.Fatalf("expected source decision to remain pending, got %#v", source)
	}
}

func TestManagerReplaceCloudFromLocalDeletesBeforeUploading(t *testing.T) {
	var methods []string
	var uploadedPaths []string
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		methods = append(methods, r.Method)
		switch r.Method {
		case http.MethodDelete:
			if got := r.URL.Query().Get("user_id"); got != "eq.user-1" {
				t.Errorf("unexpected user filter: %q", got)
			}
			w.WriteHeader(http.StatusNoContent)
		case http.MethodPost:
			var rows []struct {
				Path string `json:"path"`
			}
			if err := json.NewDecoder(r.Body).Decode(&rows); err != nil {
				t.Fatalf("decode uploaded rows: %v", err)
			}
			for _, row := range rows {
				uploadedPaths = append(uploadedPaths, row.Path)
			}
			w.WriteHeader(http.StatusCreated)
		default:
			http.Error(w, "unexpected method", http.StatusMethodNotAllowed)
		}
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, fs, auth := newTestManager(t)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager.source = SourceState{Pending: true, CloudHasData: true}
	localPath := filepath.Join(fs.BasePath(), "boards", "local.json")
	if err := os.WriteFile(localPath, []byte(`{"local":true}`), 0644); err != nil {
		t.Fatalf("write local file: %v", err)
	}

	if err := manager.ReplaceCloudFromLocal(); err != nil {
		t.Fatalf("replace cloud from local: %v", err)
	}
	if len(methods) == 0 || methods[0] != http.MethodDelete {
		t.Fatalf("expected cloud delete before uploads, got %v", methods)
	}
	foundLocal := false
	for _, path := range uploadedPaths {
		if path == "boards/local.json" {
			foundLocal = true
			break
		}
	}
	if !foundLocal {
		t.Fatalf("expected local workspace JSON to be uploaded, got %v", uploadedPaths)
	}
	if source := manager.SourceState(); source.Pending {
		t.Fatalf("expected source decision to be resolved, got %#v", source)
	}
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected idle status after replacement, got %#v", status)
	}
}

func TestManagerReplaceCloudFromLocalKeepsDecisionPendingOnDeleteFailure(t *testing.T) {
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "delete failed", http.StatusInternalServerError)
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, _, auth := newTestManager(t)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager.source = SourceState{Pending: true, CloudHasData: true}

	if err := manager.ReplaceCloudFromLocal(); err == nil {
		t.Fatal("expected cloud replacement failure")
	}
	if source := manager.SourceState(); !source.Pending {
		t.Fatalf("expected source decision to remain pending, got %#v", source)
	}
	if status := manager.Status(); status.State != "error" {
		t.Fatalf("expected error status, got %#v", status)
	}
}

func TestManagerRejectsOverlappingSourceResolution(t *testing.T) {
	manager, _, auth := newTestManager(t)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	manager.source = SourceState{Pending: true, CloudHasData: true}
	manager.sourceResolving.Store(true)

	if err := manager.ReplaceLocalFromCloud(); !errors.Is(err, ErrSourceResolutionInProgress) {
		t.Fatalf("expected overlapping cloud resolution error, got %v", err)
	}
	if err := manager.ReplaceCloudFromLocal(); !errors.Is(err, ErrSourceResolutionInProgress) {
		t.Fatalf("expected overlapping local resolution error, got %v", err)
	}
}

func TestManagerPushBatchesChangedFilesIntoOneRequest(t *testing.T) {
	requests := 0
	rowsReceived := 0
	supabase := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		var rows []map[string]any
		if err := json.NewDecoder(r.Body).Decode(&rows); err != nil {
			t.Fatalf("decode batch: %v", err)
		}
		rowsReceived = len(rows)
		w.WriteHeader(http.StatusCreated)
	}))
	defer supabase.Close()
	t.Setenv("PINFLOW_SUPABASE_URL", supabase.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	manager, fs, auth := newTestManager(t)
	fs.SetSyncEnabled(true)
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	files := map[string]string{
		"boards/board-1.json": `{"id":1}`,
		"boards/board-2.json": `{"id":2}`,
	}
	paths := make(map[string]bool, len(files))
	for rel, content := range files {
		path := filepath.Join(fs.BasePath(), filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatalf("create test directory: %v", err)
		}
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatalf("write test file: %v", err)
		}
		paths[rel] = true
	}

	if failed := manager.push(paths); len(failed) != 0 {
		t.Fatalf("expected batch push to succeed, retained %v", failed)
	}
	if requests != 1 {
		t.Fatalf("expected one batch request, got %d", requests)
	}
	if rowsReceived != 2 {
		t.Fatalf("expected two rows in batch, got %d", rowsReceived)
	}
}

type retryTransport struct {
	attempts atomic.Int32
	allow    <-chan struct{}
}

func (t *retryTransport) RoundTrip(*http.Request) (*http.Response, error) {
	if t.attempts.Add(1) == 1 {
		return nil, &url.Error{
			Op:  "Post",
			URL: "https://supabase.invalid/rest/v1/workspace_files",
			Err: errors.New("network unavailable"),
		}
	}
	<-t.allow
	return &http.Response{
		StatusCode: http.StatusCreated,
		Status:     "201 Created",
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader("")),
	}, nil
}

func TestManagerRetainsOfflinePathsAndRetries(t *testing.T) {
	t.Setenv("PINFLOW_SUPABASE_URL", "https://supabase.invalid")
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")

	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("create store: %v", err)
	}
	fs.SetSyncEnabled(true)
	auth := &AuthManager{}
	auth.Set(AuthState{AccessToken: "access-token", UserID: "user-1"})
	notifications := make(chan string, 1)
	manager := NewManager(fs, auth, notifications)
	manager.retryAfter = 10 * time.Millisecond
	allowRetry := make(chan struct{})
	transport := &retryTransport{allow: allowRetry}
	manager.client.http = &http.Client{Transport: transport}

	rel := "boards/retry.json"
	path := filepath.Join(fs.BasePath(), filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatalf("create test directory: %v", err)
	}
	if err := os.WriteFile(path, []byte(`{"retry":true}`), 0644); err != nil {
		t.Fatalf("write test file: %v", err)
	}

	done := make(chan struct{})
	go manager.Run(done)
	t.Cleanup(func() { close(done) })
	notifications <- rel

	deadline := time.Now().Add(2 * time.Second)
	for manager.Status().State != "offline" && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if status := manager.Status(); status.State != "offline" {
		t.Fatalf("expected offline status after network failure, got %#v", status)
	}

	close(allowRetry)
	deadline = time.Now().Add(time.Second)
	for manager.Status().State != "idle" && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected retained path to sync after retry, got %#v", status)
	}
	if got := transport.attempts.Load(); got != 2 {
		t.Fatalf("expected one failed attempt and one retry, got %d attempts", got)
	}
}
