package service

import (
	"errors"
	"pinflow/model"
	"pinflow/repository"
	"strings"
)

type boardService struct {
	repo repository.BoardRepository
}

func newBoardService(repo repository.BoardRepository) BoardService {
	return &boardService{repo: repo}
}

func (s *boardService) CreateBoard(name string) (*model.Board, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("board name is required")
	}
	board := &model.Board{Name: strings.TrimSpace(name)}
	if err := s.repo.Create(board); err != nil {
		return nil, err
	}
	return board, nil
}

func (s *boardService) GetAllBoards() ([]model.Board, error) {
	return s.repo.FindAll()
}

func (s *boardService) GetBoardByID(id uint) (*model.Board, error) {
	board, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return board, nil
}

func (s *boardService) UpdateBoard(id uint, name string) (*model.Board, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("board name is required")
	}
	board, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	board.Name = strings.TrimSpace(name)
	if err := s.repo.Update(board); err != nil {
		return nil, err
	}
	return board, nil
}

func (s *boardService) DeleteBoard(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return err
	}
	return s.repo.Delete(id)
}
