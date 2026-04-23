package repository

import (
	"pinflow/model"
	"pinflow/store"
	"time"
)

type dependencyRepository struct {
	s *store.FileStore
}

func newDependencyRepository(s *store.FileStore) DependencyRepository {
	return &dependencyRepository{s: s}
}

func (r *dependencyRepository) Create(dep *model.Dependency) error {
	dep.CreatedAt = time.Now()
	return r.s.CreateDependency(dep)
}

func (r *dependencyRepository) Delete(id uint) error {
	return r.s.DeleteDependency(id)
}

func (r *dependencyRepository) ListByCard(cardID uint) ([]model.Dependency, error) {
	return r.s.ListDependenciesByCard(cardID), nil
}

func (r *dependencyRepository) ListByBoard(boardID uint) ([]model.Dependency, error) {
	return r.s.ListDependenciesByBoard(boardID), nil
}

func (r *dependencyRepository) CountByCard(cardID uint) (int, error) {
	return r.s.CountDependenciesByCard(cardID), nil
}
