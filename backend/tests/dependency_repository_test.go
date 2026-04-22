package tests

import (
	"testing"

	"pinflow/model"
	"pinflow/repository"
)

func setupDependencyRepo(t *testing.T) *repository.Repositories {
	t.Helper()
	fs := setupTestStore(t)
	return repository.NewRepositories(fs)
}

func createTestCardForDep(t *testing.T, repos *repository.Repositories) *model.Card {
	t.Helper()
	board := &model.Board{Name: "Test Board"}
	_ = repos.Board.Create(board)
	col := &model.Column{BoardID: board.ID, Name: "Col", Position: 1}
	_ = repos.Column.Create(col)
	card := &model.Card{ColumnID: col.ID, Title: "Test Card"}
	_ = repos.Card.Create(card)
	return card
}

func TestDependencyRepository_Create(t *testing.T) {
	repos := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, repos)
	card2 := createTestCardForDep(t, repos)

	dep := &model.Dependency{
		FromCardID: card1.ID,
		ToCardID:   card2.ID,
		Type:       model.DependencyTypeBlocks,
	}
	if err := repos.Dependency.Create(dep); err != nil {
		t.Fatalf("Create error: %v", err)
	}
	if dep.ID == 0 {
		t.Fatal("expected non-zero ID")
	}
}

func TestDependencyRepository_ListByCard(t *testing.T) {
	repos := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, repos)
	card2 := createTestCardForDep(t, repos)
	card3 := createTestCardForDep(t, repos)

	_ = repos.Dependency.Create(&model.Dependency{FromCardID: card1.ID, ToCardID: card2.ID, Type: model.DependencyTypeBlocks})
	_ = repos.Dependency.Create(&model.Dependency{FromCardID: card3.ID, ToCardID: card1.ID, Type: model.DependencyTypeRelatedTo})

	deps, err := repos.Dependency.ListByCard(card1.ID)
	if err != nil {
		t.Fatalf("ListByCard error: %v", err)
	}
	if len(deps) != 2 {
		t.Errorf("expected 2 deps, got %d", len(deps))
	}
}

func TestDependencyRepository_CountByCard(t *testing.T) {
	repos := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, repos)
	card2 := createTestCardForDep(t, repos)

	_ = repos.Dependency.Create(&model.Dependency{FromCardID: card1.ID, ToCardID: card2.ID, Type: model.DependencyTypeBlocks})

	count, err := repos.Dependency.CountByCard(card1.ID)
	if err != nil {
		t.Fatalf("CountByCard error: %v", err)
	}
	if count != 1 {
		t.Errorf("expected 1, got %d", count)
	}
}

func TestDependencyRepository_Delete(t *testing.T) {
	repos := setupDependencyRepo(t)

	card1 := createTestCardForDep(t, repos)
	card2 := createTestCardForDep(t, repos)

	dep := &model.Dependency{FromCardID: card1.ID, ToCardID: card2.ID, Type: model.DependencyTypeBlocks}
	_ = repos.Dependency.Create(dep)

	if err := repos.Dependency.Delete(dep.ID); err != nil {
		t.Fatalf("Delete error: %v", err)
	}

	deps, _ := repos.Dependency.ListByCard(card1.ID)
	if len(deps) != 0 {
		t.Errorf("expected 0 deps after delete, got %d", len(deps))
	}
}
