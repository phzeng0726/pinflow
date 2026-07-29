package store

import (
	"fmt"
	"os"
	"pinflow/model"
	"sort"
	"strings"
)

// Card
// ============================================================

func (s *FileStore) CreateCard(c *CardFile) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	initCardSlices(c)
	col := s.columns[c.ColumnID]
	if col == nil {
		return fmt.Errorf("column %d not found", c.ColumnID)
	}

	s.cards[c.ID] = c
	s.cardsByColumn[c.ColumnID] = append(s.cardsByColumn[c.ColumnID], c.ID)
	s.buildChecklistIndex(c)

	return s.writeJSON(s.cardPath(col.BoardID, c.ID), c)
}

func (s *FileStore) GetCard(id uint) (*CardFile, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	c, ok := s.cards[id]
	if !ok {
		return nil, ErrNotFound
	}
	return copyCard(c), nil
}

func (s *FileStore) GetCardsByColumn(columnID uint) []CardFile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.cardsByColumn[columnID]
	result := make([]CardFile, 0, len(ids))
	for _, id := range ids {
		if c, ok := s.cards[id]; ok {
			if c.ArchivedAt != nil {
				continue
			}
			result = append(result, *copyCard(c))
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Position < result[j].Position
	})
	return result
}

func (s *FileStore) SearchCards(query string, limit int) []CardFile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	lower := strings.ToLower(strings.TrimSpace(query))
	var result []CardFile
	for _, c := range s.cards {
		if c.ArchivedAt != nil {
			continue
		}
		if lower == "" || strings.Contains(strings.ToLower(c.Title), lower) {
			result = append(result, *copyCard(c))
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].UpdatedAt.After(result[j].UpdatedAt)
	})
	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}
	return result
}

func (s *FileStore) GetCardBoardID(cardID uint) (boardID uint, ok bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	card, exists := s.cards[cardID]
	if !exists {
		return 0, false
	}
	col, exists := s.columns[card.ColumnID]
	if !exists {
		return 0, false
	}
	return col.BoardID, true
}

func (s *FileStore) GetPinnedCards() []CardFile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []CardFile
	for _, c := range s.cards {
		if c.IsPinned && c.ArchivedAt == nil {
			result = append(result, *copyCard(c))
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].UpdatedAt.After(result[j].UpdatedAt)
	})
	return result
}

func (s *FileStore) GetArchivedCardsByBoard(boardID uint) []CardFile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []CardFile
	for _, colID := range s.columnsByBoard[boardID] {
		for _, cardID := range s.cardsByColumn[colID] {
			if c, ok := s.cards[cardID]; ok && c.ArchivedAt != nil {
				result = append(result, *copyCard(c))
			}
		}
	}
	return result
}

func (s *FileStore) GetArchivedColumnsByBoard(boardID uint) []model.Column {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.columnsByBoard[boardID]
	var result []model.Column
	for _, id := range ids {
		if c, ok := s.columns[id]; ok && c.ArchivedAt != nil {
			cp := *c
			cp.Cards = nil
			result = append(result, cp)
		}
	}
	return result
}

func (s *FileStore) GetAllCardsByColumn(columnID uint) []CardFile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.cardsByColumn[columnID]
	result := make([]CardFile, 0, len(ids))
	for _, id := range ids {
		if c, ok := s.cards[id]; ok {
			result = append(result, *copyCard(c))
		}
	}
	return result
}

func (s *FileStore) GetColumnIncludingArchived(id uint) (*model.Column, error) {
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

func (s *FileStore) UpdateCard(c *CardFile) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	old, ok := s.cards[c.ID]
	if !ok {
		return ErrNotFound
	}
	initCardSlices(c)

	oldCol := s.columns[old.ColumnID]
	newCol := s.columns[c.ColumnID]
	if oldCol == nil || newCol == nil {
		return fmt.Errorf("column not found")
	}

	// Handle column change
	if old.ColumnID != c.ColumnID {
		s.cardsByColumn[old.ColumnID] = removeFromSlice(s.cardsByColumn[old.ColumnID], c.ID)
		s.cardsByColumn[c.ColumnID] = append(s.cardsByColumn[c.ColumnID], c.ID)
		if oldCol.BoardID != newCol.BoardID {
			oldPath := s.cardPath(oldCol.BoardID, c.ID)
			if err := os.Remove(oldPath); err != nil && !os.IsNotExist(err) {
				return err
			}
			s.notifyDelete(oldPath)
		}
	}

	s.clearChecklistIndex(old)
	s.cards[c.ID] = c
	s.buildChecklistIndex(c)

	return s.writeJSON(s.cardPath(newCol.BoardID, c.ID), c)
}

func (s *FileStore) DeleteCard(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	card, ok := s.cards[id]
	if !ok {
		return ErrNotFound
	}

	s.cleanDependenciesByCard(id)

	if col := s.columns[card.ColumnID]; col != nil {
		path := s.cardPath(col.BoardID, id)
		s.notifyDelete(path)
		os.Remove(path)
	}
	s.clearChecklistIndex(card)
	s.cardsByColumn[card.ColumnID] = removeFromSlice(s.cardsByColumn[card.ColumnID], id)
	delete(s.cards, id)
	return nil
}

// ============================================================
