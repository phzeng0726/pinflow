package dto

import "time"

type CreateCardRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=200"`
	Description string `json:"description" binding:"max=2000"`
}

type UpdateCardRequest struct {
	Title       *string    `json:"title" binding:"omitempty,min=1,max=200"`
	Description *string    `json:"description" binding:"omitempty,max=2000"`
	StoryPoint  *int       `json:"storyPoint"`
	Priority    *int       `json:"priority"`
	StartTime   *time.Time `json:"startTime"`
	EndTime     *time.Time `json:"endTime"`
}

type UpdateScheduleRequest struct {
	StartTime *time.Time `json:"startTime"`
	EndTime   *time.Time `json:"endTime"`
}

type MoveCardRequest struct {
	ColumnID uint    `json:"columnId" binding:"required"`
	Position float64 `json:"position" binding:"required"`
}

type ChecklistSummary struct {
	TotalCount     int `json:"totalCount"`
	CompletedCount int `json:"completedCount"`
}

type PinnedCardResponse struct {
	ID               uint             `json:"id"`
	Title            string           `json:"title"`
	Description      string           `json:"description"`
	BoardID          uint             `json:"boardId"`
	BoardName        string           `json:"boardName"`
	ColumnID         uint             `json:"columnId"`
	ColumnName       string           `json:"columnName"`
	Priority         *int             `json:"priority"`
	StoryPoint       *int             `json:"storyPoint"`
	StartTime        *time.Time       `json:"startTime"`
	EndTime          *time.Time       `json:"endTime"`
	Tags             []TagResponse    `json:"tags"`
	ChecklistSummary ChecklistSummary `json:"checklistSummary"`
	DependencyCount  int              `json:"dependencyCount"`
}

type DuplicateCardRequest struct {
	Title          string `json:"title" binding:"required"`
	TargetColumnID uint   `json:"targetColumnId" binding:"required"`
	Position       int    `json:"position"` // 1-based; 0 = append to end
	CopyTags       bool   `json:"copyTags"`
	CopyChecklists bool   `json:"copyChecklists"`
	CopySchedule   bool   `json:"copySchedule"`
	Pin            bool   `json:"pin"`
}

type CardResponse struct {
	ID              uint                `json:"id"`
	ColumnID        uint                `json:"columnId"`
	Title           string              `json:"title"`
	Description     string              `json:"description"`
	Position        float64             `json:"position"`
	IsPinned        bool                `json:"isPinned"`
	StoryPoint      *int                `json:"storyPoint"`
	Priority        *int                `json:"priority"`
	StartTime       *time.Time          `json:"startTime"`
	EndTime         *time.Time          `json:"endTime"`
	Tags            []TagResponse       `json:"tags"`
	Checklists      []ChecklistResponse `json:"checklists"`
	Comments        []CommentResponse   `json:"comments"`
	DependencyCount int                 `json:"dependencyCount"`
	CreatedAt       time.Time           `json:"createdAt"`
	UpdatedAt       time.Time           `json:"updatedAt"`
}
