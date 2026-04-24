package service

import (
	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
)

type checklistService struct {
	clRepo   repository.ChecklistRepository
	itemRepo repository.ChecklistItemRepository
	cardRepo repository.CardRepository
}

func newChecklistService(
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
	maxPos, err := s.clRepo.MaxPositionByCard(cardID)
	if err != nil {
		return nil, err
	}
	cl := &model.Checklist{CardID: cardID, Title: title, Position: maxPos + 1.0}
	if err := s.clRepo.Create(cl); err != nil {
		return nil, err
	}
	cl.Items = []model.ChecklistItem{}
	return cl, nil
}

func (s *checklistService) ListByCard(cardID uint) ([]model.Checklist, error) {
	return s.clRepo.ListByCard(cardID)
}

func (s *checklistService) UpdateChecklist(id uint, req dto.UpdateChecklistRequest) (*model.Checklist, error) {
	cl, err := s.clRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if req.Title != nil {
		cl.Title = *req.Title
	}
	if req.Position != nil {
		cl.Position = *req.Position
	}
	if err := s.clRepo.Update(cl); err != nil {
		return nil, err
	}
	return cl, nil
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

func (s *checklistService) MoveItem(id uint, req dto.MoveChecklistItemRequest) (*model.ChecklistItem, error) {
	item, err := s.itemRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if err := s.itemRepo.MoveItem(id, req.ChecklistID, req.Position); err != nil {
		return nil, err
	}
	item.ChecklistID = req.ChecklistID
	item.Position = req.Position
	return item, nil
}

func (s *checklistService) DeleteItem(id uint) error {
	if _, err := s.itemRepo.FindByID(id); err != nil {
		return err
	}
	return s.itemRepo.Delete(id)
}

func (s *checklistService) SyncItems(checklistID uint, entries []dto.SyncChecklistItemEntry) (*model.Checklist, error) {
	if _, err := s.clRepo.FindByID(checklistID); err != nil {
		return nil, err
	}
	items := make([]model.ChecklistItem, len(entries))
	for i, e := range entries {
		items[i] = model.ChecklistItem{
			ChecklistID: checklistID,
			Text:        e.Text,
			Completed:   e.Completed,
		}
	}
	if _, err := s.itemRepo.SyncItems(checklistID, items); err != nil {
		return nil, err
	}
	return s.clRepo.FindByID(checklistID)
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
		Position:       cl.Position,
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
