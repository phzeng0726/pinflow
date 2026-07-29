package testutil

import (
	"testing"

	"pinflow/api"
	"pinflow/repository"
	"pinflow/service"
	"pinflow/store"
	pinflowsync "pinflow/sync"

	"github.com/gin-gonic/gin"
)

// NewStore creates an isolated FileStore backed by the test's temporary directory.
func NewStore(t *testing.T) *store.FileStore {
	t.Helper()
	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("create test store: %v", err)
	}
	return fs
}

// NewServices creates the complete repository and service containers for a store.
func NewServices(fs *store.FileStore) (*service.Services, *repository.Repositories) {
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	return services, repos
}

// NewHandlers creates the complete handler container with isolated sync state.
func NewHandlers(services *service.Services, fs *store.FileStore) *api.Handlers {
	auth := &pinflowsync.AuthManager{}
	manager := pinflowsync.NewManager(fs, auth, make(chan string, 1))
	return api.NewHandlers(services, auth, manager, fs)
}

// NewRouter creates a complete API router backed by an isolated workspace.
func NewRouter(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	fs := NewStore(t)
	services, _ := NewServices(fs)
	return api.NewRouter(NewHandlers(services, fs), fs)
}

// NewAuthenticatedManager creates an isolated authenticated sync manager.
func NewAuthenticatedManager(
	t *testing.T,
	notifications <-chan string,
) (*pinflowsync.Manager, *store.FileStore, *pinflowsync.AuthManager) {
	t.Helper()
	fs := NewStore(t)
	auth := &pinflowsync.AuthManager{}
	auth.Set(pinflowsync.AuthState{
		AccessToken: "access-token",
		UserID:      "user-1",
	})
	return pinflowsync.NewManager(fs, auth, notifications), fs, auth
}
