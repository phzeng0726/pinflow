package model

import "time"

type Settings struct {
	Theme              string     `json:"theme"`
	Locale             string     `json:"locale"`
	SyncEnabled        bool       `json:"syncEnabled"`
	SourceDecisionMade bool       `json:"sourceDecisionMade,omitempty"`
	LastSyncedAt       *time.Time `json:"lastSyncedAt,omitempty"`
	LastSyncedUserID   string     `json:"lastSyncedUserId,omitempty"`
}
