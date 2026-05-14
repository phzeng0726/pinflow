package dto

import "time"

type ArchivedCardResponse struct {
	ID             uint      `json:"id"`
	Title          string    `json:"title"`
	ColumnID       uint      `json:"columnId"`
	ColumnName     string    `json:"columnName"`
	ColumnArchived bool      `json:"columnArchived"`
	ArchivedAt     time.Time `json:"archivedAt"`
}

type ArchivedColumnResponse struct {
	ID         uint      `json:"id"`
	Name       string    `json:"name"`
	CardCount  int       `json:"cardCount"`
	ArchivedAt time.Time `json:"archivedAt"`
}
