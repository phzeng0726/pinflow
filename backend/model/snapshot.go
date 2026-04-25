package model

import "time"

type Snapshot struct {
	ID        uint      `json:"id"`
	BoardID   uint      `json:"boardId"`
	Name      string    `json:"name"`
	IsManual  bool      `json:"isManual"`
	Trigger   string    `json:"trigger"`
	CreatedAt time.Time `json:"createdAt"`
}

// SnapshotIndex is persisted as .snapshots/index.json within a board directory.
type SnapshotIndex struct {
	Snapshots []Snapshot `json:"snapshots"`
}
