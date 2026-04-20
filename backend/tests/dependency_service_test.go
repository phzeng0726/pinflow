package tests

import (
	"testing"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
	"pinflow/store"
)

func setupDepService(t *testing.T) (service.DependencyService, service.CardService, repository.CardRepository, repository.ColumnRepository, repository.BoardRepository) {
	t.Helper()
	fs := setupTestStore(t)
	depRepo := repository.NewFileDependencyRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	boardRepo := repository.NewFileBoardRepository(fs)
	clRepo := repository.NewFileChecklistRepository(fs)
	itemRepo := repository.NewFileChecklistItemRepository(fs)

	depSvc := service.NewDependencyService(depRepo, cardRepo, colRepo, boardRepo)
	cardSvc := service.NewCardService(cardRepo, colRepo, boardRepo, nil, clRepo, itemRepo, depRepo, nil)
	return depSvc, cardSvc, cardRepo, colRepo, boardRepo
}

func createCard(t *testing.T, cardRepo repository.CardRepository, colRepo repository.ColumnRepository, boardRepo repository.BoardRepository) *model.Card {
	t.Helper()
	board := &model.Board{Name: "Board"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "Col", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card"}
	_ = cardRepo.Create(card)
	return card
}

func TestDepService_Create(t *testing.T) {
	depSvc, _, cardRepo, colRepo, boardRepo := setupDepService(t)

	card1 := createCard(t, cardRepo, colRepo, boardRepo)
	card2 := createCard(t, cardRepo, colRepo, boardRepo)

	resp, err := depSvc.CreateForCard(card1.ID, dto.CreateDependencyRequest{
		ToCardID: card2.ID,
		Type:     model.DependencyTypeBlocks,
	})
	if err != nil {
		t.Fatalf("CreateForCard error: %v", err)
	}
	if resp.ID == 0 {
		t.Error("expected non-zero ID")
	}
	if resp.FromCard.ID != card1.ID {
		t.Errorf("expected fromCard.ID=%d, got %d", card1.ID, resp.FromCard.ID)
	}
	if resp.ToCard.ID != card2.ID {
		t.Errorf("expected toCard.ID=%d, got %d", card2.ID, resp.ToCard.ID)
	}
}

func TestDepService_ListByCard_BothSides(t *testing.T) {
	depSvc, _, cardRepo, colRepo, boardRepo := setupDepService(t)

	card1 := createCard(t, cardRepo, colRepo, boardRepo)
	card2 := createCard(t, cardRepo, colRepo, boardRepo)
	card3 := createCard(t, cardRepo, colRepo, boardRepo)

	// card1 blocks card2
	_, _ = depSvc.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	// card3 related to card1
	_, _ = depSvc.CreateForCard(card3.ID, dto.CreateDependencyRequest{ToCardID: card1.ID, Type: model.DependencyTypeRelatedTo})

	deps, err := depSvc.ListByCard(card1.ID)
	if err != nil {
		t.Fatalf("ListByCard error: %v", err)
	}
	if len(deps) != 2 {
		t.Errorf("expected 2 deps for card1, got %d", len(deps))
	}
}

func TestDepService_SelfReference_Rejected(t *testing.T) {
	depSvc, _, cardRepo, colRepo, boardRepo := setupDepService(t)

	card := createCard(t, cardRepo, colRepo, boardRepo)

	_, err := depSvc.CreateForCard(card.ID, dto.CreateDependencyRequest{
		ToCardID: card.ID,
		Type:     model.DependencyTypeBlocks,
	})
	if err != store.ErrSelfReference {
		t.Errorf("expected ErrSelfReference, got %v", err)
	}
}

func TestDepService_Duplicate_Rejected(t *testing.T) {
	depSvc, _, cardRepo, colRepo, boardRepo := setupDepService(t)

	card1 := createCard(t, cardRepo, colRepo, boardRepo)
	card2 := createCard(t, cardRepo, colRepo, boardRepo)

	_, _ = depSvc.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	_, err := depSvc.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	if err != store.ErrDependencyConflict {
		t.Errorf("expected ErrDependencyConflict, got %v", err)
	}
}

func TestDepService_RelatedTo_BidirectionalDuplicate_Rejected(t *testing.T) {
	depSvc, _, cardRepo, colRepo, boardRepo := setupDepService(t)

	card1 := createCard(t, cardRepo, colRepo, boardRepo)
	card2 := createCard(t, cardRepo, colRepo, boardRepo)

	_, _ = depSvc.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeRelatedTo})
	_, err := depSvc.CreateForCard(card2.ID, dto.CreateDependencyRequest{ToCardID: card1.ID, Type: model.DependencyTypeRelatedTo})
	if err != store.ErrDependencyConflict {
		t.Errorf("expected ErrDependencyConflict for reverse related_to, got %v", err)
	}
}

func TestDepService_DeleteCard_CleansUpDependencies(t *testing.T) {
	depSvc, cardSvc, cardRepo, colRepo, boardRepo := setupDepService(t)

	card1 := createCard(t, cardRepo, colRepo, boardRepo)
	card2 := createCard(t, cardRepo, colRepo, boardRepo)

	_, _ = depSvc.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})

	// Delete card1
	if err := cardSvc.DeleteCard(card1.ID); err != nil {
		t.Fatalf("DeleteCard error: %v", err)
	}

	// card2 should have no deps now
	deps, _ := depSvc.ListByCard(card2.ID)
	if len(deps) != 0 {
		t.Errorf("expected 0 deps after card deletion, got %d", len(deps))
	}
}
