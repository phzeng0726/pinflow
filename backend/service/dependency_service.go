package service

import (
	"fmt"
	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
)

type dependencyService struct {
	depRepo    repository.DependencyRepository
	cardRepo   repository.CardRepository
	columnRepo repository.ColumnRepository
	boardRepo  repository.BoardRepository
}

func newDependencyService(
	depRepo repository.DependencyRepository,
	cardRepo repository.CardRepository,
	columnRepo repository.ColumnRepository,
	boardRepo repository.BoardRepository,
) DependencyService {
	return &dependencyService{
		depRepo:    depRepo,
		cardRepo:   cardRepo,
		columnRepo: columnRepo,
		boardRepo:  boardRepo,
	}
}

func (s *dependencyService) buildCardRef(cardID uint) (dto.DependencyCardRef, error) {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return dto.DependencyCardRef{}, fmt.Errorf("card %d not found", cardID)
	}
	col, err := s.columnRepo.FindByID(card.ColumnID)
	if err != nil {
		return dto.DependencyCardRef{}, fmt.Errorf("column %d not found", card.ColumnID)
	}
	return dto.DependencyCardRef{
		ID:       card.ID,
		Title:    card.Title,
		BoardID:  col.BoardID,
		ColumnID: col.ID,
	}, nil
}

func (s *dependencyService) buildResponse(dep model.Dependency) (*dto.DependencyResponse, error) {
	fromRef, err := s.buildCardRef(dep.FromCardID)
	if err != nil {
		return nil, err
	}
	toRef, err := s.buildCardRef(dep.ToCardID)
	if err != nil {
		return nil, err
	}
	return &dto.DependencyResponse{
		ID:        dep.ID,
		FromCard:  fromRef,
		ToCard:    toRef,
		Type:      dep.Type,
		CreatedAt: dep.CreatedAt,
	}, nil
}

func (s *dependencyService) CreateForCard(fromCardID uint, req dto.CreateDependencyRequest) (*dto.DependencyResponse, error) {
	// Validate both cards exist
	if _, err := s.cardRepo.FindByID(fromCardID); err != nil {
		return nil, fmt.Errorf("from card %d not found", fromCardID)
	}
	if _, err := s.cardRepo.FindByID(req.ToCardID); err != nil {
		return nil, fmt.Errorf("to card %d not found", req.ToCardID)
	}

	dep := &model.Dependency{
		FromCardID: fromCardID,
		ToCardID:   req.ToCardID,
		Type:       req.Type,
	}
	if err := s.depRepo.Create(dep); err != nil {
		return nil, err
	}
	return s.buildResponse(*dep)
}

func (s *dependencyService) ListByCard(cardID uint) ([]dto.DependencyResponse, error) {
	deps, err := s.depRepo.ListByCard(cardID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.DependencyResponse, 0, len(deps))
	for _, dep := range deps {
		resp, err := s.buildResponse(dep)
		if err != nil {
			continue // skip orphaned deps
		}
		result = append(result, *resp)
	}
	return result, nil
}

func (s *dependencyService) Delete(id uint) error {
	return s.depRepo.Delete(id)
}
