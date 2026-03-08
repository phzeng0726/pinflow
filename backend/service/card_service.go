package service

import (
	"errors"
	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"strings"
)

type CardService interface {
	CreateCard(columnID uint, title, description string) (*model.Card, error)
	UpdateCard(id uint, title, description string) (*model.Card, error)
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

func (s *cardService) UpdateCard(id uint, title, description string) (*model.Card, error) {
	if strings.TrimSpace(title) == "" {
		return nil, errors.New("card title is required")
	}
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	card.Title = strings.TrimSpace(title)
	card.Description = description
	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}
	return card, nil
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
