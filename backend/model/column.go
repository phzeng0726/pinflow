package model

import "time"

type Column struct {
	ID        uint      `json:"id"`
	BoardID   uint      `json:"boardId"`
	Name      string    `json:"name"`
	Position  float64   `json:"position"`
	AutoPin   bool      `json:"autoPin"`
	Cards     []Card    `json:"cards,omitempty"`
	ArchivedAt *time.Time `json:"archivedAt"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}
