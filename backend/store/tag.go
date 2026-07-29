package store

import (
	"fmt"
	"pinflow/model"
	"sort"
	"strings"
)

// Tag
// ============================================================

func (s *FileStore) CreateTag(t *model.Tag) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if t.BoardID == 0 {
		return fmt.Errorf("tag must have a BoardID")
	}

	t.ID = s.nextBoardIDLocked(t.BoardID, "tag")
	s.tags[t.ID] = t
	if s.tagsByBoard[t.BoardID] == nil {
		s.tagsByBoard[t.BoardID] = make(map[uint]*model.Tag)
	}
	s.tagsByBoard[t.BoardID][t.ID] = t
	return s.persistTagsForBoard(t.BoardID)
}

func (s *FileStore) GetTag(id uint) (*model.Tag, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	t, ok := s.tags[id]
	if !ok {
		return nil, ErrNotFound
	}
	cp := *t
	return &cp, nil
}

func (s *FileStore) GetTagByName(boardID uint, name string) (*model.Tag, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	lower := strings.ToLower(strings.TrimSpace(name))
	boardTags, ok := s.tagsByBoard[boardID]
	if !ok {
		return nil, ErrNotFound
	}
	for _, t := range boardTags {
		if strings.ToLower(t.Name) == lower {
			cp := *t
			return &cp, nil
		}
	}
	return nil, ErrNotFound
}

func (s *FileStore) GetTagsByBoard(boardID uint) []model.Tag {
	s.mu.RLock()
	defer s.mu.RUnlock()

	boardTags, ok := s.tagsByBoard[boardID]
	if !ok {
		return nil
	}
	result := make([]model.Tag, 0, len(boardTags))
	for _, t := range boardTags {
		result = append(result, *t)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result
}

func (s *FileStore) UpdateTag(t *model.Tag) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	old, ok := s.tags[t.ID]
	if !ok {
		return ErrNotFound
	}
	// Preserve BoardID
	if t.BoardID == 0 {
		t.BoardID = old.BoardID
	}
	s.tags[t.ID] = t
	if s.tagsByBoard[t.BoardID] == nil {
		s.tagsByBoard[t.BoardID] = make(map[uint]*model.Tag)
	}
	s.tagsByBoard[t.BoardID][t.ID] = t
	return s.persistTagsForBoard(t.BoardID)
}

func (s *FileStore) DeleteTag(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	tag, ok := s.tags[id]
	if !ok {
		return ErrNotFound
	}
	boardID := tag.BoardID
	delete(s.tags, id)
	if boardTags, ok := s.tagsByBoard[boardID]; ok {
		delete(boardTags, id)
	}

	// Remove tag reference only from cards in this board
	for _, colID := range s.columnsByBoard[boardID] {
		for _, cardID := range s.cardsByColumn[colID] {
			card, ok := s.cards[cardID]
			if !ok {
				continue
			}
			newIDs, found := removeFromSliceWithFlag(card.TagIDs, id)
			if found {
				card.TagIDs = newIDs
				if col := s.columns[card.ColumnID]; col != nil {
					_ = s.writeJSON(s.cardPath(col.BoardID, card.ID), card)
				}
			}
		}
	}

	return s.persistTagsForBoard(boardID)
}

// ============================================================
// Tag-Card Association
// ============================================================

func (s *FileStore) AttachTagToCard(cardID, tagID uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	card, ok := s.cards[cardID]
	if !ok {
		return ErrNotFound
	}
	tag, ok := s.tags[tagID]
	if !ok {
		return ErrNotFound
	}

	// Cross-board check
	col, ok := s.columns[card.ColumnID]
	if !ok {
		return fmt.Errorf("column for card not found")
	}
	if tag.BoardID != col.BoardID {
		return ErrCrossBoardTag
	}

	for _, id := range card.TagIDs {
		if id == tagID {
			return nil // already attached
		}
	}
	card.TagIDs = append(card.TagIDs, tagID)
	return s.writeJSON(s.cardPath(col.BoardID, card.ID), card)
}

func (s *FileStore) DetachTagFromCard(cardID, tagID uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	card, ok := s.cards[cardID]
	if !ok {
		return ErrNotFound
	}
	card.TagIDs = removeFromSlice(card.TagIDs, tagID)
	if col := s.columns[card.ColumnID]; col != nil {
		return s.writeJSON(s.cardPath(col.BoardID, card.ID), card)
	}
	return nil
}

func (s *FileStore) GetTagIDsByCard(cardID uint) []uint {
	s.mu.RLock()
	defer s.mu.RUnlock()

	card, ok := s.cards[cardID]
	if !ok {
		return nil
	}
	result := make([]uint, len(card.TagIDs))
	copy(result, card.TagIDs)
	return result
}

// ============================================================
