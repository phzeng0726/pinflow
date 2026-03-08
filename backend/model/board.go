package model

import "time"

type Board struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"not null;size:100" json:"name"`
	Columns   []Column  `gorm:"foreignKey:BoardID;constraint:OnDelete:CASCADE" json:"columns,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
