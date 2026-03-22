package repository

import (
	"pinflow/model"

	"gorm.io/gorm"
)

type ChecklistRepository interface {
	Create(checklist *model.Checklist) error
	FindByID(id uint) (*model.Checklist, error)
	ListByCard(cardID uint) ([]model.Checklist, error)
	MaxPositionByCard(cardID uint) (float64, error)
	Update(checklist *model.Checklist) error
	Delete(id uint) error
}

type checklistRepository struct {
	db *gorm.DB
}

func NewChecklistRepository(db *gorm.DB) ChecklistRepository {
	return &checklistRepository{db: db}
}

func (r *checklistRepository) Create(checklist *model.Checklist) error {
	return r.db.Create(checklist).Error
}

func (r *checklistRepository) FindByID(id uint) (*model.Checklist, error) {
	var cl model.Checklist
	err := r.db.Preload("Items").First(&cl, id).Error
	if err != nil {
		return nil, err
	}
	return &cl, nil
}

func (r *checklistRepository) ListByCard(cardID uint) ([]model.Checklist, error) {
	var checklists []model.Checklist
	err := r.db.Where("card_id = ?", cardID).Order("position asc").Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("position asc")
	}).Find(&checklists).Error
	return checklists, err
}

func (r *checklistRepository) MaxPositionByCard(cardID uint) (float64, error) {
	var max float64
	err := r.db.Model(&model.Checklist{}).
		Where("card_id = ?", cardID).
		Select("COALESCE(MAX(position), 0)").
		Scan(&max).Error
	return max, err
}

func (r *checklistRepository) Update(checklist *model.Checklist) error {
	return r.db.Save(checklist).Error
}

func (r *checklistRepository) Delete(id uint) error {
	return r.db.Delete(&model.Checklist{}, id).Error
}
