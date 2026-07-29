package store

import (
	"fmt"
	"os"
	"path/filepath"
	"pinflow/model"
)

// Checklist/Item Index Lookups
// ============================================================

func (s *FileStore) CardIDForChecklist(clID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.checklistToCard[clID]
	return id, ok
}

func (s *FileStore) CardIDForChecklistItem(itemID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	clID, ok := s.itemToChecklist[itemID]
	if !ok {
		return 0, false
	}
	cardID, ok := s.checklistToCard[clID]
	return cardID, ok
}

func (s *FileStore) ChecklistIDForItem(itemID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.itemToChecklist[itemID]
	return id, ok
}

func (s *FileStore) CardIDForComment(commentID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.commentToCard[commentID]
	return id, ok
}

// ============================================================
// Public helpers for snapshot middleware
// ============================================================

// BoardDir returns the absolute path of the board directory for the given boardID.
func (s *FileStore) BoardDir(boardID uint) string {
	return s.boardDir(boardID)
}

// BoardManifestPath returns the path to the per-board manifest.json.
func (s *FileStore) BoardManifestPath(boardID uint) string {
	return s.boardManifestPath(boardID)
}

// BoardTagsPath returns the path to the per-board tags.json.
func (s *FileStore) BoardTagsPath(boardID uint) string {
	return s.boardTagsPath(boardID)
}

// BoardDependenciesPath returns the path to the per-board dependencies.json.
func (s *FileStore) BoardDependenciesPath(boardID uint) string {
	return s.boardDependenciesPath(boardID)
}

// BoardIDOfCard returns the boardID for the given cardID via O(1) in-memory lookup.
func (s *FileStore) BoardIDOfCard(cardID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	card, ok := s.cards[cardID]
	if !ok {
		return 0, false
	}
	col, ok := s.columns[card.ColumnID]
	if !ok {
		return 0, false
	}
	return col.BoardID, true
}

// BoardIDOfColumn returns the boardID for the given columnID via O(1) in-memory lookup.
func (s *FileStore) BoardIDOfColumn(columnID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	col, ok := s.columns[columnID]
	if !ok {
		return 0, false
	}
	return col.BoardID, true
}

// BoardIDOfChecklist returns the boardID for the given checklistID via in-memory lookup.
func (s *FileStore) BoardIDOfChecklist(checklistID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cardID, ok := s.checklistToCard[checklistID]
	if !ok {
		return 0, false
	}
	card, ok := s.cards[cardID]
	if !ok {
		return 0, false
	}
	col, ok := s.columns[card.ColumnID]
	if !ok {
		return 0, false
	}
	return col.BoardID, true
}

// BoardIDOfComment returns the boardID for the given commentID via in-memory lookup.
func (s *FileStore) BoardIDOfComment(commentID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cardID, ok := s.commentToCard[commentID]
	if !ok {
		return 0, false
	}
	card, ok := s.cards[cardID]
	if !ok {
		return 0, false
	}
	col, ok := s.columns[card.ColumnID]
	if !ok {
		return 0, false
	}
	return col.BoardID, true
}

// BoardIDOfChecklistItem returns the boardID for the given checklistItemID via in-memory lookup.
func (s *FileStore) BoardIDOfChecklistItem(itemID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	clID, ok := s.itemToChecklist[itemID]
	if !ok {
		return 0, false
	}
	cardID, ok := s.checklistToCard[clID]
	if !ok {
		return 0, false
	}
	card, ok := s.cards[cardID]
	if !ok {
		return 0, false
	}
	col, ok := s.columns[card.ColumnID]
	if !ok {
		return 0, false
	}
	return col.BoardID, true
}

// BoardIDOfDependency returns the boardID for the given dependencyID via in-memory lookup.
func (s *FileStore) BoardIDOfDependency(dependencyID uint) (uint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	dep, ok := s.dependencies[dependencyID]
	if !ok {
		return 0, false
	}
	if dep.BoardID != 0 {
		return dep.BoardID, true
	}
	// Fallback: resolve from fromCardID
	card, ok := s.cards[dep.FromCardID]
	if !ok {
		return 0, false
	}
	col, ok := s.columns[card.ColumnID]
	if !ok {
		return 0, false
	}
	return col.BoardID, true
}

// BumpManifestNextIDs updates NextIDs to max(current, provided) for each entity type.
// Used after snapshot restore to prevent ID collisions.
func (s *FileStore) BumpManifestNextIDs(snapshotNextIDs map[string]uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for key, val := range snapshotNextIDs {
		if current, ok := s.manifest.NextIDs[key]; !ok || val > current {
			s.manifest.NextIDs[key] = val
		}
	}
	return s.saveManifest()
}

// BumpBoardManifestNextIDs updates per-board NextIDs to max(current, provided).
// Used after snapshot restore to prevent per-board ID collisions.
func (s *FileStore) BumpBoardManifestNextIDs(boardID uint, snapshotNextIDs map[string]uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	bm, ok := s.boardManifests[boardID]
	if !ok {
		bm = &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
		s.boardManifests[boardID] = bm
	}
	for key, val := range snapshotNextIDs {
		if current, ok := bm.NextIDs[key]; !ok || val > current {
			bm.NextIDs[key] = val
		}
	}
	return s.writeJSON(s.boardManifestPath(boardID), bm)
}

// GetAllDependencies returns all dependencies in the store.
func (s *FileStore) GetAllDependencies() []model.Dependency {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]model.Dependency, 0, len(s.dependencies))
	for _, d := range s.dependencies {
		result = append(result, *d)
	}
	return result
}

