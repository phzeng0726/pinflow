package repository

import (
	"sort"
	"time"

	"pinflow/model"
	"pinflow/store"
)

type fileBoardRepository struct {
	s *store.FileStore
}

func NewFileBoardRepository(s *store.FileStore) BoardRepository {
	return &fileBoardRepository{s: s}
}

func (r *fileBoardRepository) Create(board *model.Board) error {
	board.ID = r.s.NextID("board")
	now := time.Now()
	board.CreatedAt = now
	board.UpdatedAt = now
	return r.s.CreateBoard(board)
}

func (r *fileBoardRepository) FindAll() ([]model.Board, error) {
	return r.s.GetAllBoards(), nil
}

func (r *fileBoardRepository) FindByID(id uint) (*model.Board, error) {
	board, err := r.s.GetBoard(id)
	if err != nil {
		return nil, err
	}

	// Assemble full nested structure: Board → Columns → Cards → Tags + Checklists
	cols := r.s.GetColumnsByBoard(id)
	sort.Slice(cols, func(i, j int) bool { return cols[i].Position < cols[j].Position })

	for ci := range cols {
		cards := r.s.GetCardsByColumn(cols[ci].ID)
		sort.Slice(cards, func(i, j int) bool { return cards[i].Position < cards[j].Position })

		modelCards := make([]model.Card, 0, len(cards))
		for _, cf := range cards {
			card := cardFileToModel(&cf, r.s)
			modelCards = append(modelCards, card)
		}
		cols[ci].Cards = modelCards
	}

	board.Columns = cols
	return board, nil
}

func (r *fileBoardRepository) Update(board *model.Board) error {
	board.UpdatedAt = time.Now()
	return r.s.UpdateBoard(board)
}

func (r *fileBoardRepository) Delete(id uint) error {
	return r.s.DeleteBoard(id)
}

// cardFileToModel converts a store.CardFile to a model.Card, resolving tag IDs to Tag objects.
func cardFileToModel(cf *store.CardFile, s *store.FileStore) model.Card {
	tags := make([]model.Tag, 0, len(cf.TagIDs))
	for _, tagID := range cf.TagIDs {
		t, err := s.GetTag(tagID)
		if err == nil {
			tags = append(tags, *t)
		}
	}

	// Sort checklists by ID asc, items by position asc (matching GORM behavior)
	checklists := make([]model.Checklist, len(cf.Checklists))
	copy(checklists, cf.Checklists)
	sort.Slice(checklists, func(i, j int) bool { return checklists[i].ID < checklists[j].ID })
	for i := range checklists {
		items := make([]model.ChecklistItem, len(checklists[i].Items))
		copy(items, checklists[i].Items)
		sort.Slice(items, func(a, b int) bool { return items[a].Position < items[b].Position })
		checklists[i].Items = items
	}

	return model.Card{
		ID:          cf.ID,
		ColumnID:    cf.ColumnID,
		Title:       cf.Title,
		Description: cf.Description,
		Position:    cf.Position,
		IsPinned:    cf.IsPinned,
		StoryPoint:  cf.StoryPoint,
		StartTime:   cf.StartTime,
		EndTime:     cf.EndTime,
		Tags:        tags,
		Checklists:  checklists,
		CreatedAt:   cf.CreatedAt,
		UpdatedAt:   cf.UpdatedAt,
	}
}

// modelToCardFile converts a model.Card to a store.CardFile, extracting tag IDs.
func modelToCardFile(card *model.Card) *store.CardFile {
	tagIDs := make([]uint, len(card.Tags))
	for i, t := range card.Tags {
		tagIDs[i] = t.ID
	}

	checklists := make([]model.Checklist, len(card.Checklists))
	copy(checklists, card.Checklists)

	return &store.CardFile{
		ID:          card.ID,
		ColumnID:    card.ColumnID,
		Title:       card.Title,
		Description: card.Description,
		Position:    card.Position,
		IsPinned:    card.IsPinned,
		StoryPoint:  card.StoryPoint,
		StartTime:   card.StartTime,
		EndTime:     card.EndTime,
		TagIDs:      tagIDs,
		Checklists:  checklists,
		CreatedAt:   card.CreatedAt,
		UpdatedAt:   card.UpdatedAt,
	}
}
