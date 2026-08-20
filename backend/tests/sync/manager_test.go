package sync_test

import (
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"pinflow/store"
	pinflowsync "pinflow/sync"
	"pinflow/tests/testutil"
)

type fakeCloudClient struct {
	mu sync.Mutex

	listFilesFn       func() ([]pinflowsync.WorkspaceFile, error)
	latestUpdatedAtFn func() (*time.Time, error)
	upsertFn          func(map[string][]byte) error
	deleteFileFn      func(string) error
	deleteAllFn       func() error
}

func (c *fakeCloudClient) ListFiles() ([]pinflowsync.WorkspaceFile, error) {
	if c.listFilesFn == nil {
		return nil, nil
	}
	return c.listFilesFn()
}

func (c *fakeCloudClient) GetLatestUpdatedAt() (*time.Time, error) {
	if c.latestUpdatedAtFn == nil {
		return nil, nil
	}
	return c.latestUpdatedAtFn()
}

func (c *fakeCloudClient) UpsertFiles(files map[string][]byte) error {
	if c.upsertFn == nil {
		return nil
	}
	return c.upsertFn(files)
}

func (c *fakeCloudClient) DeleteFile(path string) error {
	if c.deleteFileFn == nil {
		return nil
	}
	return c.deleteFileFn(path)
}

func (c *fakeCloudClient) DeleteAllFiles() error {
	if c.deleteAllFn == nil {
		return nil
	}
	return c.deleteAllFn()
}

func newManager(
	t *testing.T,
	client pinflowsync.CloudClient,
	notifications <-chan string,
	deps pinflowsync.ManagerDeps,
) (*pinflowsync.Manager, *store.FileStore, *pinflowsync.AuthManager) {
	t.Helper()
	fs := testutil.NewStore(t)
	auth := &pinflowsync.AuthManager{}
	deps.Client = client
	return pinflowsync.NewManagerWithDeps(fs, auth, notifications, deps), fs, auth
}

func setReturningSession(fs *store.FileStore, userID string, lastSyncedAt time.Time) {
	fs.SetSourceDecisionMade(true)
	fs.SetLastSyncedUserID(userID)
	fs.SetLastSyncedAt(lastSyncedAt)
}

func cloudWorkspaceFiles(workspaceID string, syncEnabled bool) []pinflowsync.WorkspaceFile {
	return []pinflowsync.WorkspaceFile{
		{
			Path: "manifest.json",
			Content: map[string]any{
				"version":     "1.0",
				"workspaceId": workspaceID,
				"next_ids":    map[string]any{"board": 1},
			},
		},
		{
			Path: "settings.json",
			Content: map[string]any{
				"theme": "dark", "locale": "en-US", "syncEnabled": syncEnabled,
			},
		},
	}
}

func TestManagerSetEnabledUpdatesDisabledStatus(t *testing.T) {
	manager, _, _ := newManager(t, &fakeCloudClient{}, nil, pinflowsync.ManagerDeps{})

	manager.SetEnabled(false)
	if status := manager.Status(); status.State != "disabled" {
		t.Fatalf("expected disabled status, got %q", status.State)
	}
	manager.SetEnabled(true)
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected idle status after enabling sync, got %q", status.State)
	}
}

func TestManagerTriggerRequiresAuthenticationAndEnabledSync(t *testing.T) {
	started := make(chan struct{}, 1)
	manager, fs, auth := newManager(t, &fakeCloudClient{}, nil, pinflowsync.ManagerDeps{
		RunFullSync: func() { started <- struct{}{} },
	})

	if manager.Trigger() {
		t.Fatal("expected disabled sync not to start")
	}
	fs.SetSyncEnabled(true)
	if manager.Trigger() {
		t.Fatal("expected unauthenticated sync not to start")
	}
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
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
	started := make(chan struct{})
	release := make(chan struct{})
	manager, fs, auth := newManager(t, &fakeCloudClient{}, nil, pinflowsync.ManagerDeps{
		RunFullSync: func() {
			close(started)
			<-release
		},
	})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

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
	started := make(chan struct{}, 1)
	manager, fs, auth := newManager(t, &fakeCloudClient{}, nil, pinflowsync.ManagerDeps{
		ReconcileEvery: 10 * time.Millisecond,
		RunFullSync:    func() { started <- struct{}{} },
	})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	done := make(chan struct{})
	go manager.Run(done)
	t.Cleanup(func() { close(done) })

	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for periodic reconciliation")
	}
}

