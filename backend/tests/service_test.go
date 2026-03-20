package tests

import (
	"testing"

	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
)

func TestBoardService_CreateValidation(t *testing.T) {
	db := setupTestDB(t)
	svc := service.NewBoardService(repository.NewBoardRepository(db))

	_, err := svc.CreateBoard("")
	if err == nil {
		t.Fatal("expected error for empty board name")
	}

	board, err := svc.CreateBoard("  MyBoard  ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if board.Name != "MyBoard" {
		t.Errorf("expected trimmed name 'MyBoard', got %q", board.Name)
	}
}

func TestBoardService_Delete_NotFound(t *testing.T) {
	db := setupTestDB(t)
	svc := service.NewBoardService(repository.NewBoardRepository(db))

	err := svc.DeleteBoard(999)
	if err == nil {
		t.Fatal("expected error deleting non-existent board")
	}
}

func TestColumnService_CreateColumn_Position(t *testing.T) {
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)

	board, _ := boardSvc.CreateBoard("B")

	col1, err := colSvc.CreateColumn(board.ID, "Todo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if col1.Position != 1.0 {
		t.Errorf("expected position 1.0, got %f", col1.Position)
	}

	col2, _ := colSvc.CreateColumn(board.ID, "InProgress")
	if col2.Position != 2.0 {
		t.Errorf("expected position 2.0, got %f", col2.Position)
	}
}

func TestColumnService_AutoPinToggle(t *testing.T) {
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)

	board, _ := boardSvc.CreateBoard("B")
	col, _ := colSvc.CreateColumn(board.ID, "InProgress")

	autoPin := true
	updated, err := colSvc.UpdateColumn(col.ID, service.UpdateColumnInput{AutoPin: &autoPin})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !updated.AutoPin {
		t.Error("expected AutoPin=true")
	}
}

func TestCardService_CreateCard_AutoPin(t *testing.T) {
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)
	cardSvc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board, _ := boardSvc.CreateBoard("B")
	col, _ := colSvc.CreateColumn(board.ID, "InProgress")

	autoPin := true
	_, _ = colSvc.UpdateColumn(col.ID, service.UpdateColumnInput{AutoPin: &autoPin})

	card, err := cardSvc.CreateCard(col.ID, "Task", "desc")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !card.IsPinned {
		t.Error("expected card to be auto-pinned")
	}
}

func TestCardService_MoveCard_TriggersAutoPin(t *testing.T) {
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)
	cardSvc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board, _ := boardSvc.CreateBoard("B")
	todoCol, _ := colSvc.CreateColumn(board.ID, "Todo")
	inProgressCol, _ := colSvc.CreateColumn(board.ID, "InProgress")

	autoPin := true
	_, _ = colSvc.UpdateColumn(inProgressCol.ID, service.UpdateColumnInput{AutoPin: &autoPin})

	card, _ := cardSvc.CreateCard(todoCol.ID, "Task", "")
	if card.IsPinned {
		t.Error("expected card not pinned initially")
	}

	moved, err := cardSvc.MoveCard(card.ID, inProgressCol.ID, 1.0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !moved.IsPinned {
		t.Error("expected card to be auto-pinned after move to auto-pin column")
	}
}

func TestCardService_TogglePin(t *testing.T) {
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)
	cardSvc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board, _ := boardSvc.CreateBoard("B")
	col, _ := colSvc.CreateColumn(board.ID, "Todo")

	card := &model.Card{ColumnID: col.ID, Title: "T", Position: 1.0, IsPinned: false}
	if err := cardRepo.Create(card); err != nil {
		t.Fatalf("create card error: %v", err)
	}

	toggled, err := cardSvc.TogglePin(card.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !toggled.IsPinned {
		t.Error("expected IsPinned=true after toggle")
	}

	toggled2, _ := cardSvc.TogglePin(card.ID)
	if toggled2.IsPinned {
		t.Error("expected IsPinned=false after second toggle")
	}
}

func TestCardService_GetPinnedCards(t *testing.T) {
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)
	boardSvc := service.NewBoardService(boardRepo)
	colSvc := service.NewColumnService(boardRepo, colRepo)
	cardSvc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board, _ := boardSvc.CreateBoard("B")
	col, _ := colSvc.CreateColumn(board.ID, "Todo")

	_ = cardRepo.Create(&model.Card{ColumnID: col.ID, Title: "Pinned", Position: 1.0, IsPinned: true})
	_ = cardRepo.Create(&model.Card{ColumnID: col.ID, Title: "Normal", Position: 2.0, IsPinned: false})

	pinned, err := cardSvc.GetPinnedCards()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(pinned) != 1 {
		t.Errorf("expected 1 pinned card, got %d", len(pinned))
	}
	if pinned[0].ColumnName != "Todo" {
		t.Errorf("expected column name 'Todo', got %q", pinned[0].ColumnName)
	}
}
