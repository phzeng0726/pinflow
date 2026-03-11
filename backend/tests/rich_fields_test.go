package tests

import (
	"testing"
	"time"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
)

// --- Tag repository tests ---

func TestTagRepository_CreateOrGet(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewTagRepository(db)

	tag, err := repo.CreateOrGet("urgent")
	if err != nil {
		t.Fatalf("CreateOrGet error: %v", err)
	}
	if tag.ID == 0 || tag.Name != "urgent" {
		t.Errorf("unexpected tag: %+v", tag)
	}

	// Getting same name returns existing tag
	tag2, err := repo.CreateOrGet("urgent")
	if err != nil {
		t.Fatalf("CreateOrGet (duplicate) error: %v", err)
	}
	if tag2.ID != tag.ID {
		t.Errorf("expected same ID %d, got %d", tag.ID, tag2.ID)
	}
}

func TestTagRepository_CreateOrGet_CaseInsensitive(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewTagRepository(db)

	tag1, _ := repo.CreateOrGet("Bug")
	tag2, _ := repo.CreateOrGet("bug")
	if tag1.ID != tag2.ID {
		t.Errorf("expected case-insensitive match: got IDs %d and %d", tag1.ID, tag2.ID)
	}
}

func TestTagRepository_AttachDetach(t *testing.T) {
	db := setupTestDB(t)
	tagRepo := repository.NewTagRepository(db)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)

	// Setup: board -> column -> card
	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	tag, _ := tagRepo.CreateOrGet("feature")

	// Attach
	if err := tagRepo.AttachToCard(card.ID, tag.ID); err != nil {
		t.Fatalf("AttachToCard error: %v", err)
	}

	tags, err := tagRepo.ListByCard(card.ID)
	if err != nil {
		t.Fatalf("ListByCard error: %v", err)
	}
	if len(tags) != 1 || tags[0].ID != tag.ID {
		t.Errorf("expected 1 tag, got %v", tags)
	}

	// Detach
	if err := tagRepo.DetachFromCard(card.ID, tag.ID); err != nil {
		t.Fatalf("DetachFromCard error: %v", err)
	}
	tags, _ = tagRepo.ListByCard(card.ID)
	if len(tags) != 0 {
		t.Errorf("expected 0 tags after detach, got %d", len(tags))
	}
}

// --- Schedule validation tests ---

func TestCardService_UpdateCard_ScheduleValidation(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	svc := service.NewCardService(cardRepo, colRepo)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	start := time.Now()
	end := start.Add(-1 * time.Hour) // end before start

	_, err := svc.UpdateCard(card.ID, "Card", "", &start, &end)
	if err == nil {
		t.Fatal("expected error when end_time < start_time")
	}
}

func TestCardService_UpdateCard_ScheduleSet(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	svc := service.NewCardService(cardRepo, colRepo)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	start := time.Now()
	end := start.Add(2 * time.Hour)

	updated, err := svc.UpdateCard(card.ID, "Card", "", &start, &end)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.StartTime == nil || updated.EndTime == nil {
		t.Error("expected schedule to be set")
	}
}

// --- Checklist service tests ---

func TestChecklistService_CreateAndList(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	clRepo := repository.NewChecklistRepository(db)
	itemRepo := repository.NewChecklistItemRepository(db)
	svc := service.NewChecklistService(clRepo, itemRepo, cardRepo)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	cl, err := svc.CreateChecklist(card.ID, "My Checklist")
	if err != nil {
		t.Fatalf("CreateChecklist error: %v", err)
	}
	if cl.Title != "My Checklist" || cl.CardID != card.ID {
		t.Errorf("unexpected checklist: %+v", cl)
	}

	cls, err := svc.ListByCard(card.ID)
	if err != nil {
		t.Fatalf("ListByCard error: %v", err)
	}
	if len(cls) != 1 {
		t.Errorf("expected 1 checklist, got %d", len(cls))
	}
}

func TestChecklistService_Item_CreateToggleDelete(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	clRepo := repository.NewChecklistRepository(db)
	itemRepo := repository.NewChecklistItemRepository(db)
	svc := service.NewChecklistService(clRepo, itemRepo, cardRepo)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)
	cl, _ := svc.CreateChecklist(card.ID, "CL")

	item, err := svc.CreateItem(cl.ID, "Do something", 0)
	if err != nil {
		t.Fatalf("CreateItem error: %v", err)
	}
	if item.Completed {
		t.Error("new item should not be completed")
	}

	completed := true
	updated, err := svc.UpdateItem(item.ID, dto.UpdateChecklistItemRequest{Completed: &completed})
	if err != nil {
		t.Fatalf("UpdateItem error: %v", err)
	}
	if !updated.Completed {
		t.Error("item should be completed after update")
	}

	if err := svc.DeleteItem(item.ID); err != nil {
		t.Fatalf("DeleteItem error: %v", err)
	}
}
