package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
)

func TestCardSearch_Service(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board := &model.Board{Name: "My Board"}
	_ = repos.Board.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "Todo", Position: 1}
	_ = repos.Column.Create(col)

	_ = repos.Card.Create(&model.Card{ColumnID: col.ID, Title: "Fix authentication bug"})
	_ = repos.Card.Create(&model.Card{ColumnID: col.ID, Title: "Add login page"})
	_ = repos.Card.Create(&model.Card{ColumnID: col.ID, Title: "Deploy to production"})

	results, err := services.Card.Search("auth", 10)
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
	r := setupRouter(t)

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
