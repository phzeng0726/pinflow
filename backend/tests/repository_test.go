package tests

import (
	"testing"

	"pinflow/model"
	"pinflow/repository"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:?_pragma=foreign_keys(1)"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	if err := db.AutoMigrate(
		&model.Board{}, &model.Column{}, &model.Card{},
		&model.Tag{}, &model.Checklist{}, &model.ChecklistItem{},
	); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	return db
}

func TestBoardRepository_CreateAndFind(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewBoardRepository(db)

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
	db := setupTestDB(t)
	repo := repository.NewBoardRepository(db)

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
	db := setupTestDB(t)
	repo := repository.NewBoardRepository(db)

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
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)

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
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)

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
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)

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
	db := setupTestDB(t)
	boardRepo := repository.NewBoardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)

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
