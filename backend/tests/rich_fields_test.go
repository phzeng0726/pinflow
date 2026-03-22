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

	tag, err := repo.CreateOrGet("urgent", "")
	if err != nil {
		t.Fatalf("CreateOrGet error: %v", err)
	}
	if tag.ID == 0 || tag.Name != "urgent" {
		t.Errorf("unexpected tag: %+v", tag)
	}

	// Getting same name returns existing tag
	tag2, err := repo.CreateOrGet("urgent", "")
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

	tag1, _ := repo.CreateOrGet("Bug", "")
	tag2, _ := repo.CreateOrGet("bug", "")
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

	tag, _ := tagRepo.CreateOrGet("feature", "")

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
	svc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	start := time.Now()
	end := start.Add(-1 * time.Hour) // end before start

	_, err := svc.UpdateCard(card.ID, "Card", "", nil, &start, &end)
	if err == nil {
		t.Fatal("expected error when end_time < start_time")
	}
}

func TestCardService_UpdateCard_ScheduleSet(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	svc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	start := time.Now()
	end := start.Add(2 * time.Hour)

	updated, err := svc.UpdateCard(card.ID, "Card", "", nil, &start, &end)
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

// --- Story point tests ---

func TestCardService_UpdateCard_StoryPoint(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	svc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	// Set story point
	sp := 5
	updated, err := svc.UpdateCard(card.ID, "Card", "", &sp, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.StoryPoint == nil || *updated.StoryPoint != 5 {
		t.Errorf("expected story_point=5, got %v", updated.StoryPoint)
	}

	// Clear story point
	updated, err = svc.UpdateCard(card.ID, "Card", "", nil, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.StoryPoint != nil {
		t.Errorf("expected story_point=nil, got %v", *updated.StoryPoint)
	}
}

func TestCardService_UpdateCard_StoryPointNegative(t *testing.T) {
	db := setupTestDB(t)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	svc := service.NewCardService(cardRepo, colRepo, repository.NewTagRepository(db), repository.NewChecklistRepository(db), repository.NewChecklistItemRepository(db))

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	sp := -1
	_, err := svc.UpdateCard(card.ID, "Card", "", &sp, nil, nil)
	if err == nil {
		t.Fatal("expected error for negative story point")
	}
}

// --- Tag color, update, delete tests ---

func TestTagRepository_CreateOrGet_WithColor(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewTagRepository(db)

	tag, err := repo.CreateOrGet("urgent", "red")
	if err != nil {
		t.Fatalf("CreateOrGet error: %v", err)
	}
	if tag.Color != "red" {
		t.Errorf("expected color=red, got %s", tag.Color)
	}
}

func TestTagService_UpdateTag(t *testing.T) {
	db := setupTestDB(t)
	tagRepo := repository.NewTagRepository(db)
	cardRepo := repository.NewCardRepository(db)
	svc := service.NewTagService(tagRepo, cardRepo)

	tag, _ := svc.CreateOrGet("feature", "blue")

	newName := "enhancement"
	newColor := "green"
	updated, err := svc.UpdateTag(tag.ID, dto.UpdateTagRequest{Name: &newName, Color: &newColor})
	if err != nil {
		t.Fatalf("UpdateTag error: %v", err)
	}
	if updated.Name != "enhancement" || updated.Color != "green" {
		t.Errorf("unexpected tag: %+v", updated)
	}
}

func TestTagService_UpdateTag_DuplicateName(t *testing.T) {
	db := setupTestDB(t)
	tagRepo := repository.NewTagRepository(db)
	cardRepo := repository.NewCardRepository(db)
	svc := service.NewTagService(tagRepo, cardRepo)

	svc.CreateOrGet("bug", "red")
	tag2, _ := svc.CreateOrGet("feature", "blue")

	dupName := "bug"
	_, err := svc.UpdateTag(tag2.ID, dto.UpdateTagRequest{Name: &dupName})
	if err == nil {
		t.Fatal("expected error for duplicate tag name")
	}
}

func TestTagService_DeleteTag(t *testing.T) {
	db := setupTestDB(t)
	tagRepo := repository.NewTagRepository(db)
	cardRepo := repository.NewCardRepository(db)
	colRepo := repository.NewColumnRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	svc := service.NewTagService(tagRepo, cardRepo)

	board := &model.Board{Name: "B"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "C", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card", Position: 1}
	_ = cardRepo.Create(card)

	tag, _ := svc.CreateOrGet("toDelete", "")
	_ = svc.AttachToCard(card.ID, tag.ID)

	if err := svc.DeleteTag(tag.ID); err != nil {
		t.Fatalf("DeleteTag error: %v", err)
	}

	// Verify tag is gone
	tags, _ := svc.ListAll()
	for _, tt := range tags {
		if tt.ID == tag.ID {
			t.Error("tag should be deleted")
		}
	}

	// Verify association is gone
	cardTags, _ := svc.ListByCard(card.ID)
	if len(cardTags) != 0 {
		t.Errorf("expected 0 tags on card after delete, got %d", len(cardTags))
	}
}

// --- Checklist title update tests ---

func TestChecklistService_UpdateChecklist(t *testing.T) {
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

	cl, _ := svc.CreateChecklist(card.ID, "Original Title")

	updated, err := svc.UpdateChecklist(cl.ID, "Updated Title")
	if err != nil {
		t.Fatalf("UpdateChecklist error: %v", err)
	}
	if updated.Title != "Updated Title" {
		t.Errorf("expected title='Updated Title', got '%s'", updated.Title)
	}
}
