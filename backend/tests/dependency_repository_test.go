package tests

import (
	"testing"

	"pinflow/model"
	"pinflow/repository"
)

func setupDependencyRepo(t *testing.T) (repository.DependencyRepository, repository.CardRepository, repository.ColumnRepository, repository.BoardRepository) {
	t.Helper()
	fs := setupTestStore(t)
	depRepo := repository.NewFileDependencyRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)
	colRepo := repository.NewFileColumnRepository(fs)
	boardRepo := repository.NewFileBoardRepository(fs)
	return depRepo, cardRepo, colRepo, boardRepo
}

func createTestCardForDep(t *testing.T, cardRepo repository.CardRepository, colRepo repository.ColumnRepository, boardRepo repository.BoardRepository) *model.Card {
	t.Helper()
	board := &model.Board{Name: "Test Board"}
	_ = boardRepo.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "Col", Position: 1}
	_ = colRepo.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Test Card"}
	_ = cardRepo.Create(card)
	return card
}

func TestDependencyRepository_Create(t *testing.T) {
	depRepo, cardRepo, colRepo, boardRepo := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)
	card2 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)

	dep := &model.Dependency{
		FromCardID: card1.ID,
		ToCardID:   card2.ID,
		Type:       model.DependencyTypeBlocks,
	}
	if err := depRepo.Create(dep); err != nil {
		t.Fatalf("Create error: %v", err)
	}
	if dep.ID == 0 {
		t.Fatal("expected non-zero ID")
	}
}

func TestDependencyRepository_ListByCard(t *testing.T) {
	depRepo, cardRepo, colRepo, boardRepo := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)
	card2 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)
	card3 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)

	_ = depRepo.Create(&model.Dependency{FromCardID: card1.ID, ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	_ = depRepo.Create(&model.Dependency{FromCardID: card3.ID, ToCardID: card1.ID, Type: model.DependencyTypeRelatedTo})

	deps, err := depRepo.ListByCard(card1.ID)
	if err != nil {
		t.Fatalf("ListByCard error: %v", err)
	}
	if len(deps) != 2 {
		t.Errorf("expected 2 deps, got %d", len(deps))
	}
}

func TestDependencyRepository_CountByCard(t *testing.T) {
	depRepo, cardRepo, colRepo, boardRepo := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)
	card2 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)

	_ = depRepo.Create(&model.Dependency{FromCardID: card1.ID, ToCardID: card2.ID, Type: model.DependencyTypeBlocks})

	count, err := depRepo.CountByCard(card1.ID)
	if err != nil {
		t.Fatalf("CountByCard error: %v", err)
	}
	if count != 1 {
		t.Errorf("expected 1, got %d", count)
	}
}

func TestDependencyRepository_Delete(t *testing.T) {
	depRepo, cardRepo, colRepo, boardRepo := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)
	card2 := createTestCardForDep(t, cardRepo, colRepo, boardRepo)

	dep := &model.Dependency{FromCardID: card1.ID, ToCardID: card2.ID, Type: model.DependencyTypeBlocks}
	_ = depRepo.Create(dep)

	if err := depRepo.Delete(dep.ID); err != nil {
		t.Fatalf("Delete error: %v", err)
	}

	deps, _ := depRepo.ListByCard(card1.ID)
	if len(deps) != 0 {
		t.Errorf("expected 0 deps after delete, got %d", len(deps))
	}
}
