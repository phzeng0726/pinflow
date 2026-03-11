package repository

import (
	"pinflow/model"

	"gorm.io/gorm"
)

type CardRepository interface {
	Create(card *model.Card) error
	FindByID(id uint) (*model.Card, error)
	FindDetail(id uint) (*model.Card, error)
	FindByColumnID(columnID uint) ([]model.Card, error)
	MaxPositionByColumn(columnID uint) (float64, error)
	Update(card *model.Card) error
	UpdateColumnAndPosition(id uint, columnID uint, position float64, isPinned bool) error
	UpdatePinned(id uint, isPinned bool) error
	FindPinned() ([]model.Card, error)
	Delete(id uint) error
}

type cardRepository struct {
	db *gorm.DB
}

func NewCardRepository(db *gorm.DB) CardRepository {
	return &cardRepository{db: db}
}

func (r *cardRepository) Create(card *model.Card) error {
	return r.db.Create(card).Error
}

func (r *cardRepository) FindByID(id uint) (*model.Card, error) {
	var card model.Card
	err := r.db.First(&card, id).Error
	if err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *cardRepository) FindDetail(id uint) (*model.Card, error) {
	var card model.Card
	err := r.db.
		Preload("Tags").
		Preload("Checklists", func(db *gorm.DB) *gorm.DB {
			return db.Order("id asc")
		}).
		Preload("Checklists.Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		First(&card, id).Error
	if err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *cardRepository) FindByColumnID(columnID uint) ([]model.Card, error) {
	var cards []model.Card
	err := r.db.Where("column_id = ?", columnID).Order("position asc").Find(&cards).Error
	return cards, err
}

func (r *cardRepository) MaxPositionByColumn(columnID uint) (float64, error) {
	var max float64
	err := r.db.Model(&model.Card{}).
		Where("column_id = ?", columnID).
		Select("COALESCE(MAX(position), 0)").
		Scan(&max).Error
	return max, err
}

func (r *cardRepository) Update(card *model.Card) error {
	return r.db.Save(card).Error
}

func (r *cardRepository) UpdateColumnAndPosition(id uint, columnID uint, position float64, isPinned bool) error {
	return r.db.Model(&model.Card{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"column_id": columnID,
			"position":  position,
			"is_pinned": isPinned,
		}).Error
}

func (r *cardRepository) UpdatePinned(id uint, isPinned bool) error {
	return r.db.Model(&model.Card{}).Where("id = ?", id).
		Update("is_pinned", isPinned).Error
}

func (r *cardRepository) FindPinned() ([]model.Card, error) {
	var cards []model.Card
	err := r.db.Where("is_pinned = ?", true).Order("updated_at desc").Find(&cards).Error
	return cards, err
}

func (r *cardRepository) Delete(id uint) error {
	return r.db.Delete(&model.Card{}, id).Error
}
