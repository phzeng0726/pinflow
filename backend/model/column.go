package model

import "time"

type Column struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	BoardID   uint      `gorm:"not null;index" json:"board_id"`
	Name      string    `gorm:"not null;size:100" json:"name"`
	Position  float64   `gorm:"not null;default:0" json:"position"`
	AutoPin   bool      `gorm:"not null;default:false" json:"auto_pin"`
	Cards     []Card    `gorm:"foreignKey:ColumnID;constraint:OnDelete:CASCADE" json:"cards,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
