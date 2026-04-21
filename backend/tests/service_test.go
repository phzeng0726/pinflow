package tests

import (
	"testing"

	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
)

func TestBoardService_CreateValidation(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	_, err := services.Board.CreateBoard("")
	if err == nil {
		t.Fatal("expected error for empty board name")
	}

	board, err := services.Board.CreateBoard("  MyBoard  ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if board.Name != "MyBoard" {
		t.Errorf("expected trimmed name 'MyBoard', got %q", board.Name)
	}
}

func TestBoardService_Delete_NotFound(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	err := services.Board.DeleteBoard(999)
	if err == nil {
		t.Fatal("expected error deleting non-existent board")
	}
}

func TestColumnService_CreateColumn_Position(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, _ := services.Board.CreateBoard("B")

	col1, err := services.Column.CreateColumn(board.ID, "Todo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if col1.Position != 1.0 {
		t.Errorf("expected position 1.0, got %f", col1.Position)
	}

	col2, _ := services.Column.CreateColumn(board.ID, "InProgress")
	if col2.Position != 2.0 {
		t.Errorf("expected position 2.0, got %f", col2.Position)
	}
}

func TestColumnService_AutoPinToggle(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, _ := services.Board.CreateBoard("B")
	col, _ := services.Column.CreateColumn(board.ID, "InProgress")

	autoPin := true
	updated, err := services.Column.UpdateColumn(col.ID, service.UpdateColumnInput{AutoPin: &autoPin})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !updated.AutoPin {
		t.Error("expected AutoPin=true")
	}
}

func TestCardService_CreateCard_AutoPin(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, _ := services.Board.CreateBoard("B")
	col, _ := services.Column.CreateColumn(board.ID, "InProgress")

	autoPin := true
	_, _ = services.Column.UpdateColumn(col.ID, service.UpdateColumnInput{AutoPin: &autoPin})

	card, err := services.Card.CreateCard(col.ID, "Task", "desc")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !card.IsPinned {
		t.Error("expected card to be auto-pinned")
	}
}

func TestCardService_MoveCard_TriggersAutoPin(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, _ := services.Board.CreateBoard("B")
	todoCol, _ := services.Column.CreateColumn(board.ID, "Todo")
	inProgressCol, _ := services.Column.CreateColumn(board.ID, "InProgress")

	autoPin := true
	_, _ = services.Column.UpdateColumn(inProgressCol.ID, service.UpdateColumnInput{AutoPin: &autoPin})

	card, _ := services.Card.CreateCard(todoCol.ID, "Task", "")
	if card.IsPinned {
		t.Error("expected card not pinned initially")
	}

	moved, err := services.Card.MoveCard(card.ID, inProgressCol.ID, 1.0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !moved.IsPinned {
		t.Error("expected card to be auto-pinned after move to auto-pin column")
	}
}

func TestCardService_TogglePin(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, _ := services.Board.CreateBoard("B")
	col, _ := services.Column.CreateColumn(board.ID, "Todo")

	card := &model.Card{ColumnID: col.ID, Title: "T", Position: 1.0, IsPinned: false}
	if err := repos.Card.Create(card); err != nil {
		t.Fatalf("create card error: %v", err)
	}

	toggled, err := services.Card.TogglePin(card.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !toggled.IsPinned {
		t.Error("expected IsPinned=true after toggle")
	}

	toggled2, _ := services.Card.TogglePin(card.ID)
	if toggled2.IsPinned {
		t.Error("expected IsPinned=false after second toggle")
	}
}

func TestCardService_GetPinnedCards(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, _ := services.Board.CreateBoard("B")
	col, _ := services.Column.CreateColumn(board.ID, "Todo")

	_ = repos.Card.Create(&model.Card{ColumnID: col.ID, Title: "Pinned", Position: 1.0, IsPinned: true})
	_ = repos.Card.Create(&model.Card{ColumnID: col.ID, Title: "Normal", Position: 2.0, IsPinned: false})

	pinned, err := services.Card.GetPinnedCards()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(pinned) != 1 {
		t.Errorf("expected 1 pinned card, got %d", len(pinned))
	}
	if pinned[0].ColumnName != "Todo" {
		t.Errorf("expected column name 'Todo', got %q", pinned[0].ColumnName)
	}
	if pinned[0].BoardID != board.ID {
		t.Errorf("expected boardId %d, got %d", board.ID, pinned[0].BoardID)
	}
}
