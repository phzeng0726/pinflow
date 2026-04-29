package model

import "time"

type Board struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Position  float64   `json:"position"`
	Columns   []Column  `json:"columns,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