func TestManagerInitializesCloudSourceDecision(t *testing.T) {
	client := &fakeCloudClient{listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
		return []pinflowsync.WorkspaceFile{{
			Path:    "manifest.json",
			Content: map[string]any{"version": "1.0"},
		}}, nil
	}}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	source := manager.SourceState()
	if !source.Pending || !source.CloudHasData {
		t.Fatalf("expected pending cloud source decision, got %#v", source)
	}
	if !fs.GetSettings().SyncEnabled {
		t.Fatal("expected source decision to preserve the sync preference")
	}
	if status := manager.Status(); status.State != "disabled" {
		t.Fatalf("expected sync status to be disabled while source decision is pending, got %#v", status)
	}

	manager.ClearSourceDecision()
	if source := manager.SourceState(); source != (pinflowsync.SourceState{}) {
		t.Fatalf("expected source state to clear, got %#v", source)
	}
}

func TestManagerAllowsLocalWorkspaceWhenCloudCheckFailed(t *testing.T) {
	var uploaded map[string][]byte
	client := &fakeCloudClient{
		listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
			return nil, errors.New("cloud check failed")
		},
		upsertFn: func(files map[string][]byte) error {
			uploaded = files
			return nil
		},
	}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err == nil {
		t.Fatal("expected cloud check failure")
	}
	if source := manager.SourceState(); !source.Pending || source.CloudHasData {
		t.Fatalf("expected unresolved source without confirmed cloud data, got %#v", source)
	}

	if err := manager.ReplaceCloudFromLocal(); err != nil {
		t.Fatalf("replace cloud from local: %v", err)
	}
	if len(uploaded) == 0 {
		t.Fatal("expected local workspace files to be uploaded")
	}
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected enabled sync to resume after source resolution, got %#v", status)
	}
}

func TestManagerReplaceCloudFromLocalKeepsDisabledStatus(t *testing.T) {
	manager, _, auth := newManager(t, &fakeCloudClient{}, nil, pinflowsync.ManagerDeps{})
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.ReplaceCloudFromLocal(); err != nil {
		t.Fatalf("replace cloud from local: %v", err)
	}
	if status := manager.Status(); status.State != "disabled" {
		t.Fatalf("expected disabled sync preference to remain visible, got %#v", status)
	}
}

func TestManagerAllowsLocalWorkspaceWhenCloudIsEmpty(t *testing.T) {
	manager, fs, auth := newManager(t, &fakeCloudClient{}, nil, pinflowsync.ManagerDeps{})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	if source := manager.SourceState(); source.Pending || source.CloudHasData {
		t.Fatalf("expected resolved local source, got %#v", source)
	}
	if !fs.GetSettings().SyncEnabled {
		t.Fatal("expected existing sync setting to remain enabled")
	}
	settings := fs.GetSettings()
	if !settings.SourceDecisionMade || settings.LastSyncedUserID != "user-1" ||
		settings.LastSyncedAt == nil {
		t.Fatalf("expected first-time source decision to be persisted, got %#v", settings)
	}
}

func TestManagerFirstTimeLoginWithCloudDataRequiresDecision(t *testing.T) {
	client := &fakeCloudClient{listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
		return cloudWorkspaceFiles("cloud-workspace", true), nil
	}}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	source := manager.SourceState()
	if !source.Pending || !source.CloudHasData {
		t.Fatalf("expected pending source decision, got %#v", source)
	}
	if fs.GetSettings().SourceDecisionMade {
		t.Fatal("expected source decision to remain incomplete")
	}
	if status := manager.Status(); status.State != "disabled" {
		t.Fatalf("expected sync to remain disabled, got %#v", status)
	}
}

