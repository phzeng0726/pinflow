package repository

import (
	"strings"

	"pinflow/model"

	"gorm.io/gorm"
)

type TagRepository interface {
	CreateOrGet(name string, color string) (*model.Tag, error)
	ListAll() ([]model.Tag, error)
	FindByID(id uint) (*model.Tag, error)
	FindByName(name string) (*model.Tag, error)
	Update(tag *model.Tag) error
	Delete(id uint) error
	AttachToCard(cardID, tagID uint) error
	DetachFromCard(cardID, tagID uint) error
	ListByCard(cardID uint) ([]model.Tag, error)
}

type tagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) CreateOrGet(name string, color string) (*model.Tag, error) {
	name = strings.TrimSpace(name)
	var tag model.Tag
	err := r.db.Where("LOWER(name) = LOWER(?)", name).First(&tag).Error
	if err == nil {
		return &tag, nil
	}
	tag = model.Tag{Name: name, Color: color}
	if err := r.db.Create(&tag).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) FindByName(name string) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.Where("LOWER(name) = LOWER(?)", strings.TrimSpace(name)).First(&tag).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) Update(tag *model.Tag) error {
	return r.db.Save(tag).Error
}

func (r *tagRepository) Delete(id uint) error {
	// Delete card_tags associations first, then the tag
	if err := r.db.Exec("DELETE FROM card_tags WHERE tag_id = ?", id).Error; err != nil {
		return err
	}
	return r.db.Delete(&model.Tag{}, id).Error
}

func (r *tagRepository) ListAll() ([]model.Tag, error) {
	var tags []model.Tag
	err := r.db.Order("name asc").Find(&tags).Error
	return tags, err
}

func (r *tagRepository) FindByID(id uint) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.First(&tag, id).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) AttachToCard(cardID, tagID uint) error {
	card := model.Card{}
	card.ID = cardID
	tag := model.Tag{}
	tag.ID = tagID
	return r.db.Model(&card).Association("Tags").Append(&tag)
}

func (r *tagRepository) DetachFromCard(cardID, tagID uint) error {
	card := model.Card{}
	card.ID = cardID
	tag := model.Tag{}
	tag.ID = tagID
	return r.db.Model(&card).Association("Tags").Delete(&tag)
}

func (r *tagRepository) ListByCard(cardID uint) ([]model.Tag, error) {
	var tags []model.Tag
	card := model.Card{}
	card.ID = cardID
	err := r.db.Model(&card).Association("Tags").Find(&tags)
	return tags, err
}
