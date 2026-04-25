package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"pinflow/api"
	"pinflow/dto"
	"pinflow/repository"
	"pinflow/service"
)


func TestSnapshotHandler_List(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	r := api.NewRouter(handlers, fs)

	board, _ := services.Board.CreateBoard("ListHBoard")
	_, _ = services.Column.CreateColumn(board.ID, "Col")
	_, _ = services.Snapshot.CreateSnapshot(board.ID, "snap-a", true, "manual", false)
	_, _ = services.Snapshot.CreateSnapshot(board.ID, "snap-b", true, "manual", false)

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/boards/%d/snapshots", board.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var result []dto.SnapshotResponse
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 snapshots, got %d", len(result))
	}
	if result[0].Name != "snap-b" {
		t.Errorf("expected newest first (snap-b), got %q", result[0].Name)
	}
}

func TestSnapshotHandler_Create(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	r := api.NewRouter(handlers, fs)

	board, _ := services.Board.CreateBoard("CreateHBoard")
	_, _ = services.Column.CreateColumn(board.ID, "Col")

	body := `{"name":"my-snap"}`
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/boards/"+fmt.Sprintf("%d", board.ID)+"/snapshots",
		bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var snap dto.SnapshotResponse
	if err := json.Unmarshal(w.Body.Bytes(), &snap); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if snap.Name != "my-snap" {
		t.Errorf("expected name 'my-snap', got %q", snap.Name)
	}
	if !snap.IsManual {
		t.Error("expected isManual=true")
	}
}

func TestSnapshotHandler_Delete(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	r := api.NewRouter(handlers, fs)

	board, _ := services.Board.CreateBoard("DelHBoard")
	_, _ = services.Column.CreateColumn(board.ID, "Col")

	snap, _ := services.Snapshot.CreateSnapshot(board.ID, "del-me", true, "manual", false)

	req := httptest.NewRequest(http.MethodDelete,
		fmt.Sprintf("/api/v1/boards/%d/snapshots/%d", board.ID, snap.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", w.Code, w.Body.String())
	}
}

func TestSnapshotHandler_Delete_NotFound(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	r := api.NewRouter(handlers, fs)

	board, _ := services.Board.CreateBoard("DelHBoard2")

	req := httptest.NewRequest(http.MethodDelete,
		fmt.Sprintf("/api/v1/boards/%d/snapshots/9999", board.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestSnapshotHandler_Restore(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	r := api.NewRouter(handlers, fs)

	board, _ := services.Board.CreateBoard("RestoreHBoard")
	col, _ := services.Column.CreateColumn(board.ID, "Col")
	_, _ = services.Card.CreateCard(col.ID, "Card 1", "")

	snap, _ := services.Snapshot.CreateSnapshot(board.ID, "restore-target", true, "manual", false)

	// Add another column after snapshot
	_, _ = services.Column.CreateColumn(board.ID, "Done")

	req := httptest.NewRequest(http.MethodPost,
		fmt.Sprintf("/api/v1/boards/%d/snapshots/%d/restore", board.ID, snap.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", w.Code, w.Body.String())
	}
}
