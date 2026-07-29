package store

import (
	"os"
	"pinflow/model"
	"sort"
)

// Column
// ============================================================

func (s *FileStore) CreateColumn(c *model.Column) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	c.Cards = nil
	s.columns[c.ID] = c
	s.columnsByBoard[c.BoardID] = append(s.columnsByBoard[c.BoardID], c.ID)
	return s.persistColumns(c.BoardID)
}

func (s *FileStore) GetColumn(id uint) (*model.Column, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	c, ok := s.columns[id]
	if !ok {
		return nil, ErrNotFound
	}
	cp := *c
	cp.Cards = nil
	return &cp, nil
}

func (s *FileStore) GetColumnsByBoard(boardID uint) []model.Column {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.columnsByBoard[boardID]
	result := make([]model.Column, 0, len(ids))
	for _, id := range ids {
		if c, ok := s.columns[id]; ok {
			if c.ArchivedAt != nil {
				continue
			}
			cp := *c
			cp.Cards = nil
			result = append(result, cp)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Position < result[j].Position
	})
	return result
}

func (s *FileStore) UpdateColumn(c *model.Column) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	old, ok := s.columns[c.ID]
	if !ok {
		return ErrNotFound
	}
	c.BoardID = old.BoardID
	c.Cards = nil
	s.columns[c.ID] = c
	return s.persistColumns(c.BoardID)
}

func (s *FileStore) DeleteColumn(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	col, ok := s.columns[id]
	if !ok {
		return ErrNotFound
	}
	boardID := col.BoardID

	// Delete cards in this column
	for _, cardID := range s.cardsByColumn[id] {
		if card, ok := s.cards[cardID]; ok {
			s.clearChecklistIndex(card)
			path := s.cardPath(boardID, cardID)
			s.notifyDelete(path)
			os.Remove(path)
		}
		delete(s.cards, cardID)
	}
	delete(s.cardsByColumn, id)

	s.columnsByBoard[boardID] = removeFromSlice(s.columnsByBoard[boardID], id)
	delete(s.columns, id)

	return s.persistColumns(boardID)
}

// ============================================================
