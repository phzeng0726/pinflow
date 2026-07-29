package sync

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"pinflow/store"
)

const reconciliationInterval = 3 * time.Minute
const offlineRetryInterval = 5 * time.Second
const debounceInterval = 500 * time.Millisecond

// CloudClient is the remote workspace contract required by Manager.
type CloudClient interface {
	UpsertFiles(files map[string][]byte) error
	ListFiles() ([]WorkspaceFile, error)
	DeleteFile(path string) error
	DeleteAllFiles() error
}

// ManagerDeps configures Manager dependencies while production callers can
// continue using NewManager for standard defaults.
type ManagerDeps struct {
	Client         CloudClient
	DebounceEvery  time.Duration
	ReconcileEvery time.Duration
	RetryAfter     time.Duration
	RunFullSync    func()
}

type Manager struct {
	store           *store.FileStore
	client          CloudClient
	auth            *AuthManager
	notifications   <-chan string
	debounceEvery   time.Duration
	reconcileEvery  time.Duration
	retryAfter      time.Duration
	mu              sync.RWMutex
	status          SyncStatus
	source          SourceState
	sourceUserID    string
	fullSyncRunning atomic.Bool
	sourceResolving atomic.Bool
	runFullSync     func()
}

func NewManager(fs *store.FileStore, auth *AuthManager, notifications <-chan string) *Manager {
	return NewManagerWithDeps(fs, auth, notifications, ManagerDeps{})
}

// NewManagerWithDeps creates a Manager with explicit, independently owned dependencies.
func NewManagerWithDeps(
	fs *store.FileStore,
	auth *AuthManager,
	notifications <-chan string,
	deps ManagerDeps,
) *Manager {
	if deps.Client == nil {
		deps.Client = NewClient(auth)
	}
	if deps.DebounceEvery <= 0 {
		deps.DebounceEvery = debounceInterval
	}
	if deps.ReconcileEvery <= 0 {
		deps.ReconcileEvery = reconciliationInterval
	}
	if deps.RetryAfter <= 0 {
		deps.RetryAfter = offlineRetryInterval
	}
	return &Manager{
		store:          fs,
		client:         deps.Client,
		auth:           auth,
		notifications:  notifications,
		debounceEvery:  deps.DebounceEvery,
		reconcileEvery: deps.ReconcileEvery,
		retryAfter:     deps.RetryAfter,
		status:         SyncStatus{State: "idle"},
		runFullSync:    deps.RunFullSync,
	}
}
func (m *Manager) Status() SyncStatus { m.mu.RLock(); defer m.mu.RUnlock(); return m.status }
func (m *Manager) SourceState() SourceState {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.source
}
func (m *Manager) sourceDecisionPending() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.source.Pending
}
func (m *Manager) ClearSourceDecision() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.source = SourceState{}
	m.sourceUserID = ""
}
func (m *Manager) InitializeSourceDecision() error {
	state := m.auth.Get()
	if state.AccessToken == "" {
		m.ClearSourceDecision()
		return nil
	}

	m.mu.Lock()
	m.source = SourceState{Pending: true}
	m.sourceUserID = state.UserID
	m.mu.Unlock()

	files, err := m.client.ListFiles()
	m.mu.Lock()
	if m.sourceUserID != state.UserID {
		m.mu.Unlock()
		return nil
	}
	if err != nil {
		m.source = SourceState{Pending: true, Error: err.Error()}
		m.mu.Unlock()
		m.store.SetSyncEnabled(false)
		m.SetEnabled(false)
		return err
	}
	hasCloudData := len(files) > 0
	m.source = SourceState{
		Pending:      hasCloudData,
		CloudHasData: hasCloudData,
	}
	m.mu.Unlock()
	if hasCloudData {
		m.store.SetSyncEnabled(false)
		m.SetEnabled(false)
	}
	return nil
}
func (m *Manager) SetEnabled(enabled bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if enabled {
		if m.status.State == "disabled" {
			m.status.State = "idle"
			m.status.Error = ""
		}
		return
	}
	m.status.State = "disabled"
	m.status.Error = ""
}
func (m *Manager) setStatus(state, message string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.status.State = state
	m.status.Error = message
	if state == "idle" {
		now := time.Now()
		m.status.LastSyncAt = &now
	}
}
func (m *Manager) Run(done <-chan struct{}) {
	pending := map[string]bool{}
	timer := time.NewTimer(time.Hour)
	reconcileTicker := time.NewTicker(m.reconcileEvery)
	defer reconcileTicker.Stop()
	if !timer.Stop() {
		<-timer.C
	}
	resetTimer := func(delay time.Duration) {
		if !timer.Stop() {
			select {
			case <-timer.C:
			default:
			}
		}
		timer.Reset(delay)
	}
	for {
		select {
		case <-done:
			return
		case raw := <-m.notifications:
			pending[raw] = true
			resetTimer(m.debounceEvery)
		case <-timer.C:
			pending = m.push(pending)
			if len(pending) > 0 {
				resetTimer(m.retryAfter)
			}
		case <-reconcileTicker.C:
			m.Trigger()
		}
	}
}
func (m *Manager) push(paths map[string]bool) map[string]bool {
	if !m.auth.Authenticated() || !m.store.GetSettings().SyncEnabled || m.sourceDecisionPending() {
		m.setStatus("disabled", "")
		return map[string]bool{}
	}
	m.setStatus("syncing", "")
	failed := map[string]bool{}
	upserts := map[string][]byte{}
	upsertNotifications := map[string]string{}
	var syncErr error
	syncState := "error"
	for raw := range paths {
		if strings.HasPrefix(raw, "delete:") {
			if err := m.client.DeleteFile(strings.TrimPrefix(raw, "delete:")); err != nil {
				syncErr = err
				if isNetworkError(err) {
					syncState = "offline"
					failed[raw] = true
				}
			}
			continue
		}
		localPath := filepath.FromSlash(raw)
		rel := raw
		if filepath.IsAbs(localPath) {
			var err error
			rel, err = filepath.Rel(m.store.BasePath(), localPath)
			if err != nil {
				syncErr = err
				continue
			}
		} else {
			localPath = filepath.Join(m.store.BasePath(), localPath)
		}
		data, err := os.ReadFile(localPath)
		if err != nil {
			if !os.IsNotExist(err) {
				syncErr = err
			}
			continue
		}
		rel = filepath.ToSlash(rel)
		upserts[rel] = data
		upsertNotifications[rel] = raw
	}
	if err := m.client.UpsertFiles(upserts); err != nil {
		syncErr = err
		if isNetworkError(err) {
			syncState = "offline"
			for rel := range upserts {
				failed[upsertNotifications[rel]] = true
			}
		}
	}
	if syncErr != nil {
		m.setStatus(syncState, syncErr.Error())
		return failed
	}
	m.setStatus("idle", "")
	return failed
}
func (m *Manager) Trigger() bool {
	if !m.auth.Authenticated() || !m.store.GetSettings().SyncEnabled || m.sourceDecisionPending() {
		return false
	}
	if !m.fullSyncRunning.CompareAndSwap(false, true) {
		return false
	}
	go func() {
		defer m.fullSyncRunning.Store(false)
		if m.runFullSync != nil {
			m.runFullSync()
			return
		}
		m.performFullSync()
	}()
	return true
}

