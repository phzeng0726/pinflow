package store

import (
	"fmt"
	"pinflow/model"
)

// Dependency
// ============================================================

var ErrDependencyConflict = fmt.Errorf("dependency already exists")
var ErrSelfReference = fmt.Errorf("a card cannot depend on itself")

func (s *FileStore) CreateDependency(d *model.Dependency) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if d.FromCardID == d.ToCardID {
		return ErrSelfReference
	}

	// Verify both cards belong to the same board (and auto-fill BoardID)
	fromCard, ok := s.cards[d.FromCardID]
	if !ok {
		return fmt.Errorf("from card %d not found", d.FromCardID)
	}
	toCard, ok := s.cards[d.ToCardID]
	if !ok {
		return fmt.Errorf("to card %d not found", d.ToCardID)
	}
	fromCol, ok := s.columns[fromCard.ColumnID]
	if !ok {
		return fmt.Errorf("column for from card not found")
	}
	toCol, ok := s.columns[toCard.ColumnID]
	if !ok {
		return fmt.Errorf("column for to card not found")
	}
	if fromCol.BoardID != toCol.BoardID {
		return ErrCrossBoardDependency
	}
	d.BoardID = fromCol.BoardID

	// Duplicate check within board
	if boardDeps, ok := s.depsByBoard[d.BoardID]; ok {
		for _, existing := range boardDeps {
			if existing.Type == d.Type {
				if existing.FromCardID == d.FromCardID && existing.ToCardID == d.ToCardID {
					return ErrDependencyConflict
				}
				if d.Type == model.DependencyTypeRelatedTo &&
					existing.FromCardID == d.ToCardID && existing.ToCardID == d.FromCardID {
					return ErrDependencyConflict
				}
			}
		}
	}

	d.ID = s.nextBoardIDLocked(d.BoardID, "dependency")
	s.dependencies[d.ID] = d
	if s.depsByBoard[d.BoardID] == nil {
		s.depsByBoard[d.BoardID] = make(map[uint]*model.Dependency)
	}
	s.depsByBoard[d.BoardID][d.ID] = d
	return s.persistDependenciesForBoard(d.BoardID)
}

func (s *FileStore) DeleteDependency(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	dep, ok := s.dependencies[id]
	if !ok {
		return ErrNotFound
	}
	boardID := dep.BoardID
	delete(s.dependencies, id)
	if boardDeps, ok := s.depsByBoard[boardID]; ok {
		delete(boardDeps, id)
	}
	return s.persistDependenciesForBoard(boardID)
}

func (s *FileStore) ListDependenciesByCard(cardID uint) []model.Dependency {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.Dependency
	for _, d := range s.dependencies {
		if d.FromCardID == cardID || d.ToCardID == cardID {
			result = append(result, *d)
		}
	}
	return result
}

func (s *FileStore) CountDependenciesByCard(cardID uint) int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	count := 0
	for _, d := range s.dependencies {
		if d.FromCardID == cardID || d.ToCardID == cardID {
			count++
		}
	}
	return count
}

func (s *FileStore) ListDependenciesByBoard(boardID uint) []model.Dependency {
	s.mu.RLock()
	defer s.mu.RUnlock()

	boardDeps, ok := s.depsByBoard[boardID]
	if !ok {
		return nil
	}
	result := make([]model.Dependency, 0, len(boardDeps))
	for _, d := range boardDeps {
		result = append(result, *d)
	}
	return result
}

func (s *FileStore) cleanDependenciesByCard(cardID uint) {
	// Collect all affected board IDs
	affected := make(map[uint]struct{})
	for id, d := range s.dependencies {
		if d.FromCardID == cardID || d.ToCardID == cardID {
			affected[d.BoardID] = struct{}{}
			if boardDeps, ok := s.depsByBoard[d.BoardID]; ok {
				delete(boardDeps, id)
			}
			delete(s.dependencies, id)
		}
	}
	for boardID := range affected {
		_ = s.persistDependenciesForBoard(boardID)
	}
}

// ============================================================
