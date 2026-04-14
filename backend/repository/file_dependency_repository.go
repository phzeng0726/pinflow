package repository

import (
	"pinflow/model"
	"pinflow/store"
	"time"
)

type fileDependencyRepository struct {
	s *store.FileStore
}

func NewFileDependencyRepository(s *store.FileStore) DependencyRepository {
	return &fileDependencyRepository{s: s}
}

func (r *fileDependencyRepository) Create(dep *model.Dependency) error {
	dep.CreatedAt = time.Now()
	return r.s.CreateDependency(dep)
}

func (r *fileDependencyRepository) Delete(id uint) error {
	return r.s.DeleteDependency(id)
}

func (r *fileDependencyRepository) ListByCard(cardID uint) ([]model.Dependency, error) {
	return r.s.ListDependenciesByCard(cardID), nil
}

func (r *fileDependencyRepository) CountByCard(cardID uint) (int, error) {
	return r.s.CountDependenciesByCard(cardID), nil
}
