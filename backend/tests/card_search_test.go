package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"encoding/json"

	"pinflow/api"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
)

func TestCardSearch_Service(t *testing.T) {
	fs := setupTestStore(t)
	boardRepo := repository.NewFileBoardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)
	depRepo := repository.NewFileDependencyRepository(fs)
	clRepo := repository.NewFileChecklistRepository(fs)
	itemRepo := repository.NewFileChecklistItemRepository(fs)
	cardSvc := service.NewCardService(cardRepo, colRepo, boardRepo, nil, clRepo, itemRepo, depRepo)

	board := &model.Board{Name: "My Board"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "Todo", Position: 1}
	_ = colRepo.Create(col)

	_ = cardRepo.Create(&model.Card{ColumnID: col.ID, Title: "Fix authentication bug"})
	_ = cardRepo.Create(&model.Card{ColumnID: col.ID, Title: "Add login page"})
	_ = cardRepo.Create(&model.Card{ColumnID: col.ID, Title: "Deploy to production"})

	results, err := cardSvc.Search("auth", 10)
	if err != nil {
		t.Fatalf("Search error: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result for 'auth', got %d", len(results))
	}
	if results[0].BoardName != "My Board" {
		t.Errorf("expected boardName='My Board', got %q", results[0].BoardName)
	}
}

func TestCardSearch_Handler(t *testing.T) {
	deps := setupRouter(t)
	r := api.NewRouter(deps.BoardH, deps.ColumnH, deps.CardH, deps.TagH, deps.ChecklistH, deps.ChecklistItemH, deps.DependencyH, deps.CommentH)

	createBoardAndColumn(t, r)
	createCardInColumn(t, r, 1)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/cards/search?q=Card&limit=10", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var results []interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &results)
	if len(results) == 0 {
		t.Error("expected at least 1 search result")
	}
}
