package store

import (
	"os"
	"path/filepath"
	"pinflow/model"
	"sort"
)

// Board
// ============================================================

func (s *FileStore) CreateBoard(b *model.Board) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	b.Columns = nil
	s.boards[b.ID] = b

	dir := s.boardDir(b.ID)
	if err := os.MkdirAll(filepath.Join(dir, "cards"), 0755); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(dir, "images"), 0755); err != nil {
		return err
	}
	if err := s.writeJSON(filepath.Join(dir, "board.json"), b); err != nil {
		return err
	}
	if err := s.writeJSON(filepath.Join(dir, "columns.json"), []model.Column{}); err != nil {
		return err
	}

	// Initialize per-board manifest, tags, dependencies
	bm := &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
	s.boardManifests[b.ID] = bm
	if err := s.writeJSON(s.boardManifestPath(b.ID), bm); err != nil {
		return err
	}
	if err := s.writeJSON(s.boardTagsPath(b.ID), []model.Tag{}); err != nil {
		return err
	}
	if err := s.writeJSON(s.boardDependenciesPath(b.ID), []model.Dependency{}); err != nil {
		return err
	}
	s.tagsByBoard[b.ID] = make(map[uint]*model.Tag)
	s.depsByBoard[b.ID] = make(map[uint]*model.Dependency)

	return nil
}

func (s *FileStore) GetBoard(id uint) (*model.Board, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	b, ok := s.boards[id]
	if !ok {
		return nil, ErrNotFound
	}
	cp := *b
	cp.Columns = nil
	return &cp, nil
}

func (s *FileStore) GetAllBoards() []model.Board {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]model.Board, 0, len(s.boards))
	for _, b := range s.boards {
		cp := *b
		cp.Columns = nil
		result = append(result, cp)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.Before(result[j].CreatedAt)
	})
	return result
}

func (s *FileStore) UpdateBoard(b *model.Board) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.boards[b.ID]; !ok {
		return ErrNotFound
	}
	b.Columns = nil
	s.boards[b.ID] = b
	return s.writeJSON(filepath.Join(s.boardDir(b.ID), "board.json"), b)
}

func (s *FileStore) DeleteBoard(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.boards[id]; !ok {
		return ErrNotFound
	}

	path := s.boardDir(id)
	deletedPaths, err := jsonPathsUnder(path)
	if err != nil {
		return err
	}

	for _, colID := range s.columnsByBoard[id] {
		for _, cardID := range s.cardsByColumn[colID] {
			if card, ok := s.cards[cardID]; ok {
				s.clearChecklistIndex(card)
			}
			delete(s.cards, cardID)
		}
		delete(s.cardsByColumn, colID)
		delete(s.columns, colID)
	}
	delete(s.columnsByBoard, id)
	delete(s.boards, id)

	// Clean per-board tag indexes
	if boardTags, ok := s.tagsByBoard[id]; ok {
		for tagID := range boardTags {
			delete(s.tags, tagID)
		}
		delete(s.tagsByBoard, id)
	}

	// Clean per-board dependency indexes
	if boardDeps, ok := s.depsByBoard[id]; ok {
		for depID := range boardDeps {
			delete(s.dependencies, depID)
		}
		delete(s.depsByBoard, id)
	}

	delete(s.boardManifests, id)

	if err := os.RemoveAll(path); err != nil {
		return err
	}
	for _, deletedPath := range deletedPaths {
		s.notifyDelete(deletedPath)
	}
	return nil
}

// ============================================================
