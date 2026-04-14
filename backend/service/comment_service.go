package service

import (
	"errors"
	"strings"
	"time"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/store"
)

type CommentService interface {
	CreateComment(cardID uint, req dto.CreateCommentRequest) (*dto.CommentResponse, error)
	ListByCard(cardID uint) ([]dto.CommentResponse, error)
	UpdateComment(id uint, req dto.UpdateCommentRequest) (*dto.CommentResponse, error)
	DeleteComment(id uint) error
}

type commentService struct {
	commentRepo repository.CommentRepository
	cardRepo    repository.CardRepository
	fs          *store.FileStore
}

func NewCommentService(
	commentRepo repository.CommentRepository,
	cardRepo repository.CardRepository,
	fs *store.FileStore,
) CommentService {
	return &commentService{commentRepo: commentRepo, cardRepo: cardRepo, fs: fs}
}

func (s *commentService) CreateComment(cardID uint, req dto.CreateCommentRequest) (*dto.CommentResponse, error) {
	text := strings.TrimSpace(req.Text)
	if text == "" {
		return nil, errors.New("comment text is required")
	}

	if _, err := s.cardRepo.FindByID(cardID); err != nil {
		return nil, err
	}

	now := time.Now()
	c := &model.Comment{
		CardID:    cardID,
		Text:      text,
		AuthorID:  s.fs.WorkspaceID(),
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.commentRepo.Create(c); err != nil {
		return nil, err
	}
	resp := toCommentResponse(c)
	return &resp, nil
}

func (s *commentService) ListByCard(cardID uint) ([]dto.CommentResponse, error) {
	comments, err := s.commentRepo.ListByCard(cardID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.CommentResponse, len(comments))
	for i, c := range comments {
		result[i] = toCommentResponse(&c)
	}
	return result, nil
}

func (s *commentService) UpdateComment(id uint, req dto.UpdateCommentRequest) (*dto.CommentResponse, error) {
	text := strings.TrimSpace(req.Text)
	if text == "" {
		return nil, errors.New("comment text is required")
	}

	c, err := s.commentRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	c.Text = text
	c.UpdatedAt = time.Now()
	if err := s.commentRepo.Update(c); err != nil {
		return nil, err
	}
	resp := toCommentResponse(c)
	return &resp, nil
}

func (s *commentService) DeleteComment(id uint) error {
	if _, err := s.commentRepo.FindByID(id); err != nil {
		return err
	}
	return s.commentRepo.Delete(id)
}

func toCommentResponse(c *model.Comment) dto.CommentResponse {
	return dto.CommentResponse{
		ID:        c.ID,
		CardID:    c.CardID,
		Text:      c.Text,
		AuthorID:  c.AuthorID,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}
