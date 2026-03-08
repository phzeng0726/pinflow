package repository

import (
	"pinflow/model"

	"gorm.io/gorm"
)

type ColumnRepository interface {
	Create(column *model.Column) error
	FindByID(id uint) (*model.Column, error)
	FindByBoardID(boardID uint) ([]model.Column, error)
	MaxPositionByBoard(boardID uint) (float64, error)
	Update(column *model.Column) error
	Delete(id uint) error
}

type columnRepository struct {
	db *gorm.DB
}

func NewColumnRepository(db *gorm.DB) ColumnRepository {
	return &columnRepository{db: db}
}

func (r *columnRepository) Create(column *model.Column) error {
	return r.db.Create(column).Error
}

func (r *columnRepository) FindByID(id uint) (*model.Column, error) {
	var column model.Column
	err := r.db.First(&column, id).Error
	if err != nil {
		return nil, err
	}
	return &column, nil
}

func (r *columnRepository) FindByBoardID(boardID uint) ([]model.Column, error) {
	var columns []model.Column
	err := r.db.Where("board_id = ?", boardID).Order("position asc").Find(&columns).Error
	return columns, err
}

func (r *columnRepository) MaxPositionByBoard(boardID uint) (float64, error) {
	var max float64
	err := r.db.Model(&model.Column{}).
		Where("board_id = ?", boardID).
		Select("COALESCE(MAX(position), 0)").
		Scan(&max).Error
	return max, err
}

func (r *columnRepository) Update(column *model.Column) error {
	return r.db.Save(column).Error
}

func (r *columnRepository) Delete(id uint) error {
	return r.db.Delete(&model.Column{}, id).Error
}
