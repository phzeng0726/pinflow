package dto

import "time"

type CreateCommentRequest struct {
	Text string `json:"text" binding:"required,min=1,max=5000"`
}

type UpdateCommentRequest struct {
	Text string `json:"text" binding:"required,min=1,max=5000"`
}

type CommentResponse struct {
	ID        uint      `json:"id"`
	CardID    uint      `json:"cardId"`
	Text      string    `json:"text"`
	AuthorID  string    `json:"authorId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
