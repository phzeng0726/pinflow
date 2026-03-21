package dto

import "time"

type CreateCardRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=200"`
	Description string `json:"description" binding:"max=2000"`
}

type UpdateCardRequest struct {
	Title       string     `json:"title" binding:"required,min=1,max=200"`
	Description string     `json:"description" binding:"max=2000"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
}

type MoveCardRequest struct {
	ColumnID uint    `json:"column_id" binding:"required"`
	Position float64 `json:"position" binding:"required"`
}

type PinnedCardResponse struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ColumnID    uint   `json:"column_id"`
	ColumnName  string `json:"column_name"`
}

type DuplicateCardRequest struct {
	Title          string `json:"title" binding:"required"`
	TargetColumnID uint   `json:"target_column_id" binding:"required"`
	PositionIndex  int    `json:"position_index"` // 1-based; 0 = append to end
	CopyTags       bool   `json:"copy_tags"`
	CopyChecklists bool   `json:"copy_checklists"`
	CopySchedule   bool   `json:"copy_schedule"`
	Pin            bool   `json:"pin"`
}

type CardResponse struct {
	ID          uint                `json:"id"`
	ColumnID    uint                `json:"column_id"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Position    float64             `json:"position"`
	IsPinned    bool                `json:"is_pinned"`
	StartTime   *time.Time          `json:"start_time"`
	EndTime     *time.Time          `json:"end_time"`
	Tags        []TagResponse       `json:"tags"`
	Checklists  []ChecklistResponse `json:"checklists"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
}
