package model

import "time"

type Card struct {
	ID          uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	ColumnID    uint        `gorm:"not null;index" json:"column_id"`
	Title       string      `gorm:"not null;size:200" json:"title"`
	Description string      `gorm:"size:2000" json:"description"`
	Position    float64     `gorm:"not null;default:0" json:"position"`
	IsPinned    bool        `gorm:"not null;default:false" json:"is_pinned"`
	StoryPoint  *int        `json:"story_point"`
	StartTime   *time.Time  `json:"start_time"`
	EndTime     *time.Time  `json:"end_time"`
	Tags        []Tag       `gorm:"many2many:card_tags;" json:"tags"`
	Checklists  []Checklist `gorm:"foreignKey:CardID" json:"checklists"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}
