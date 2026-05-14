package repository

import (
	"sort"
	"time"

	"pinflow/model"
	"pinflow/store"
)

type boardRepository struct {
	s *store.FileStore
}

func newBoardRepository(s *store.FileStore) BoardRepository {
	return &boardRepository{s: s}
}

func (r *boardRepository) Create(board *model.Board) error {
	board.ID = r.s.NextID("board")
	now := time.Now()
	board.CreatedAt = now
	board.UpdatedAt = now
	return r.s.CreateBoard(board)
}

func (r *boardRepository) FindAll() ([]model.Board, error) {
	boards := r.s.GetAllBoards()
	for i := range boards {
		cols := r.s.GetColumnsByBoard(boards[i].ID)
		sort.Slice(cols, func(a, b int) bool { return cols[a].Position < cols[b].Position })
		boards[i].Columns = cols
	}
	sort.Slice(boards, func(i, j int) bool {
		if boards[i].Position != boards[j].Position {
			return boards[i].Position < boards[j].Position
		}
		return boards[i].ID < boards[j].ID
	})
	return boards, nil
}

func (r *boardRepository) FindByID(id uint) (*model.Board, error) {
	board, err := r.s.GetBoard(id)
	if err != nil {
		return nil, err
	}

	cols := r.s.GetColumnsByBoard(id)
	sort.Slice(cols, func(i, j int) bool { return cols[i].Position < cols[j].Position })

	for ci := range cols {
		cards := r.s.GetCardsByColumn(cols[ci].ID)
		sort.Slice(cards, func(i, j int) bool { return cards[i].Position < cards[j].Position })

		modelCards := make([]model.Card, 0, len(cards))
		for _, cf := range cards {
			card := cardFileToModel(&cf, r.s)
			card.DependencyCount = r.s.CountDependenciesByCard(card.ID)
			modelCards = append(modelCards, card)
		}
		cols[ci].Cards = modelCards
	}

	board.Columns = cols
	return board, nil
}

func (r *boardRepository) Update(board *model.Board) error {
	board.UpdatedAt = time.Now()
	return r.s.UpdateBoard(board)
}

func (r *boardRepository) Delete(id uint) error {
	return r.s.DeleteBoard(id)
}

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

	comments := make([]model.Comment, len(cf.Comments))
	copy(comments, cf.Comments)

	return model.Card{
		ID:          cf.ID,
		ColumnID:    cf.ColumnID,
		Title:       cf.Title,
		Description: cf.Description,
		Position:    cf.Position,
		IsPinned:    cf.IsPinned,
		StoryPoint:  cf.StoryPoint,
		Priority:    cf.Priority,
		StartTime:   cf.StartTime,
		EndTime:     cf.EndTime,
		ArchivedAt:  cf.ArchivedAt,
		Tags:        tags,
		Checklists:  checklists,
		Comments:    comments,
		CreatedAt:   cf.CreatedAt,
		UpdatedAt:   cf.UpdatedAt,
	}
}

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
		Priority:    card.Priority,
		StartTime:   card.StartTime,
		EndTime:     card.EndTime,
		ArchivedAt:  card.ArchivedAt,
		TagIDs:      tagIDs,
		Checklists:  checklists,
		CreatedAt:   card.CreatedAt,
		UpdatedAt:   card.UpdatedAt,
	}
}
