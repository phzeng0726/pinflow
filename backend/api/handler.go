package api

import (
	"pinflow/service"
	"pinflow/store"
	"pinflow/sync"
)

type Handlers struct {
	Board         *BoardHandler
	Column        *ColumnHandler
	Card          *CardHandler
	Tag           *TagHandler
	Checklist     *ChecklistHandler
	ChecklistItem *ChecklistItemHandler
	Dependency    *DependencyHandler
	Comment       *CommentHandler
	Image         *ImageHandler
	Settings      *SettingsHandler
	Snapshot      *SnapshotHandler
	Archive       *ArchiveHandler
	Auth          *AuthHandler
	Sync          *SyncHandler
}

func NewHandlers(services *service.Services, auth *sync.AuthManager, manager *sync.Manager, fs *store.FileStore) *Handlers {
	return &Handlers{
		Board:         &BoardHandler{services: services},
		Column:        &ColumnHandler{services: services},
		Card:          &CardHandler{services: services},
		Tag:           &TagHandler{services: services},
		Checklist:     &ChecklistHandler{services: services},
		ChecklistItem: &ChecklistItemHandler{services: services},
		Dependency:    &DependencyHandler{services: services},
		Comment:       &CommentHandler{services: services},
		Image:         &ImageHandler{services: services},
		Settings:      &SettingsHandler{services: services},
		Snapshot:      &SnapshotHandler{services: services},
		Archive:       &ArchiveHandler{services: services},
		Auth:          NewAuthHandler(auth, manager),
		Sync:          NewSyncHandler(manager, fs),
	}
}
