package model

import "time"

type Card struct {
	ID              uint        `json:"id"`
	ColumnID        uint        `json:"columnId"`
	Title           string      `json:"title"`
	Description     string      `json:"description"`
	Position        float64     `json:"position"`
	IsPinned        bool        `json:"isPinned"`
	StoryPoint      *int        `json:"storyPoint"`
	Priority        *int        `json:"priority"`
	StartTime       *time.Time  `json:"startTime"`
	EndTime         *time.Time  `json:"endTime"`
	Tags            []Tag       `json:"tags"`
	Checklists      []Checklist `json:"checklists"`
	DependencyCount int         `json:"dependencyCount"`
	CreatedAt       time.Time   `json:"createdAt"`
	UpdatedAt       time.Time   `json:"updatedAt"`
}
