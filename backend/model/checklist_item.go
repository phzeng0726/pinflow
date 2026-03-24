package model

type ChecklistItem struct {
	ID          uint    `json:"id"`
	ChecklistID uint    `json:"checklistId"`
	Text        string  `json:"text"`
	Completed   bool    `json:"completed"`
	Position    float64 `json:"position"`
}
