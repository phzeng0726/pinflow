package model

import "time"

type Column struct {
	ID        uint    `json:"id"`
	BoardID   uint    `json:"board_id"`
	Name      string  `json:"name"`
	Position  float64 `json:"position"`
	AutoPin   bool    `json:"auto_pin"`
	Cards     []Card  `json:"cards,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
