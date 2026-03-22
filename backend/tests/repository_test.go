package tests

import (
	"testing"

	"pinflow/model"
	"pinflow/repository"
	"pinflow/store"
)

func setupTestStore(t *testing.T) *store.FileStore {
	t.Helper()
	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("failed to create test store: %v", err)
	}
	return fs
}

func TestBoardRepository_CreateAndFind(t *testing.T) {
	fs := setupTestStore(t)
	repo := repository.NewFileBoardRepository(fs)

	board := &model.Board{Name: "Test Board"}
	if err := repo.Create(board); err != nil {
		t.Fatalf("Create error: %v", err)
	}
	if board.ID == 0 {
		t.Fatal("expected non-zero ID after create")
	}

	found, err := repo.FindByID(board.ID)
	if err != nil {
		t.Fatalf("FindByID error: %v", err)
	}
	if found.Name != "Test Board" {
		t.Errorf("expected 'Test Board', got %q", found.Name)
	}
}

func TestBoardRepository_FindAll(t *testing.T) {
	fs := setupTestStore(t)
	repo := repository.NewFileBoardRepository(fs)

	for _, name := range []string{"A", "B", "C"} {
		_ = repo.Create(&model.Board{Name: name})
	}
	boards, err := repo.FindAll()
	if err != nil {
		t.Fatalf("FindAll error: %v", err)
	}
	if len(boards) != 3 {
		t.Errorf("expected 3 boards, got %d", len(boards))
	}
}

func TestBoardRepository_Delete(t *testing.T) {
	fs := setupTestStore(t)
	repo := repository.NewFileBoardRepository(fs)

	board := &model.Board{Name: "ToDelete"}
	_ = repo.Create(board)
	if err := repo.Delete(board.ID); err != nil {
		t.Fatalf("Delete error: %v", err)
	}
	if _, err := repo.FindByID(board.ID); err == nil {
		t.Fatal("expected error finding deleted board")
	}
}

func TestColumnRepository_PositionAndCreate(t *testing.T) {
	fs := setupTestStore(t)
	boardRepo := repository.NewFileBoardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)

	max, _ := colRepo.MaxPositionByBoard(board.ID)
	if max != 0 {
		t.Errorf("expected 0 for empty board, got %f", max)
	}

	col := &model.Column{BoardID: board.ID, Name: "Col1", Position: 1.0}
	_ = colRepo.Create(col)
	max, _ = colRepo.MaxPositionByBoard(board.ID)
	if max != 1.0 {
		t.Errorf("expected 1.0, got %f", max)
	}
}


func TestCardRepository_AutoPinOnCreate(t *testing.T) {
	fs := setupTestStore(t)
	boardRepo := repository.NewFileBoardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1.0}
	_ = colRepo.Create(col)

	card := &model.Card{ColumnID: col.ID, Title: "T", Position: 1.0, IsPinned: true}
	_ = cardRepo.Create(card)

	pinned, err := cardRepo.FindPinned()
	if err != nil {
		t.Fatalf("FindPinned error: %v", err)
	}
	if len(pinned) != 1 {
		t.Errorf("expected 1 pinned card, got %d", len(pinned))
	}
}

func TestCardRepository_UpdatePinned(t *testing.T) {
	fs := setupTestStore(t)
	boardRepo := repository.NewFileBoardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1.0}
	_ = colRepo.Create(col)

	card := &model.Card{ColumnID: col.ID, Title: "T", Position: 1.0, IsPinned: false}
	_ = cardRepo.Create(card)

	_ = cardRepo.UpdatePinned(card.ID, true)
	updated, _ := cardRepo.FindByID(card.ID)
	if !updated.IsPinned {
		t.Error("expected IsPinned=true after update")
	}
}

func TestCardRepository_CascadeDeleteWithColumn(t *testing.T) {
	fs := setupTestStore(t)
	boardRepo := repository.NewFileBoardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1.0}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1.0}
	_ = cardRepo.Create(card)

	_ = colRepo.Delete(col.ID)
	cards, _ := cardRepo.FindByColumnID(col.ID)
	if len(cards) != 0 {
		t.Errorf("expected cascade delete, got %d cards", len(cards))
	}
}
