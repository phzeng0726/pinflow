package tests

import (
	"testing"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
	"pinflow/store"
)

func setupDepService(t *testing.T) (*service.Services, *repository.Repositories) {
	t.Helper()
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	return services, repos
}

func createCard(t *testing.T, repos *repository.Repositories) *model.Card {
	t.Helper()
	board := &model.Board{Name: "Board"}
	_ = repos.Board.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "Col", Position: 1}
	_ = repos.Column.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Card"}
	_ = repos.Card.Create(card)
	return card
}

func TestDepService_Create(t *testing.T) {
	services, repos := setupDepService(t)

	card1 := createCard(t, repos)
	card2 := createCard(t, repos)

	resp, err := services.Dependency.CreateForCard(card1.ID, dto.CreateDependencyRequest{
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
	services, repos := setupDepService(t)

	card1 := createCard(t, repos)
	card2 := createCard(t, repos)
	card3 := createCard(t, repos)

	// card1 blocks card2
	_, _ = services.Dependency.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	// card3 related to card1
	_, _ = services.Dependency.CreateForCard(card3.ID, dto.CreateDependencyRequest{ToCardID: card1.ID, Type: model.DependencyTypeRelatedTo})

	deps, err := services.Dependency.ListByCard(card1.ID)
	if err != nil {
		t.Fatalf("ListByCard error: %v", err)
	}
	if len(deps) != 2 {
		t.Errorf("expected 2 deps for card1, got %d", len(deps))
	}
}

func TestDepService_SelfReference_Rejected(t *testing.T) {
	services, repos := setupDepService(t)

	card := createCard(t, repos)

	_, err := services.Dependency.CreateForCard(card.ID, dto.CreateDependencyRequest{
		ToCardID: card.ID,
		Type:     model.DependencyTypeBlocks,
	})
	if err != store.ErrSelfReference {
		t.Errorf("expected ErrSelfReference, got %v", err)
	}
}

func TestDepService_Duplicate_Rejected(t *testing.T) {
	services, repos := setupDepService(t)

	card1 := createCard(t, repos)
	card2 := createCard(t, repos)

	_, _ = services.Dependency.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	_, err := services.Dependency.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	if err != store.ErrDependencyConflict {
		t.Errorf("expected ErrDependencyConflict, got %v", err)
	}
}

func TestDepService_RelatedTo_BidirectionalDuplicate_Rejected(t *testing.T) {
	services, repos := setupDepService(t)

	card1 := createCard(t, repos)
	card2 := createCard(t, repos)

	_, _ = services.Dependency.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeRelatedTo})
	_, err := services.Dependency.CreateForCard(card2.ID, dto.CreateDependencyRequest{ToCardID: card1.ID, Type: model.DependencyTypeRelatedTo})
	if err != store.ErrDependencyConflict {
		t.Errorf("expected ErrDependencyConflict for reverse related_to, got %v", err)
	}
}

func TestDepService_DeleteCard_CleansUpDependencies(t *testing.T) {
	services, repos := setupDepService(t)

	card1 := createCard(t, repos)
	card2 := createCard(t, repos)

	_, _ = services.Dependency.CreateForCard(card1.ID, dto.CreateDependencyRequest{ToCardID: card2.ID, Type: model.DependencyTypeBlocks})

	// Delete card1
	if err := services.Card.DeleteCard(card1.ID); err != nil {
		t.Fatalf("DeleteCard error: %v", err)
	}

	// card2 should have no deps now
	deps, _ := services.Dependency.ListByCard(card2.ID)
	if len(deps) != 0 {
		t.Errorf("expected 0 deps after card deletion, got %d", len(deps))
	}
}
