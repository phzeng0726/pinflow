package dto

import "time"

type CreateSnapshotRequest struct {
	Name string `json:"name"`
}

type SnapshotResponse struct {
	ID        uint      `json:"id"`
	BoardID   uint      `json:"boardId"`
	Name      string    `json:"name"`
	IsManual  bool      `json:"isManual"`
	Trigger   string    `json:"trigger"`
	CreatedAt time.Time `json:"createdAt"`
}
