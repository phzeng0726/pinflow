package model

import "time"

type Card struct {
	ID          uint        `json:"id"`
	ColumnID    uint        `json:"column_id"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Position    float64     `json:"position"`
	IsPinned    bool        `json:"is_pinned"`
	StoryPoint  *int        `json:"story_point"`
	StartTime   *time.Time  `json:"start_time"`
	EndTime     *time.Time  `json:"end_time"`
	Tags        []Tag       `json:"tags"`
	Checklists  []Checklist `json:"checklists"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}