func TestManagerReturningSessionAutoPullsWhenCloudIsNewer(t *testing.T) {
	localSyncedAt := time.Now().Add(-time.Hour)
	cloudUpdatedAt := time.Now()
	client := &fakeCloudClient{
		latestUpdatedAtFn: func() (*time.Time, error) {
			return &cloudUpdatedAt, nil
		},
		listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
			return cloudWorkspaceFiles("cloud-workspace", true), nil
		},
	}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	setReturningSession(fs, "user-1", localSyncedAt)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	if got := fs.WorkspaceID(); got != "cloud-workspace" {
		t.Fatalf("expected cloud workspace after auto-pull, got %q", got)
	}
	if source := manager.SourceState(); source.Pending || source.AutoAction != "pulled" {
		t.Fatalf("expected completed auto-pull, got %#v", source)
	}
	settings := fs.GetSettings()
	if settings.LastSyncedAt == nil || settings.LastSyncedUserID != "user-1" {
		t.Fatalf("expected auto-pull timestamp to be persisted, got %#v", settings)
	}
}

func TestManagerReturningSessionAutoPushesWhenLocalIsNewer(t *testing.T) {
	localSyncedAt := time.Now()
	cloudUpdatedAt := localSyncedAt.Add(-time.Hour)
	var uploaded map[string][]byte
	client := &fakeCloudClient{
		latestUpdatedAtFn: func() (*time.Time, error) {
			return &cloudUpdatedAt, nil
		},
		upsertFn: func(files map[string][]byte) error {
			uploaded = files
			return nil
		},
	}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	setReturningSession(fs, "user-1", localSyncedAt)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	if len(uploaded) == 0 {
		t.Fatal("expected local workspace to be uploaded")
	}
	if source := manager.SourceState(); source.Pending || source.AutoAction != "pushed" {
		t.Fatalf("expected completed auto-push, got %#v", source)
	}
	if syncedAt := fs.GetSettings().LastSyncedAt; syncedAt == nil ||
		syncedAt.Before(localSyncedAt) {
		t.Fatalf("expected auto-push to update lastSyncedAt, got %v", syncedAt)
	}
}

func TestManagerReturningSessionEnablesSyncWhenTimestampsMatch(t *testing.T) {
	lastSyncedAt := time.Now()
	latestCalls := 0
	client := &fakeCloudClient{latestUpdatedAtFn: func() (*time.Time, error) {
		latestCalls++
		return &lastSyncedAt, nil
	}}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	fs.SetSyncEnabled(true)
	setReturningSession(fs, "user-1", lastSyncedAt)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	if latestCalls != 1 {
		t.Fatalf("expected one timestamp query, got %d", latestCalls)
	}
	if source := manager.SourceState(); source.Pending || source.AutoAction != "" {
		t.Fatalf("expected no automatic replacement, got %#v", source)
	}
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected sync to be enabled, got %#v", status)
	}
}

func TestManagerReturningSessionDegradesGracefullyOnTimestampError(t *testing.T) {
	lastSyncedAt := time.Now()
	client := &fakeCloudClient{latestUpdatedAtFn: func() (*time.Time, error) {
		return nil, errors.New("network unavailable")
	}}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	fs.SetSyncEnabled(true)
	setReturningSession(fs, "user-1", lastSyncedAt)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("expected graceful degradation, got %v", err)
	}
	if source := manager.SourceState(); source.Pending {
		t.Fatalf("expected no blocking source decision, got %#v", source)
	}
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected local sync preference to be restored, got %#v", status)
	}
}

func TestManagerUserMismatchUsesFirstTimeSourceDecision(t *testing.T) {
	latestCalls := 0
	client := &fakeCloudClient{
		latestUpdatedAtFn: func() (*time.Time, error) {
			latestCalls++
			return nil, nil
		},
		listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
			return cloudWorkspaceFiles("other-account-workspace", true), nil
		},
	}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	setReturningSession(fs, "user-1", time.Now())
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-2"})

	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	if latestCalls != 0 {
		t.Fatalf("expected first-time path to skip timestamp query, got %d calls", latestCalls)
	}
	if source := manager.SourceState(); !source.Pending || !source.CloudHasData {
		t.Fatalf("expected pending first-time decision, got %#v", source)
	}
	if settings := fs.GetSettings(); settings.LastSyncedUserID != "user-1" {
		t.Fatalf("expected stored account marker to remain unchanged, got %#v", settings)
	}
}

