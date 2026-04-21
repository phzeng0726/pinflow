package repository

import (
	"time"

	"pinflow/model"
	"pinflow/store"
)

type columnRepository struct {
	s *store.FileStore
}

func newColumnRepository(s *store.FileStore) ColumnRepository {
	return &columnRepository{s: s}
}

func (r *columnRepository) Create(column *model.Column) error {
	column.ID = r.s.NextID("column")
	now := time.Now()
	column.CreatedAt = now
	column.UpdatedAt = now
	return r.s.CreateColumn(column)
}

func (r *columnRepository) FindByID(id uint) (*model.Column, error) {
	return r.s.GetColumn(id)
}

func (r *columnRepository) FindByBoardID(boardID uint) ([]model.Column, error) {
	return r.s.GetColumnsByBoard(boardID), nil
}

func (r *columnRepository) MaxPositionByBoard(boardID uint) (float64, error) {
	cols := r.s.GetColumnsByBoard(boardID)
	var max float64
	for _, c := range cols {
		if c.Position > max {
			max = c.Position
		}
	}
	return max, nil
}

func (r *columnRepository) Update(column *model.Column) error {
	column.UpdatedAt = time.Now()
	return r.s.UpdateColumn(column)
}

func (r *columnRepository) Delete(id uint) error {
	return r.s.DeleteColumn(id)
}
