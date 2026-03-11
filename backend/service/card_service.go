package service

import (
	"errors"
	"time"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"strings"
)

type CardService interface {
	CreateCard(columnID uint, title, description string) (*model.Card, error)
	GetCardDetail(id uint) (*dto.CardResponse, error)
	UpdateCard(id uint, title, description string, startTime, endTime *time.Time) (*model.Card, error)
	MoveCard(id uint, columnID uint, position float64) (*model.Card, error)
	TogglePin(id uint) (*model.Card, error)
	GetPinnedCards() ([]dto.PinnedCardResponse, error)
	DeleteCard(id uint) error
}

type cardService struct {
	cardRepo   repository.CardRepository
	columnRepo repository.ColumnRepository
}

func NewCardService(cardRepo repository.CardRepository, columnRepo repository.ColumnRepository) CardService {
	return &cardService{cardRepo: cardRepo, columnRepo: columnRepo}
}

func (s *cardService) CreateCard(columnID uint, title, description string) (*model.Card, error) {
	if strings.TrimSpace(title) == "" {
		return nil, errors.New("card title is required")
	}
	col, err := s.columnRepo.FindByID(columnID)
	if err != nil {
		return nil, err
	}
	maxPos, err := s.cardRepo.MaxPositionByColumn(columnID)
	if err != nil {
		return nil, err
	}
	card := &model.Card{
		ColumnID:    columnID,
		Title:       strings.TrimSpace(title),
		Description: description,
		Position:    maxPos + 1.0,
		IsPinned:    col.AutoPin,
	}
	if err := s.cardRepo.Create(card); err != nil {
		return nil, err
	}
	return card, nil
}

func (s *cardService) GetCardDetail(id uint) (*dto.CardResponse, error) {
	card, err := s.cardRepo.FindDetail(id)
	if err != nil {
		return nil, err
	}
	resp := ToCardResponse(card)
	return &resp, nil
}

func (s *cardService) UpdateCard(id uint, title, description string, startTime, endTime *time.Time) (*model.Card, error) {
	if strings.TrimSpace(title) == "" {
		return nil, errors.New("card title is required")
	}
	if startTime != nil && endTime != nil && endTime.Before(*startTime) {
		return nil, errors.New("end_time must be after start_time")
	}
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	card.Title = strings.TrimSpace(title)
	card.Description = description
	card.StartTime = startTime
	card.EndTime = endTime
	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}
	return card, nil
}

func ToCardResponse(card *model.Card) dto.CardResponse {
	tags := make([]dto.TagResponse, len(card.Tags))
	for i, t := range card.Tags {
		tags[i] = dto.TagResponse{ID: t.ID, Name: t.Name}
	}
	checklists := make([]dto.ChecklistResponse, len(card.Checklists))
	for i, cl := range card.Checklists {
		items := make([]dto.ChecklistItemResponse, len(cl.Items))
		completedCount := 0
		for j, item := range cl.Items {
			items[j] = dto.ChecklistItemResponse{
				ID:          item.ID,
				ChecklistID: item.ChecklistID,
				Text:        item.Text,
				Completed:   item.Completed,
				Position:    item.Position,
			}
			if item.Completed {
				completedCount++
			}
		}
		checklists[i] = dto.ChecklistResponse{
			ID:             cl.ID,
			CardID:         cl.CardID,
			Title:          cl.Title,
			Items:          items,
			CompletedCount: completedCount,
			TotalCount:     len(cl.Items),
		}
	}
	return dto.CardResponse{
		ID:          card.ID,
		ColumnID:    card.ColumnID,
		Title:       card.Title,
		Description: card.Description,
		Position:    card.Position,
		IsPinned:    card.IsPinned,
		StartTime:   card.StartTime,
		EndTime:     card.EndTime,
		Tags:        tags,
		Checklists:  checklists,
		CreatedAt:   card.CreatedAt,
		UpdatedAt:   card.UpdatedAt,
	}
}

func (s *cardService) MoveCard(id uint, columnID uint, position float64) (*model.Card, error) {
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	col, err := s.columnRepo.FindByID(columnID)
	if err != nil {
		return nil, err
	}
	isPinned := card.IsPinned
	if col.AutoPin {
		isPinned = true
	}
	if err := s.cardRepo.UpdateColumnAndPosition(id, columnID, position, isPinned); err != nil {
		return nil, err
	}
	card.ColumnID = columnID
	card.Position = position
	card.IsPinned = isPinned
	return card, nil
}

func (s *cardService) TogglePin(id uint) (*model.Card, error) {
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	newPinned := !card.IsPinned
	if err := s.cardRepo.UpdatePinned(id, newPinned); err != nil {
		return nil, err
	}
	card.IsPinned = newPinned
	return card, nil
}

func (s *cardService) GetPinnedCards() ([]dto.PinnedCardResponse, error) {
	cards, err := s.cardRepo.FindPinned()
	if err != nil {
		return nil, err
	}
	result := make([]dto.PinnedCardResponse, 0, len(cards))
	for _, c := range cards {
		col, err := s.columnRepo.FindByID(c.ColumnID)
		colName := ""
		if err == nil {
			colName = col.Name
		}
		result = append(result, dto.PinnedCardResponse{
			ID:          c.ID,
			Title:       c.Title,
			Description: c.Description,
			ColumnID:    c.ColumnID,
			ColumnName:  colName,
		})
	}
	return result, nil
}

func (s *cardService) DeleteCard(id uint) error {
	if _, err := s.cardRepo.FindByID(id); err != nil {
		return err
	}
	return s.cardRepo.Delete(id)
}