// ReplaceBoardDependencies replaces the per-board dependency map and persists to disk.
// Used during snapshot restore for a specific board.
func (s *FileStore) ReplaceBoardDependencies(boardID uint, deps []model.Dependency) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Remove existing deps for this board from global map
	if boardDeps, ok := s.depsByBoard[boardID]; ok {
		for depID := range boardDeps {
			delete(s.dependencies, depID)
		}
	}

	newBoardDeps := make(map[uint]*model.Dependency, len(deps))
	for i := range deps {
		deps[i].BoardID = boardID
		s.dependencies[deps[i].ID] = &deps[i]
		newBoardDeps[deps[i].ID] = &deps[i]
	}
	s.depsByBoard[boardID] = newBoardDeps
	return s.persistDependenciesForBoard(boardID)
}

// ReplaceAllDependencies replaces the entire in-memory dependency map and persists to disk.
// Deprecated: use ReplaceBoardDependencies for per-board operations.
func (s *FileStore) ReplaceAllDependencies(deps []model.Dependency) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.dependencies = make(map[uint]*model.Dependency, len(deps))
	// Clear all per-board dep maps
	for k := range s.depsByBoard {
		s.depsByBoard[k] = make(map[uint]*model.Dependency)
	}
	for i := range deps {
		s.dependencies[deps[i].ID] = &deps[i]
		boardID := deps[i].BoardID
		if s.depsByBoard[boardID] == nil {
			s.depsByBoard[boardID] = make(map[uint]*model.Dependency)
		}
		s.depsByBoard[boardID][deps[i].ID] = &deps[i]
	}
	// Persist per-board
	for boardID, boardDeps := range s.depsByBoard {
		depSlice := make([]model.Dependency, 0, len(boardDeps))
		for _, d := range boardDeps {
			depSlice = append(depSlice, *d)
		}
		if err := s.writeJSON(s.boardDependenciesPath(boardID), depSlice); err != nil {
			return err
		}
	}
	return nil
}

// ReloadBoard clears and reloads all in-memory state for the given board from disk.
// This is used after a snapshot restore to bring the in-memory state up to date.
func (s *FileStore) ReloadBoard(boardID uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Clear existing in-memory data for this board
	for _, colID := range s.columnsByBoard[boardID] {
		for _, cardID := range s.cardsByColumn[colID] {
			if card, ok := s.cards[cardID]; ok {
				s.clearChecklistIndex(card)
			}
			delete(s.cards, cardID)
		}
		delete(s.cardsByColumn, colID)
		delete(s.columns, colID)
	}
	delete(s.columnsByBoard, boardID)

	// Clear per-board tags
	if boardTags, ok := s.tagsByBoard[boardID]; ok {
		for tagID := range boardTags {
			delete(s.tags, tagID)
		}
	}
	s.tagsByBoard[boardID] = make(map[uint]*model.Tag)

	// Clear per-board deps
	if boardDeps, ok := s.depsByBoard[boardID]; ok {
		for depID := range boardDeps {
			delete(s.dependencies, depID)
		}
	}
	s.depsByBoard[boardID] = make(map[uint]*model.Dependency)

	dir := s.boardDir(boardID)

	// Reload per-board manifest.json
	bm := &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
	bmp := s.boardManifestPath(boardID)
	if fileExists(bmp) {
		_ = readJSON(bmp, bm)
	}
	s.boardManifests[boardID] = bm

	// Reload per-board tags.json
	tagPath := s.boardTagsPath(boardID)
	if fileExists(tagPath) {
		var tags []model.Tag
		if err := readJSON(tagPath, &tags); err == nil {
			for i := range tags {
				tags[i].BoardID = boardID
				s.tags[tags[i].ID] = &tags[i]
				s.tagsByBoard[boardID][tags[i].ID] = &tags[i]
			}
		}
	}

	// Reload per-board dependencies.json
	depPath := s.boardDependenciesPath(boardID)
	if fileExists(depPath) {
		var deps []model.Dependency
		if err := readJSON(depPath, &deps); err == nil {
			for i := range deps {
				deps[i].BoardID = boardID
				s.dependencies[deps[i].ID] = &deps[i]
				s.depsByBoard[boardID][deps[i].ID] = &deps[i]
			}
		}
	}

	// Reload board.json
	bp := filepath.Join(dir, "board.json")
	if fileExists(bp) {
		var board model.Board
		if err := readJSON(bp, &board); err != nil {
			return fmt.Errorf("reload board.json: %w", err)
		}
		board.Columns = nil
		s.boards[boardID] = &board
	}

	// Reload columns.json
	cp := filepath.Join(dir, "columns.json")
	if fileExists(cp) {
		var cols []model.Column
		if err := readJSON(cp, &cols); err == nil {
			for i := range cols {
				cols[i].Cards = nil
				s.columns[cols[i].ID] = &cols[i]
				s.columnsByBoard[boardID] = append(s.columnsByBoard[boardID], cols[i].ID)
			}
		}
	}

	// Reload cards/
	cardsDir := filepath.Join(dir, "cards")
	cardEntries, err := os.ReadDir(cardsDir)
	if err != nil {
		return nil // no cards dir is acceptable
	}
	for _, ce := range cardEntries {
		if ce.IsDir() || filepath.Ext(ce.Name()) != ".json" {
			continue
		}
		var card CardFile
		if err := readJSON(filepath.Join(cardsDir, ce.Name()), &card); err != nil {
			continue
		}
		initCardSlices(&card)
		s.cards[card.ID] = &card
		s.cardsByColumn[card.ColumnID] = append(s.cardsByColumn[card.ColumnID], card.ID)
		s.buildChecklistIndex(&card)
	}

	return nil
}

// ============================================================
