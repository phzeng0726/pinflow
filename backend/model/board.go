package model

import "time"

type Board struct {
	ID        uint     `json:"id"`
	Name      string   `json:"name"`
	Columns   []Column `json:"columns,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