func TestManagerReplaceLocalFromCloud(t *testing.T) {
	files := []pinflowsync.WorkspaceFile{
		{
			Path: "manifest.json",
			Content: map[string]any{
				"version":     "1.0",
				"workspaceId": "cloud-workspace",
				"next_ids":    map[string]any{"board": 1},
			},
		},
		{
			Path: "settings.json",
			Content: map[string]any{
				"theme": "dark", "locale": "en-US", "syncEnabled": false,
			},
		},
	}
	client := &fakeCloudClient{listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
		return files, nil
	}}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
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
}

func TestManagerPreservesLocalDataWhenCloudFetchFails(t *testing.T) {
	calls := 0
	client := &fakeCloudClient{listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
		calls++
		if calls == 1 {
			return []pinflowsync.WorkspaceFile{{
				Path:    "manifest.json",
				Content: map[string]any{"version": "1.0"},
			}}, nil
		}
		return nil, errors.New("unavailable")
	}}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
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
}

func TestManagerReplaceCloudFromLocalDeletesBeforeUploading(t *testing.T) {
	var operations []string
	var uploaded map[string][]byte
	client := &fakeCloudClient{
		listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
			return []pinflowsync.WorkspaceFile{{
				Path:    "manifest.json",
				Content: map[string]any{"version": "1.0"},
			}}, nil
		},
		deleteAllFn: func() error {
			operations = append(operations, "delete")
			return nil
		},
		upsertFn: func(files map[string][]byte) error {
			operations = append(operations, "upsert")
			uploaded = files
			return nil
		},
	}
	manager, fs, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}
	localPath := filepath.Join(fs.BasePath(), "boards", "local.json")
	if err := os.WriteFile(localPath, []byte(`{"local":true}`), 0644); err != nil {
		t.Fatalf("write local file: %v", err)
	}

	if err := manager.ReplaceCloudFromLocal(); err != nil {
		t.Fatalf("replace cloud from local: %v", err)
	}
	if len(operations) < 2 || operations[0] != "delete" || operations[1] != "upsert" {
		t.Fatalf("expected delete before upsert, got %v", operations)
	}
	if _, ok := uploaded["boards/local.json"]; !ok {
		t.Fatalf("expected local workspace file to be uploaded, got %v", uploaded)
	}
}

func TestManagerRejectsOverlappingSourceResolution(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})
	calls := 0
	client := &fakeCloudClient{listFilesFn: func() ([]pinflowsync.WorkspaceFile, error) {
		calls++
		if calls > 1 {
			close(started)
			<-release
		}
		return []pinflowsync.WorkspaceFile{{
			Path:    "manifest.json",
			Content: map[string]any{"version": "1.0"},
		}}, nil
	}}
	manager, _, auth := newManager(t, client, nil, pinflowsync.ManagerDeps{})
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	if err := manager.InitializeSourceDecision(); err != nil {
		t.Fatalf("initialize source decision: %v", err)
	}

	firstResult := make(chan error, 1)
	go func() { firstResult <- manager.ReplaceLocalFromCloud() }()
	<-started
	if err := manager.ReplaceCloudFromLocal(); !errors.Is(err, pinflowsync.ErrSourceResolutionInProgress) {
		t.Fatalf("expected overlapping source resolution error, got %v", err)
	}
	close(release)
	if err := <-firstResult; err != nil {
		t.Fatalf("first source resolution failed: %v", err)
	}
}

