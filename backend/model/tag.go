package model

type Tag struct {
	ID      uint   `json:"id"`
	BoardID uint   `json:"boardId"`
	Name    string `json:"name"`
	Color   string `json:"color"`
}
