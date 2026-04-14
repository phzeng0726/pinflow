package repository

import "pinflow/model"

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
	CreateOrGet(name string, color string) (*model.Tag, error)
	ListAll() ([]model.Tag, error)
	FindByID(id uint) (*model.Tag, error)
	FindByName(name string) (*model.Tag, error)
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
	CountByCard(cardID uint) (int, error)
}

type ChecklistItemRepository interface {
	Create(item *model.ChecklistItem) error
	FindByID(id uint) (*model.ChecklistItem, error)
	MaxPositionByChecklist(checklistID uint) (float64, error)
	Update(item *model.ChecklistItem) error
	Delete(id uint) error
}

type CommentRepository interface {
	Create(comment *model.Comment) error
	FindByID(id uint) (*model.Comment, error)
	ListByCard(cardID uint) ([]model.Comment, error)
	Update(comment *model.Comment) error
	Delete(id uint) error
}
