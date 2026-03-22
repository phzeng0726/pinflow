package dto

type CreateChecklistRequest struct {
	Title string `json:"title" binding:"required,min=1,max=200"`
}

type UpdateChecklistRequest struct {
	Title    *string  `json:"title"`
	Position *float64 `json:"position"`
}

type CreateChecklistItemRequest struct {
	Text     string  `json:"text" binding:"required,min=1,max=500"`
	Position float64 `json:"position"`
}

type UpdateChecklistItemRequest struct {
	Text      *string  `json:"text"`
	Completed *bool    `json:"completed"`
	Position  *float64 `json:"position"`
}

type ChecklistItemResponse struct {
	ID          uint    `json:"id"`
	ChecklistID uint    `json:"checklist_id"`
	Text        string  `json:"text"`
	Completed   bool    `json:"completed"`
	Position    float64 `json:"position"`
}

type ChecklistResponse struct {
	ID             uint                    `json:"id"`
	CardID         uint                    `json:"card_id"`
	Title          string                  `json:"title"`
	Position       float64                 `json:"position"`
	Items          []ChecklistItemResponse `json:"items"`
	CompletedCount int                     `json:"completed_count"`
	TotalCount     int                     `json:"total_count"`
}
