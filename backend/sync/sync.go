package sync

import (
	"errors"
	"sync"
	"time"
)

var ErrSourceDecisionRequired = errors.New("workspace source decision is required")
var ErrSourceResolutionInProgress = errors.New("workspace source resolution is already in progress")
var ErrSessionRenewalRequired = errors.New("authentication session renewal is required")

type SyncStatus struct {
	State      string     `json:"state"`
	LastSyncAt *time.Time `json:"lastSyncAt,omitempty"`
	Error      string     `json:"error,omitempty"`
}

type SourceState struct {
	Pending      bool   `json:"pending"`
	CloudHasData bool   `json:"cloudHasData"`
	Error        string `json:"error,omitempty"`
	AutoAction   string `json:"autoAction,omitempty"`
}

type WorkspaceFile struct {
	Path    string `json:"path"`
	Content any    `json:"content"`
}

type AuthState struct {
	AccessToken     string
	RefreshToken    string
	UserID          string
	Email           string
	ExpiresAt       *time.Time
	RenewalRequired bool
}

type AuthManager struct {
	mu    sync.RWMutex
	state AuthState
}

func (m *AuthManager) Get() AuthState {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.state
}

func (m *AuthManager) Set(state AuthState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.state = state
}

func (m *AuthManager) Clear() {
	m.Set(AuthState{})
}

func (m *AuthManager) RequireRenewal() {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.state.AccessToken != "" {
		m.state.RenewalRequired = true
	}
}

func (m *AuthManager) Authenticated() bool {
	state := m.Get()
	return state.AccessToken != "" && !state.RenewalRequired
}
