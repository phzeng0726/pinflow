package model

type Checklist struct {
	ID       uint            `json:"id"`
	CardID   uint            `json:"cardId"`
	Title    string          `json:"title"`
	Position float64         `json:"position"`
	Items    []ChecklistItem `json:"items"`
}
