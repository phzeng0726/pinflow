package api

import "pinflow/service"

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
}

func NewHandlers(services *service.Services) *Handlers {
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
	}
}
