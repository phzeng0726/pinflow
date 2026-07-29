package store

import (
	"fmt"
	"os"
	"path/filepath"
	"pinflow/model"
	"sort"
)

// Internal: paths
// ============================================================

func (s *FileStore) boardDir(boardID uint) string {
	return filepath.Join(s.basePath, "boards", fmt.Sprintf("board-%d", boardID))
}

func (s *FileStore) cardPath(boardID, cardID uint) string {
	return filepath.Join(s.boardDir(boardID), "cards", fmt.Sprintf("card-%d.json", cardID))
}

func (s *FileStore) boardManifestPath(boardID uint) string {
	return filepath.Join(s.boardDir(boardID), "manifest.json")
}

func (s *FileStore) boardTagsPath(boardID uint) string {
	return filepath.Join(s.boardDir(boardID), "tags.json")
}

func (s *FileStore) boardDependenciesPath(boardID uint) string {
	return filepath.Join(s.boardDir(boardID), "dependencies.json")
}

func (s *FileStore) persistTagsForBoard(boardID uint) error {
	boardTags, ok := s.tagsByBoard[boardID]
	if !ok {
		return s.writeJSON(s.boardTagsPath(boardID), []model.Tag{})
	}
	tags := make([]model.Tag, 0, len(boardTags))
	for _, t := range boardTags {
		tags = append(tags, *t)
	}
	sort.Slice(tags, func(i, j int) bool { return tags[i].Name < tags[j].Name })
	return s.writeJSON(s.boardTagsPath(boardID), tags)
}

func (s *FileStore) persistDependenciesForBoard(boardID uint) error {
	boardDeps, ok := s.depsByBoard[boardID]
	if !ok {
		return s.writeJSON(s.boardDependenciesPath(boardID), []model.Dependency{})
	}
	deps := make([]model.Dependency, 0, len(boardDeps))
	for _, d := range boardDeps {
		deps = append(deps, *d)
	}
	return s.writeJSON(s.boardDependenciesPath(boardID), deps)
}

// nextBoardIDLocked allocates the next per-board ID.
// Must be called while mu write lock is held (uses internal boardManifests directly).
func (s *FileStore) nextBoardIDLocked(boardID uint, entity string) uint {
	bm, ok := s.boardManifests[boardID]
	if !ok {
		bm = &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
		s.boardManifests[boardID] = bm
	}
	id := bm.NextIDs[entity]
	if id == 0 {
		id = 1
	}
	bm.NextIDs[entity] = id + 1
	_ = s.writeJSON(s.boardManifestPath(boardID), bm)
	return id
}

// ============================================================
// Internal: persistence
// ============================================================

func (s *FileStore) saveManifest() error {
	return s.writeJSON(filepath.Join(s.basePath, "manifest.json"), &s.manifest)
}

func (s *FileStore) persistColumns(boardID uint) error {
	ids := s.columnsByBoard[boardID]
	cols := make([]model.Column, 0, len(ids))
	for _, id := range ids {
		if c, ok := s.columns[id]; ok {
			cp := *c
			cp.Cards = nil
			cols = append(cols, cp)
		}
	}
	sort.Slice(cols, func(i, j int) bool { return cols[i].Position < cols[j].Position })
	return s.writeJSON(filepath.Join(s.boardDir(boardID), "columns.json"), cols)
}

func (s *FileStore) GetSettings() *model.Settings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cp := *s.settings
	return &cp
}

func (s *FileStore) UpdateSettings(theme, locale *string) *model.Settings {
	s.mu.Lock()
	defer s.mu.Unlock()
	if theme != nil {
		s.settings.Theme = *theme
	}
	if locale != nil {
		s.settings.Locale = *locale
	}
	_ = s.persistSettings()
	cp := *s.settings
	return &cp
}

func (s *FileStore) persistSettings() error {
	return s.writeJSON(filepath.Join(s.basePath, "settings.json"), s.settings)
}

func (s *FileStore) notifyDelete(path string) {
	rel, err := filepath.Rel(s.basePath, path)
	if err != nil {
		return
	}
	s.sendNotification("delete:" + filepath.ToSlash(rel))
}

func jsonPathsUnder(basePath string) ([]string, error) {
	paths := make([]string, 0)
	err := filepath.Walk(basePath, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if !info.IsDir() && filepath.Ext(path) == ".json" {
			paths = append(paths, path)
		}
		return nil
	})
	if os.IsNotExist(err) {
		return paths, nil
	}
	return paths, err
}

// persistTags is kept for backward compat but is a no-op (use persistTagsForBoard).
func (s *FileStore) persistTags() error {
	return nil
}

// ============================================================
