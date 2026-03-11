package service

import (
	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
)

type TagService interface {
	CreateOrGet(name string) (*model.Tag, error)
	ListAll() ([]model.Tag, error)
	AttachToCard(cardID, tagID uint) error
	DetachFromCard(cardID, tagID uint) error
	ListByCard(cardID uint) ([]model.Tag, error)
}

type tagService struct {
	tagRepo  repository.TagRepository
	cardRepo repository.CardRepository
}

func NewTagService(tagRepo repository.TagRepository, cardRepo repository.CardRepository) TagService {
	return &tagService{tagRepo: tagRepo, cardRepo: cardRepo}
}

func (s *tagService) CreateOrGet(name string) (*model.Tag, error) {
	return s.tagRepo.CreateOrGet(name)
}

func (s *tagService) ListAll() ([]model.Tag, error) {
	return s.tagRepo.ListAll()
}

func (s *tagService) AttachToCard(cardID, tagID uint) error {
	if _, err := s.cardRepo.FindByID(cardID); err != nil {
		return err
	}
	if _, err := s.tagRepo.FindByID(tagID); err != nil {
		return err
	}
	return s.tagRepo.AttachToCard(cardID, tagID)
}

func (s *tagService) DetachFromCard(cardID, tagID uint) error {
	return s.tagRepo.DetachFromCard(cardID, tagID)
}

func (s *tagService) ListByCard(cardID uint) ([]model.Tag, error) {
	return s.tagRepo.ListByCard(cardID)
}

func ToTagResponse(t model.Tag) dto.TagResponse {
	return dto.TagResponse{ID: t.ID, Name: t.Name}
}

func ToTagResponses(tags []model.Tag) []dto.TagResponse {
	result := make([]dto.TagResponse, len(tags))
	for i, t := range tags {
		result[i] = ToTagResponse(t)
	}
	return result
}
