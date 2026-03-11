package service

import (
	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
)

type ChecklistService interface {
	CreateChecklist(cardID uint, title string) (*model.Checklist, error)
	ListByCard(cardID uint) ([]model.Checklist, error)
	DeleteChecklist(id uint) error
	CreateItem(checklistID uint, text string, position float64) (*model.ChecklistItem, error)
	UpdateItem(id uint, req dto.UpdateChecklistItemRequest) (*model.ChecklistItem, error)
	DeleteItem(id uint) error
}

type checklistService struct {
	clRepo   repository.ChecklistRepository
	itemRepo repository.ChecklistItemRepository
	cardRepo repository.CardRepository
}

func NewChecklistService(
	clRepo repository.ChecklistRepository,
	itemRepo repository.ChecklistItemRepository,
	cardRepo repository.CardRepository,
) ChecklistService {
	return &checklistService{clRepo: clRepo, itemRepo: itemRepo, cardRepo: cardRepo}
}

func (s *checklistService) CreateChecklist(cardID uint, title string) (*model.Checklist, error) {
	if _, err := s.cardRepo.FindByID(cardID); err != nil {
		return nil, err
	}
	cl := &model.Checklist{CardID: cardID, Title: title}
	if err := s.clRepo.Create(cl); err != nil {
		return nil, err
	}
	cl.Items = []model.ChecklistItem{}
	return cl, nil
}

func (s *checklistService) ListByCard(cardID uint) ([]model.Checklist, error) {
	return s.clRepo.ListByCard(cardID)
}

func (s *checklistService) DeleteChecklist(id uint) error {
	if _, err := s.clRepo.FindByID(id); err != nil {
		return err
	}
	return s.clRepo.Delete(id)
}

func (s *checklistService) CreateItem(checklistID uint, text string, position float64) (*model.ChecklistItem, error) {
	if _, err := s.clRepo.FindByID(checklistID); err != nil {
		return nil, err
	}
	if position == 0 {
		maxPos, err := s.itemRepo.MaxPositionByChecklist(checklistID)
		if err != nil {
			return nil, err
		}
		position = maxPos + 1.0
	}
	item := &model.ChecklistItem{
		ChecklistID: checklistID,
		Text:        text,
		Completed:   false,
		Position:    position,
	}
	if err := s.itemRepo.Create(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *checklistService) UpdateItem(id uint, req dto.UpdateChecklistItemRequest) (*model.ChecklistItem, error) {
	item, err := s.itemRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if req.Text != nil {
		item.Text = *req.Text
	}
	if req.Completed != nil {
		item.Completed = *req.Completed
	}
	if req.Position != nil {
		item.Position = *req.Position
	}
	if err := s.itemRepo.Update(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *checklistService) DeleteItem(id uint) error {
	if _, err := s.itemRepo.FindByID(id); err != nil {
		return err
	}
	return s.itemRepo.Delete(id)
}

func ToChecklistItemResponse(item model.ChecklistItem) dto.ChecklistItemResponse {
	return dto.ChecklistItemResponse{
		ID:          item.ID,
		ChecklistID: item.ChecklistID,
		Text:        item.Text,
		Completed:   item.Completed,
		Position:    item.Position,
	}
}

func ToChecklistResponse(cl model.Checklist) dto.ChecklistResponse {
	items := make([]dto.ChecklistItemResponse, len(cl.Items))
	completedCount := 0
	for i, item := range cl.Items {
		items[i] = ToChecklistItemResponse(item)
		if item.Completed {
			completedCount++
		}
	}
	return dto.ChecklistResponse{
		ID:             cl.ID,
		CardID:         cl.CardID,
		Title:          cl.Title,
		Items:          items,
		CompletedCount: completedCount,
		TotalCount:     len(cl.Items),
	}
}

func ToChecklistResponses(cls []model.Checklist) []dto.ChecklistResponse {
	result := make([]dto.ChecklistResponse, len(cls))
	for i, cl := range cls {
		result[i] = ToChecklistResponse(cl)
	}
	return result
}
