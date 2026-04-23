package service

import (
	"mime/multipart"
	"time"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/store"
)

type BoardService interface {
	CreateBoard(name string) (*model.Board, error)
	GetAllBoards() ([]model.Board, error)
	GetBoardByID(id uint) (*model.Board, error)
	UpdateBoard(id uint, name string) (*model.Board, error)
	DeleteBoard(id uint) error
}

type ColumnService interface {
	CreateColumn(boardID uint, name string) (*model.Column, error)
	UpdateColumn(id uint, req UpdateColumnInput) (*model.Column, error)
	DeleteColumn(id uint) error
}

type CardService interface {
	CreateCard(columnID uint, title, description string) (*model.Card, error)
	GetCardDetail(id uint) (*dto.CardResponse, error)
	UpdateCard(id uint, title, description *string, storyPoint *int, priority *int, startTime, endTime *time.Time) (*model.Card, error)
	UpdateSchedule(id uint, startTime, endTime *time.Time) (*model.Card, error)
	MoveCard(id uint, columnID uint, position float64) (*model.Card, error)
	TogglePin(id uint) (*model.Card, error)
	GetPinnedCards() ([]dto.PinnedCardResponse, error)
	Search(query string, limit int) ([]dto.CardSearchResult, error)
	DeleteCard(id uint) error
	DuplicateCard(id uint, req dto.DuplicateCardRequest) (*dto.CardResponse, error)
}

type TagService interface {
	CreateOrGet(name string, color string) (*model.Tag, error)
	ListAll() ([]model.Tag, error)
	UpdateTag(id uint, req dto.UpdateTagRequest) (*model.Tag, error)
	DeleteTag(id uint) error
	AttachToCard(cardID, tagID uint) error
	DetachFromCard(cardID, tagID uint) error
	ListByCard(cardID uint) ([]model.Tag, error)
}

type ChecklistService interface {
	CreateChecklist(cardID uint, title string) (*model.Checklist, error)
	ListByCard(cardID uint) ([]model.Checklist, error)
	UpdateChecklist(id uint, req dto.UpdateChecklistRequest) (*model.Checklist, error)
	DeleteChecklist(id uint) error
	CreateItem(checklistID uint, text string, position float64) (*model.ChecklistItem, error)
	UpdateItem(id uint, req dto.UpdateChecklistItemRequest) (*model.ChecklistItem, error)
	MoveItem(id uint, req dto.MoveChecklistItemRequest) (*model.ChecklistItem, error)
	DeleteItem(id uint) error
	SyncItems(checklistID uint, items []dto.SyncChecklistItemEntry) (*model.Checklist, error)
}

type DependencyService interface {
	CreateForCard(fromCardID uint, req dto.CreateDependencyRequest) (*dto.DependencyResponse, error)
	ListByCard(cardID uint) ([]dto.DependencyResponse, error)
	ListByBoard(boardID uint) ([]dto.DependencyResponse, error)
	Delete(id uint) error
}

type CommentService interface {
	CreateComment(cardID uint, req dto.CreateCommentRequest) (*dto.CommentResponse, error)
	ListByCard(cardID uint) ([]dto.CommentResponse, error)
	UpdateComment(id uint, req dto.UpdateCommentRequest) (*dto.CommentResponse, error)
	DeleteComment(id uint) error
}

type ImageService interface {
	Upload(cardID uint, fh *multipart.FileHeader) (string, error)
	BoardImageDir(boardID uint) string
	CleanupImages(markdown string)
	CleanupOrphanedImages(oldMarkdown, newMarkdown string)
	ReconcileBoardImages(cardID uint)
}

type Deps struct {
	Repos *repository.Repositories
	Store *store.FileStore
}

type Services struct {
	Board      BoardService
	Column     ColumnService
	Card       CardService
	Tag        TagService
	Checklist  ChecklistService
	Dependency DependencyService
	Comment    CommentService
	Image      ImageService
}

func NewServices(deps Deps) *Services {
	repos := deps.Repos
	imageSvc := newImageService(repos.Card, repos.Column, deps.Store.BasePath())
	return &Services{
		Board:      newBoardService(repos.Board),
		Column:     newColumnService(repos.Board, repos.Column),
		Card:       newCardService(repos.Card, repos.Column, repos.Board, repos.Tag, repos.Checklist, repos.ChecklistItem, repos.Dependency, imageSvc),
		Tag:        newTagService(repos.Tag, repos.Card),
		Checklist:  newChecklistService(repos.Checklist, repos.ChecklistItem, repos.Card),
		Dependency: newDependencyService(repos.Dependency, repos.Card, repos.Column, repos.Board),
		Comment:    newCommentService(repos.Comment, repos.Card, deps.Store, imageSvc),
		Image:      imageSvc,
	}
}
