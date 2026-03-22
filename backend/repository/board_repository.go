package repository

import (
	"pinflow/model"

	"gorm.io/gorm"
)

type BoardRepository interface {
	Create(board *model.Board) error
	FindAll() ([]model.Board, error)
	FindByID(id uint) (*model.Board, error)
	Update(board *model.Board) error
	Delete(id uint) error
}

type boardRepository struct {
	db *gorm.DB
}

func NewBoardRepository(db *gorm.DB) BoardRepository {
	return &boardRepository{db: db}
}

func (r *boardRepository) Create(board *model.Board) error {
	return r.db.Create(board).Error
}

func (r *boardRepository) FindAll() ([]model.Board, error) {
	var boards []model.Board
	err := r.db.Order("created_at asc").Find(&boards).Error
	return boards, err
}

func (r *boardRepository) FindByID(id uint) (*model.Board, error) {
	var board model.Board
	err := r.db.
		Preload("Columns", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		Preload("Columns.Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		Preload("Columns.Cards.Tags").
		Preload("Columns.Cards.Checklists", func(db *gorm.DB) *gorm.DB {
			return db.Order("id asc")
		}).
		Preload("Columns.Cards.Checklists.Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		First(&board, id).Error
	if err != nil {
		return nil, err
	}
	return &board, nil
}

func (r *boardRepository) Update(board *model.Board) error {
	return r.db.Save(board).Error
}

func (r *boardRepository) Delete(id uint) error {
	return r.db.Delete(&model.Board{}, id).Error
}
