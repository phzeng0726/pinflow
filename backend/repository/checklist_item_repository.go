package repository

import (
	"pinflow/model"

	"gorm.io/gorm"
)

type ChecklistItemRepository interface {
	Create(item *model.ChecklistItem) error
	FindByID(id uint) (*model.ChecklistItem, error)
	MaxPositionByChecklist(checklistID uint) (float64, error)
	Update(item *model.ChecklistItem) error
	Delete(id uint) error
}

type checklistItemRepository struct {
	db *gorm.DB
}

func NewChecklistItemRepository(db *gorm.DB) ChecklistItemRepository {
	return &checklistItemRepository{db: db}
}

func (r *checklistItemRepository) Create(item *model.ChecklistItem) error {
	return r.db.Create(item).Error
}

func (r *checklistItemRepository) FindByID(id uint) (*model.ChecklistItem, error) {
	var item model.ChecklistItem
	err := r.db.First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *checklistItemRepository) MaxPositionByChecklist(checklistID uint) (float64, error) {
	var max float64
	err := r.db.Model(&model.ChecklistItem{}).
		Where("checklist_id = ?", checklistID).
		Select("COALESCE(MAX(position), 0)").
		Scan(&max).Error
	return max, err
}

func (r *checklistItemRepository) Update(item *model.ChecklistItem) error {
	return r.db.Save(item).Error
}

func (r *checklistItemRepository) Delete(id uint) error {
	return r.db.Delete(&model.ChecklistItem{}, id).Error
}
