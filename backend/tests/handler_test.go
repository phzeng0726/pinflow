package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pinflow/api"
	_ "pinflow/docs"
	"pinflow/repository"
	"pinflow/service"
)

func setupRouter(t *testing.T) *api.RouterDeps {
	t.Helper()
	fs := setupTestStore(t)
	boardRepo := repository.NewFileBoardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)
	tagRepo := repository.NewFileTagRepository(fs)
	clRepo := repository.NewFileChecklistRepository(fs)
	itemRepo := repository.NewFileChecklistItemRepository(fs)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)
	cardSvc := service.NewCardService(cardRepo, colRepo, tagRepo, clRepo, itemRepo)
	tagSvc := service.NewTagService(tagRepo, cardRepo)
	clSvc := service.NewChecklistService(clRepo, itemRepo, cardRepo)
	boardH := api.NewBoardHandler(boardSvc)
	colH := api.NewColumnHandler(colSvc)
	cardH := api.NewCardHandler(cardSvc)
	tagH := api.NewTagHandler(tagSvc)
	clH := api.NewChecklistHandler(clSvc)
	clItemH := api.NewChecklistItemHandler(clSvc)
	return &api.RouterDeps{BoardH: boardH, ColumnH: colH, CardH: cardH, TagH: tagH, ChecklistH: clH, ChecklistItemH: clItemH}
}

func TestHandler_CreateBoard(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	body := `{"name":"Test Board"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/boards", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var result map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &result)
	if result["name"] != "Test Board" {
		t.Errorf("unexpected name: %v", result["name"])
	}
}

func TestHandler_CreateBoard_InvalidName(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	body := `{"name":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/boards", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422, got %d", w.Code)
	}
}

func TestHandler_GetBoards_Empty(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/boards", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var result []interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &result)
	if len(result) != 0 {
		t.Errorf("expected empty array, got %d items", len(result))
	}
}

func TestHandler_BoardNotFound(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/boards/999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestHandler_CreateColumnAndCard(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	// Create board
	body := `{"name":"Board"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/boards", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var board map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &board)
	boardID := int(board["id"].(float64))

	// Create column
	colBody := `{"name":"Todo"}`
	req = httptest.NewRequest(http.MethodPost, "/api/v1/boards/1/columns", bytes.NewBufferString(colBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Errorf("expected 201 for column, got %d: %s", w.Code, w.Body.String())
	}
	_ = boardID

	var col map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &col)

	// Create card
	cardBody := `{"title":"Task 1","description":"do it"}`
	req = httptest.NewRequest(http.MethodPost, "/api/v1/columns/1/cards", bytes.NewBufferString(cardBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Errorf("expected 201 for card, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_GetPinnedCards(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/cards/pinned", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestHandler_HealthCheck(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}