func (m *Manager) performFullSync() {
	paths := map[string]bool{}
	_ = filepath.Walk(m.store.BasePath(), func(path string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() && filepath.Ext(path) == ".json" {
			paths[path] = true
		}
		return nil
	})
	m.push(paths)
}
func (m *Manager) PullFromCloud() error {
	return m.ReplaceLocalFromCloud()
}

func (m *Manager) ReplaceLocalFromCloud() error {
	if !m.auth.Authenticated() {
		return fmt.Errorf("not authenticated")
	}
	source := m.SourceState()
	if !source.Pending || !source.CloudHasData {
		return ErrSourceDecisionRequired
	}
	if !m.sourceResolving.CompareAndSwap(false, true) {
		return ErrSourceResolutionInProgress
	}
	defer m.sourceResolving.Store(false)

	m.setStatus("syncing", "")
	files, err := m.client.ListFiles()
	if err != nil {
		m.setStatus("error", err.Error())
		return err
	}
	if len(files) == 0 {
		err = fmt.Errorf("cloud workspace is empty")
		m.setStatus("error", err.Error())
		return err
	}
	localFiles := make(map[string][]byte, len(files))
	for _, file := range files {
		data, err := json.MarshalIndent(file.Content, "", "  ")
		if err != nil {
			m.setStatus("error", err.Error())
			return err
		}
		localFiles[file.Path] = append(data, '\n')
	}
	if err = m.store.ReplaceJSONFiles(localFiles); err != nil {
		m.setStatus("error", err.Error())
		return err
	}
	m.mu.Lock()
	m.source.Pending = false
	m.source.Error = ""
	m.mu.Unlock()
	m.setStatus("idle", "")
	return nil
}

func (m *Manager) ReplaceCloudFromLocal() error {
	if !m.auth.Authenticated() {
		return fmt.Errorf("not authenticated")
	}
	source := m.SourceState()
	if !source.Pending || !source.CloudHasData {
		return ErrSourceDecisionRequired
	}
	if !m.sourceResolving.CompareAndSwap(false, true) {
		return ErrSourceResolutionInProgress
	}
	defer m.sourceResolving.Store(false)

	m.setStatus("syncing", "")
	files, err := m.store.ReadJSONFiles()
	if err != nil {
		m.setStatus("error", err.Error())
		return err
	}
	if err = m.client.DeleteAllFiles(); err != nil {
		m.setStatus("error", err.Error())
		return err
	}
	upserts := make(map[string][]byte, len(files))
	for path, data := range files {
		upserts[filepath.ToSlash(path)] = data
	}
	if err = m.client.UpsertFiles(upserts); err != nil {
		m.setStatus("error", err.Error())
		return err
	}

	m.mu.Lock()
	m.source.Pending = false
	m.source.CloudHasData = len(files) > 0
	m.source.Error = ""
	m.mu.Unlock()
	m.setStatus("idle", "")
	return nil
}

func (m *Manager) HasCloudData() (bool, error) {
	files, err := m.client.ListFiles()
	return len(files) > 0, err
}

func isNetworkError(err error) bool {
	var networkError net.Error
	return errors.As(err, &networkError)
}
