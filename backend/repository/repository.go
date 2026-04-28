package repository

import (
	"pinflow/model"
	"pinflow/store"
)

type BoardRepository interface {
	Create(board *model.Board) error
	FindAll() ([]model.Board, error)
	FindByID(id uint) (*model.Board, error)
	Update(board *model.Board) error
	Delete(id uint) error
}

type ColumnRepository interface {
	Create(column *model.Column) error
	FindByID(id uint) (*model.Column, error)
	FindByBoardID(boardID uint) ([]model.Column, error)
	MaxPositionByBoard(boardID uint) (float64, error)
	Update(column *model.Column) error
	Delete(id uint) error
}

type CardRepository interface {
	Create(card *model.Card) error
	FindByID(id uint) (*model.Card, error)
	FindDetail(id uint) (*model.Card, error)
	FindByColumnID(columnID uint) ([]model.Card, error)
	MaxPositionByColumn(columnID uint) (float64, error)
	Update(card *model.Card) error
	UpdateColumnAndPosition(id uint, columnID uint, position float64, isPinned bool) error
	UpdatePinned(id uint, isPinned bool) error
	FindPinned() ([]model.Card, error)
	Search(query string, limit int) ([]model.Card, error)
	Delete(id uint) error
}

type TagRepository interface {
	CreateOrGet(boardID uint, name string, color string) (*model.Tag, error)
	ListByBoard(boardID uint) ([]model.Tag, error)
	FindByID(id uint) (*model.Tag, error)
	FindByName(boardID uint, name string) (*model.Tag, error)
	Update(tag *model.Tag) error
	Delete(id uint) error
	AttachToCard(cardID, tagID uint) error
	DetachFromCard(cardID, tagID uint) error
	ListByCard(cardID uint) ([]model.Tag, error)
}

type ChecklistRepository interface {
	Create(checklist *model.Checklist) error
	FindByID(id uint) (*model.Checklist, error)
	ListByCard(cardID uint) ([]model.Checklist, error)
	MaxPositionByCard(cardID uint) (float64, error)
	Update(checklist *model.Checklist) error
	Delete(id uint) error
}

type DependencyRepository interface {
	Create(dep *model.Dependency) error
	Delete(id uint) error
	ListByCard(cardID uint) ([]model.Dependency, error)
	ListByBoard(boardID uint) ([]model.Dependency, error)
	CountByCard(cardID uint) (int, error)
}

type ChecklistItemRepository interface {
	Create(item *model.ChecklistItem) error
	FindByID(id uint) (*model.ChecklistItem, error)
	MaxPositionByChecklist(checklistID uint) (float64, error)
	Update(item *model.ChecklistItem) error
	MoveItem(itemID uint, targetChecklistID uint, position float64) error
	Delete(id uint) error
	SyncItems(checklistID uint, items []model.ChecklistItem) ([]model.ChecklistItem, error)
}

type CommentRepository interface {
	Create(comment *model.Comment) error
	FindByID(id uint) (*model.Comment, error)
	ListByCard(cardID uint) ([]model.Comment, error)
	Update(comment *model.Comment) error
	Delete(id uint) error
}

type Repositories struct {
	Board         BoardRepository
	Column        ColumnRepository
	Card          CardRepository
	Tag           TagRepository
	Checklist     ChecklistRepository
	ChecklistItem ChecklistItemRepository
	Dependency    DependencyRepository
	Comment       CommentRepository
	Settings      SettingsRepository
	Snapshot      SnapshotRepository
}

func NewRepositories(fs *store.FileStore) *Repositories {
	return &Repositories{
		Board:         newBoardRepository(fs),
		Column:        newColumnRepository(fs),
		Card:          newCardRepository(fs),
		Tag:           newTagRepository(fs),
		Checklist:     newChecklistRepository(fs),
		ChecklistItem: newChecklistItemRepository(fs),
		Dependency:    newDependencyRepository(fs),
		Comment:       newCommentRepository(fs),
		Settings:      newSettingsRepository(fs),
		Snapshot:      newSnapshotRepository(fs),
	}
}
