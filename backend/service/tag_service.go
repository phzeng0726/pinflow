package service

import (
	"errors"
	"strings"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/store"
)

type tagService struct {
	tagRepo  repository.TagRepository
	cardRepo repository.CardRepository
	fs       *store.FileStore
}

func newTagService(tagRepo repository.TagRepository, cardRepo repository.CardRepository, fs *store.FileStore) TagService {
	return &tagService{tagRepo: tagRepo, cardRepo: cardRepo, fs: fs}
}

func (s *tagService) CreateOrGet(boardID uint, name string, color string) (*model.Tag, error) {
	return s.tagRepo.CreateOrGet(boardID, name, color)
}

func (s *tagService) UpdateTag(id uint, req dto.UpdateTagRequest) (*model.Tag, error) {
	tag, err := s.tagRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		newName := strings.TrimSpace(*req.Name)
		if newName == "" {
			return nil, errors.New("tag name is required")
		}
		// Check uniqueness within the same board if name is changing
		if !strings.EqualFold(tag.Name, newName) {
			existing, _ := s.tagRepo.FindByName(tag.BoardID, newName)
			if existing != nil {
				return nil, errors.New("tag name already exists")
			}
		}
		tag.Name = newName
	}
	if req.Color != nil {
		tag.Color = *req.Color
	}
	if err := s.tagRepo.Update(tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *tagService) DeleteTag(id uint) error {
	if _, err := s.tagRepo.FindByID(id); err != nil {
		return err
	}
	return s.tagRepo.Delete(id)
}

func (s *tagService) ListByBoard(boardID uint) ([]model.Tag, error) {
	return s.tagRepo.ListByBoard(boardID)
}

func (s *tagService) AttachToCard(cardID, tagID uint) error {
	if _, err := s.cardRepo.FindByID(cardID); err != nil {
		return err
	}
	if _, err := s.tagRepo.FindByID(tagID); err != nil {
		return err
	}
	err := s.tagRepo.AttachToCard(cardID, tagID)
	if err == store.ErrCrossBoardTag {
		return store.ErrCrossBoardTag
	}
	return err
}

func (s *tagService) DetachFromCard(cardID, tagID uint) error {
	return s.tagRepo.DetachFromCard(cardID, tagID)
}

func (s *tagService) ListByCard(cardID uint) ([]model.Tag, error) {
	return s.tagRepo.ListByCard(cardID)
}

func ToTagResponse(t model.Tag) dto.TagResponse {
	return dto.TagResponse{ID: t.ID, Name: t.Name, Color: t.Color}
}

func ToTagResponses(tags []model.Tag) []dto.TagResponse {
	result := make([]dto.TagResponse, len(tags))
	for i, t := range tags {
		result[i] = ToTagResponse(t)
	}
	return result
}
