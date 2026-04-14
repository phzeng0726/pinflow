package repository

import (
	"pinflow/model"
	"pinflow/store"
)

type fileCommentRepository struct {
	s *store.FileStore
}

func NewFileCommentRepository(s *store.FileStore) CommentRepository {
	return &fileCommentRepository{s: s}
}

func (r *fileCommentRepository) Create(comment *model.Comment) error {
	comment.ID = r.s.NextID("comment")
	card, err := r.s.GetCard(comment.CardID)
	if err != nil {
		return err
	}
	card.Comments = append(card.Comments, *comment)
	return r.s.UpdateCard(card)
}

func (r *fileCommentRepository) FindByID(id uint) (*model.Comment, error) {
	cardID, ok := r.s.CardIDForComment(id)
	if !ok {
		return nil, store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return nil, err
	}
	for _, c := range card.Comments {
		if c.ID == id {
			cp := c
			return &cp, nil
		}
	}
	return nil, store.ErrNotFound
}

func (r *fileCommentRepository) ListByCard(cardID uint) ([]model.Comment, error) {
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return nil, err
	}
	result := make([]model.Comment, len(card.Comments))
	copy(result, card.Comments)
	return result, nil
}

func (r *fileCommentRepository) Update(comment *model.Comment) error {
	cardID, ok := r.s.CardIDForComment(comment.ID)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for i, c := range card.Comments {
		if c.ID == comment.ID {
			comment.CardID = c.CardID
			comment.AuthorID = c.AuthorID
			comment.CreatedAt = c.CreatedAt
			card.Comments[i] = *comment
			return r.s.UpdateCard(card)
		}
	}
	return store.ErrNotFound
}

func (r *fileCommentRepository) Delete(id uint) error {
	cardID, ok := r.s.CardIDForComment(id)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for i, c := range card.Comments {
		if c.ID == id {
			card.Comments = append(card.Comments[:i], card.Comments[i+1:]...)
			return r.s.UpdateCard(card)
		}
	}
	return store.ErrNotFound
}
