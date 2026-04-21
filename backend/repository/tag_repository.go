package repository

import (
	"strings"

	"pinflow/model"
	"pinflow/store"
)

type tagRepository struct {
	s *store.FileStore
}

func newTagRepository(s *store.FileStore) TagRepository {
	return &tagRepository{s: s}
}

func (r *tagRepository) CreateOrGet(name string, color string) (*model.Tag, error) {
	name = strings.TrimSpace(name)

	// Check if tag already exists (case-insensitive)
	existing, err := r.s.GetTagByName(name)
	if err == nil {
		return existing, nil
	}

	tag := &model.Tag{
		ID:    r.s.NextID("tag"),
		Name:  name,
		Color: color,
	}
	if err := r.s.CreateTag(tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (r *tagRepository) ListAll() ([]model.Tag, error) {
	return r.s.GetAllTags(), nil
}

func (r *tagRepository) FindByID(id uint) (*model.Tag, error) {
	return r.s.GetTag(id)
}

func (r *tagRepository) FindByName(name string) (*model.Tag, error) {
	return r.s.GetTagByName(name)
}

func (r *tagRepository) Update(tag *model.Tag) error {
	return r.s.UpdateTag(tag)
}

func (r *tagRepository) Delete(id uint) error {
	return r.s.DeleteTag(id)
}

func (r *tagRepository) AttachToCard(cardID, tagID uint) error {
	return r.s.AttachTagToCard(cardID, tagID)
}

func (r *tagRepository) DetachFromCard(cardID, tagID uint) error {
	return r.s.DetachTagFromCard(cardID, tagID)
}

func (r *tagRepository) ListByCard(cardID uint) ([]model.Tag, error) {
	tagIDs := r.s.GetTagIDsByCard(cardID)
	tags := make([]model.Tag, 0, len(tagIDs))
	for _, id := range tagIDs {
		t, err := r.s.GetTag(id)
		if err == nil {
			tags = append(tags, *t)
		}
	}
	return tags, nil
}