func TestManagerBatchesChangedFiles(t *testing.T) {
	notifications := make(chan string, 2)
	batch := make(chan map[string][]byte, 1)
	client := &fakeCloudClient{upsertFn: func(files map[string][]byte) error {
		batch <- files
		return nil
	}}
	manager, fs, auth := newManager(t, client, notifications, pinflowsync.ManagerDeps{
		DebounceEvery: time.Millisecond,
	})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	for index, rel := range []string{"boards/one.json", "boards/two.json"} {
		path := filepath.Join(fs.BasePath(), filepath.FromSlash(rel))
		if err := os.WriteFile(path, []byte(`{"id":`+string(rune('1'+index))+`}`), 0644); err != nil {
			t.Fatalf("write test file: %v", err)
		}
		notifications <- rel
	}
	done := make(chan struct{})
	go manager.Run(done)
	t.Cleanup(func() { close(done) })

	select {
	case files := <-batch:
		if len(files) != 2 {
			t.Fatalf("expected two files in one batch, got %d", len(files))
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for batch push")
	}
}

func TestManagerRetainsOfflinePathsAndRetries(t *testing.T) {
	notifications := make(chan string, 1)
	attempts := 0
	client := &fakeCloudClient{upsertFn: func(map[string][]byte) error {
		attempts++
		if attempts == 1 {
			return &url.Error{Op: "Post", URL: "https://supabase.invalid", Err: errors.New("offline")}
		}
		return nil
	}}
	manager, fs, auth := newManager(t, client, notifications, pinflowsync.ManagerDeps{
		DebounceEvery: time.Millisecond,
		RetryAfter:    5 * time.Millisecond,
	})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "access-token", UserID: "user-1"})
	rel := "boards/retry.json"
	if err := os.WriteFile(
		filepath.Join(fs.BasePath(), filepath.FromSlash(rel)),
		[]byte(`{"retry":true}`),
		0644,
	); err != nil {
		t.Fatalf("write retry file: %v", err)
	}
	done := make(chan struct{})
	go manager.Run(done)
	t.Cleanup(func() { close(done) })
	notifications <- rel

	deadline := time.Now().Add(time.Second)
	for attempts < 2 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	if attempts != 2 {
		t.Fatalf("expected one failed attempt and one retry, got %d", attempts)
	}
	for manager.Status().State != "idle" && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	if status := manager.Status(); status.State != "idle" {
		t.Fatalf("expected idle status after retry, got %#v", status)
	}
}

func TestManagerRetainsPathsUntilSessionIsRenewed(t *testing.T) {
	notifications := make(chan string, 1)
	attempts := 0
	client := &fakeCloudClient{upsertFn: func(map[string][]byte) error {
		attempts++
		if attempts == 1 {
			return pinflowsync.ErrSessionRenewalRequired
		}
		return nil
	}}
	manager, fs, auth := newManager(t, client, notifications, pinflowsync.ManagerDeps{
		DebounceEvery: time.Millisecond,
		RetryAfter:    5 * time.Millisecond,
	})
	fs.SetSyncEnabled(true)
	auth.Set(pinflowsync.AuthState{AccessToken: "expired-token", UserID: "user-1"})
	rel := "boards/renew.json"
	if err := os.WriteFile(
		filepath.Join(fs.BasePath(), filepath.FromSlash(rel)),
		[]byte(`{"renew":true}`),
		0644,
	); err != nil {
		t.Fatalf("write renewal test file: %v", err)
	}
	done := make(chan struct{})
	go manager.Run(done)
	t.Cleanup(func() { close(done) })
	notifications <- rel

	deadline := time.Now().Add(time.Second)
	for attempts < 1 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	if attempts != 1 {
		t.Fatalf("expected initial sync attempt, got %d", attempts)
	}
	auth.RequireRenewal()
	time.Sleep(20 * time.Millisecond)
	if attempts != 1 {
		t.Fatalf("expected path to wait while renewal is required, got %d attempts", attempts)
	}
	auth.Set(pinflowsync.AuthState{AccessToken: "renewed-token", UserID: "user-1"})
	for attempts < 2 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	if attempts != 2 {
		t.Fatalf("expected retained path to retry after renewal, got %d attempts", attempts)
	}
}
