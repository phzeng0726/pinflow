package service

import (
	"errors"
	"pinflow/model"
	"pinflow/repository"
	"strings"
)

type ColumnService interface {
	CreateColumn(boardID uint, name string) (*model.Column, error)
	UpdateColumn(id uint, req UpdateColumnInput) (*model.Column, error)
	DeleteColumn(id uint) error
}

type UpdateColumnInput struct {
	Name     *string
	AutoPin  *bool
	Position *float64
}

type columnService struct {
	boardRepo  repository.BoardRepository
	columnRepo repository.ColumnRepository
}

func NewColumnService(boardRepo repository.BoardRepository, columnRepo repository.ColumnRepository) ColumnService {
	return &columnService{boardRepo: boardRepo, columnRepo: columnRepo}
}

func (s *columnService) CreateColumn(boardID uint, name string) (*model.Column, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("column name is required")
	}
	if _, err := s.boardRepo.FindByID(boardID); err != nil {
		return nil, err
	}
	maxPos, err := s.columnRepo.MaxPositionByBoard(boardID)
	if err != nil {
		return nil, err
	}
	column := &model.Column{
		BoardID:  boardID,
		Name:     strings.TrimSpace(name),
		Position: maxPos + 1.0,
		AutoPin:  false,
	}
	if err := s.columnRepo.Create(column); err != nil {
		return nil, err
	}
	return column, nil
}

func (s *columnService) UpdateColumn(id uint, req UpdateColumnInput) (*model.Column, error) {
	column, err := s.columnRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		if strings.TrimSpace(*req.Name) == "" {
			return nil, errors.New("column name cannot be empty")
		}
		column.Name = strings.TrimSpace(*req.Name)
	}
	if req.AutoPin != nil {
		column.AutoPin = *req.AutoPin
	}
	if req.Position != nil {
		column.Position = *req.Position
	}
	if err := s.columnRepo.Update(column); err != nil {
		return nil, err
	}
	return column, nil
}

func (s *columnService) DeleteColumn(id uint) error {
	if _, err := s.columnRepo.FindByID(id); err != nil {
		return err
	}
	return s.columnRepo.Delete(id)
}
