package model

import "time"

type Comment struct {
	ID        uint      `json:"id"`
	CardID    uint      `json:"cardId"`
	Text      string    `json:"text"`
	AuthorID  string    `json:"authorId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
