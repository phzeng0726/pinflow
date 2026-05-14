package store

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"pinflow/model"
)

// ErrNotFound is returned when an entity is not found in the store.
var ErrNotFound = fmt.Errorf("record not found")

// ErrCrossBoardTag is returned when a tag is attached to a card on a different board.
var ErrCrossBoardTag = fmt.Errorf("tag belongs to a different board")

// ErrCrossBoardDependency is returned when a dependency is created across different boards.
var ErrCrossBoardDependency = fmt.Errorf("dependency cards belong to different boards")

// Manifest tracks the workspace version and auto-increment ID counters.
type Manifest struct {
	Version     string          `json:"version"`
	WorkspaceID string          `json:"workspaceId,omitempty"`
	NextIDs     map[string]uint `json:"next_ids"`
}

// BoardManifest tracks per-board auto-increment ID counters (tag, dependency).
type BoardManifest struct {
	NextIDs map[string]uint `json:"next_ids"`
}

// CardFile is the on-disk representation of a card (card-N.json).
// Tags are stored as IDs (resolved at query time); checklists and comments are embedded.
type CardFile struct {
	ID          uint              `json:"id"`
	ColumnID    uint              `json:"columnId"`
	Title       string            `json:"title"`
	Description string            `json:"description"`
	Position    float64           `json:"position"`
	IsPinned    bool              `json:"isPinned"`
	StoryPoint  *int              `json:"storyPoint"`
	Priority    *int              `json:"priority"`
	StartTime   *time.Time        `json:"startTime"`
	EndTime     *time.Time        `json:"endTime"`
	TagIDs      []uint            `json:"tag_ids"`
	Checklists  []model.Checklist `json:"checklists"`
	Comments    []model.Comment   `json:"comments"`
	ArchivedAt  *time.Time        `json:"archivedAt"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// FileStore is an in-memory data store backed by a workspace directory of JSON files.
// All reads are served from memory; writes are persisted to disk synchronously.
type FileStore struct {
	basePath string
	mu       sync.RWMutex
	idMu     sync.Mutex // dedicated mutex for NextID — separate from mu to avoid deadlock

	manifest Manifest

	boards       map[uint]*model.Board
	columns      map[uint]*model.Column
	cards        map[uint]*CardFile
	tags         map[uint]*model.Tag
	dependencies map[uint]*model.Dependency
	settings     *model.Settings

	// Per-board manifests (tag/dep ID counters)
	boardManifests map[uint]*BoardManifest

	// Per-board indexes
	tagsByBoard map[uint]map[uint]*model.Tag        // boardID → tagID → Tag
	depsByBoard map[uint]map[uint]*model.Dependency // boardID → depID → Dependency

	// Reverse indexes for O(1) lookups
	columnsByBoard  map[uint][]uint // boardID → []columnID
	cardsByColumn   map[uint][]uint // columnID → []cardID
	checklistToCard map[uint]uint   // checklistID → cardID
	itemToChecklist map[uint]uint   // checklistItemID → checklistID
	commentToCard   map[uint]uint   // commentID → cardID
}

// New creates or opens a workspace at basePath, loading all existing data into memory.
func New(basePath string) (*FileStore, error) {
	s := &FileStore{
		basePath:        basePath,
		boards:          make(map[uint]*model.Board),
		columns:         make(map[uint]*model.Column),
		cards:           make(map[uint]*CardFile),
		tags:            make(map[uint]*model.Tag),
		dependencies:    make(map[uint]*model.Dependency),
		boardManifests:  make(map[uint]*BoardManifest),
		tagsByBoard:     make(map[uint]map[uint]*model.Tag),
		depsByBoard:     make(map[uint]map[uint]*model.Dependency),
		columnsByBoard:  make(map[uint][]uint),
		cardsByColumn:   make(map[uint][]uint),
		checklistToCard: make(map[uint]uint),
		itemToChecklist: make(map[uint]uint),
		commentToCard:   make(map[uint]uint),
		manifest: Manifest{
			Version: "1.0",
			NextIDs: map[string]uint{
				"board": 1, "column": 1, "card": 1,
				"checklist": 1, "checklist_item": 1,
				"comment": 1, "snapshot": 1,
			},
		},
	}

	if err := os.MkdirAll(filepath.Join(basePath, "boards"), 0755); err != nil {
		return nil, fmt.Errorf("create workspace: %w", err)
	}

	if err := s.load(); err != nil {
		return nil, fmt.Errorf("load workspace: %w", err)
	}

	return s, nil
}

// BasePath returns the workspace root directory.
func (s *FileStore) BasePath() string {
	return s.basePath
}

// WorkspaceID returns the unique identifier for this workspace.
func (s *FileStore) WorkspaceID() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.manifest.WorkspaceID
}

// ============================================================
// Loading
// ============================================================

func (s *FileStore) load() error {
	// Manifest
	mp := filepath.Join(s.basePath, "manifest.json")
	if fileExists(mp) {
		if err := readJSON(mp, &s.manifest); err != nil {
			return fmt.Errorf("manifest: %w", err)
		}
	} else {
		if err := s.saveManifest(); err != nil {
			return err
		}
	}
	if s.manifest.WorkspaceID == "" {
		s.manifest.WorkspaceID = uuid.New().String()
		if err := s.saveManifest(); err != nil {
			return err
		}
	}

	// Settings
	sp := filepath.Join(s.basePath, "settings.json")
	if fileExists(sp) {
		var settings model.Settings
		if err := readJSON(sp, &settings); err != nil {
			return fmt.Errorf("settings: %w", err)
		}
		s.settings = &settings
	} else {
		s.settings = &model.Settings{Theme: "dark", Locale: "en-US"}
		if err := s.persistSettings(); err != nil {
			return err
		}
	}

	// Boards (per-board data: manifest, tags, dependencies, columns, cards)
	entries, err := os.ReadDir(filepath.Join(s.basePath, "boards"))
	if err != nil {
		return nil
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		dir := filepath.Join(s.basePath, "boards", entry.Name())

		// board.json
		bp := filepath.Join(dir, "board.json")
		if !fileExists(bp) {
			continue
		}
		var board model.Board
		if err := readJSON(bp, &board); err != nil {
			continue
		}
		board.Columns = nil
		s.boards[board.ID] = &board

		// per-board manifest.json
		bm := &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
		bmp := s.boardManifestPath(board.ID)
		if fileExists(bmp) {
			_ = readJSON(bmp, bm)
		}
		s.boardManifests[board.ID] = bm

		// per-board tags.json
		s.tagsByBoard[board.ID] = make(map[uint]*model.Tag)
		tagPath := s.boardTagsPath(board.ID)
		if fileExists(tagPath) {
			var tags []model.Tag
			if err := readJSON(tagPath, &tags); err == nil {
				for i := range tags {
					tags[i].BoardID = board.ID
					s.tags[tags[i].ID] = &tags[i]
					s.tagsByBoard[board.ID][tags[i].ID] = &tags[i]
				}
			}
		}

		// per-board dependencies.json
		s.depsByBoard[board.ID] = make(map[uint]*model.Dependency)
		depPath := s.boardDependenciesPath(board.ID)
		if fileExists(depPath) {
			var deps []model.Dependency
			if err := readJSON(depPath, &deps); err == nil {
				for i := range deps {
					deps[i].BoardID = board.ID
					s.dependencies[deps[i].ID] = &deps[i]
					s.depsByBoard[board.ID][deps[i].ID] = &deps[i]
				}
			}
		}

		// columns.json
		cp := filepath.Join(dir, "columns.json")
		if fileExists(cp) {
			var cols []model.Column
			if err := readJSON(cp, &cols); err == nil {
				for i := range cols {
					cols[i].Cards = nil
					s.columns[cols[i].ID] = &cols[i]
					s.columnsByBoard[board.ID] = append(s.columnsByBoard[board.ID], cols[i].ID)
				}
			}
		}

		// cards/
		cardsDir := filepath.Join(dir, "cards")
		cardEntries, err := os.ReadDir(cardsDir)
		if err != nil {
			continue
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
	}

	return nil
}

// ============================================================
// ID Generation
// ============================================================

// NextID returns the next auto-increment ID for the given entity type
// and persists the updated counter. Thread-safe.
func (s *FileStore) NextID(entity string) uint {
	s.idMu.Lock()
	defer s.idMu.Unlock()
	id := s.manifest.NextIDs[entity]
	if id == 0 {
		id = 1
	}
	s.manifest.NextIDs[entity] = id + 1
	_ = s.saveManifest()
	return id
}

// NextBoardID returns the next auto-increment ID for a per-board entity (e.g. "tag", "dependency").
// Thread-safe.
func (s *FileStore) NextBoardID(boardID uint, entity string) uint {
	s.idMu.Lock()
	defer s.idMu.Unlock()
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
	_ = writeBoardManifest(s.boardManifestPath(boardID), bm)
	return id
}

func writeBoardManifest(path string, bm *BoardManifest) error {
	return writeJSON(path, bm)
}

// ============================================================
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
	if err := writeJSON(filepath.Join(dir, "board.json"), b); err != nil {
		return err
	}
	if err := writeJSON(filepath.Join(dir, "columns.json"), []model.Column{}); err != nil {
		return err
	}

	// Initialize per-board manifest, tags, dependencies
	bm := &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
	s.boardManifests[b.ID] = bm
	if err := writeJSON(s.boardManifestPath(b.ID), bm); err != nil {
		return err
	}
	if err := writeJSON(s.boardTagsPath(b.ID), []model.Tag{}); err != nil {
		return err
	}
	if err := writeJSON(s.boardDependenciesPath(b.ID), []model.Dependency{}); err != nil {
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
	return writeJSON(filepath.Join(s.boardDir(b.ID), "board.json"), b)
}

func (s *FileStore) DeleteBoard(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.boards[id]; !ok {
		return ErrNotFound
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

	return os.RemoveAll(s.boardDir(id))
}

// ============================================================
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
			os.Remove(s.cardPath(boardID, cardID))
		}
		delete(s.cards, cardID)
	}
	delete(s.cardsByColumn, id)

	s.columnsByBoard[boardID] = removeFromSlice(s.columnsByBoard[boardID], id)
	delete(s.columns, id)

	return s.persistColumns(boardID)
}

// ============================================================
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

	return writeJSON(s.cardPath(col.BoardID, c.ID), c)
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
			os.Remove(s.cardPath(oldCol.BoardID, c.ID))
		}
	}

	s.clearChecklistIndex(old)
	s.cards[c.ID] = c
	s.buildChecklistIndex(c)

	return writeJSON(s.cardPath(newCol.BoardID, c.ID), c)
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
		os.Remove(s.cardPath(col.BoardID, id))
	}
	s.clearChecklistIndex(card)
	s.cardsByColumn[card.ColumnID] = removeFromSlice(s.cardsByColumn[card.ColumnID], id)
	delete(s.cards, id)
	return nil
}

// ============================================================
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
					_ = writeJSON(s.cardPath(col.BoardID, card.ID), card)
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
	return writeJSON(s.cardPath(col.BoardID, card.ID), card)
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
		return writeJSON(s.cardPath(col.BoardID, card.ID), card)
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
	return writeJSON(s.boardManifestPath(boardID), bm)
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
		if err := writeJSON(s.boardDependenciesPath(boardID), depSlice); err != nil {
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
		return writeJSON(s.boardTagsPath(boardID), []model.Tag{})
	}
	tags := make([]model.Tag, 0, len(boardTags))
	for _, t := range boardTags {
		tags = append(tags, *t)
	}
	sort.Slice(tags, func(i, j int) bool { return tags[i].Name < tags[j].Name })
	return writeJSON(s.boardTagsPath(boardID), tags)
}

func (s *FileStore) persistDependenciesForBoard(boardID uint) error {
	boardDeps, ok := s.depsByBoard[boardID]
	if !ok {
		return writeJSON(s.boardDependenciesPath(boardID), []model.Dependency{})
	}
	deps := make([]model.Dependency, 0, len(boardDeps))
	for _, d := range boardDeps {
		deps = append(deps, *d)
	}
	return writeJSON(s.boardDependenciesPath(boardID), deps)
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
	_ = writeJSON(s.boardManifestPath(boardID), bm)
	return id
}

// ============================================================
// Internal: persistence
// ============================================================

func (s *FileStore) saveManifest() error {
	return writeJSON(filepath.Join(s.basePath, "manifest.json"), &s.manifest)
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
	return writeJSON(filepath.Join(s.boardDir(boardID), "columns.json"), cols)
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
	return writeJSON(filepath.Join(s.basePath, "settings.json"), s.settings)
}

// persistTags is kept for backward compat but is a no-op (use persistTagsForBoard).
func (s *FileStore) persistTags() error {
	return nil
}

// ============================================================
// Internal: index management
// ============================================================

func (s *FileStore) buildChecklistIndex(card *CardFile) {
	for _, cl := range card.Checklists {
		s.checklistToCard[cl.ID] = card.ID
		for _, item := range cl.Items {
			s.itemToChecklist[item.ID] = cl.ID
		}
	}
	for _, c := range card.Comments {
		s.commentToCard[c.ID] = card.ID
	}
}

func (s *FileStore) clearChecklistIndex(card *CardFile) {
	for _, cl := range card.Checklists {
		delete(s.checklistToCard, cl.ID)
		for _, item := range cl.Items {
			delete(s.itemToChecklist, item.ID)
		}
	}
	for _, c := range card.Comments {
		delete(s.commentToCard, c.ID)
	}
}

// ============================================================
// Utility functions
// ============================================================

func removeFromSlice(slice []uint, val uint) []uint {
	for i, v := range slice {
		if v == val {
			return append(slice[:i], slice[i+1:]...)
		}
	}
	return slice
}

func removeFromSliceWithFlag(slice []uint, val uint) ([]uint, bool) {
	for i, v := range slice {
		if v == val {
			return append(slice[:i], slice[i+1:]...), true
		}
	}
	return slice, false
}

func initCardSlices(c *CardFile) {
	if c.TagIDs == nil {
		c.TagIDs = []uint{}
	}
	if c.Checklists == nil {
		c.Checklists = []model.Checklist{}
	}
	for i := range c.Checklists {
		if c.Checklists[i].Items == nil {
			c.Checklists[i].Items = []model.ChecklistItem{}
		}
	}
	if c.Comments == nil {
		c.Comments = []model.Comment{}
	}
}

func copyCard(c *CardFile) *CardFile {
	cp := *c
	if c.ArchivedAt != nil {
		t := *c.ArchivedAt
		cp.ArchivedAt = &t
	}
	cp.TagIDs = make([]uint, len(c.TagIDs))
	copy(cp.TagIDs, c.TagIDs)
	cp.Checklists = make([]model.Checklist, len(c.Checklists))
	for i, cl := range c.Checklists {
		cp.Checklists[i] = cl
		cp.Checklists[i].Items = make([]model.ChecklistItem, len(cl.Items))
		copy(cp.Checklists[i].Items, cl.Items)
	}
	cp.Comments = make([]model.Comment, len(c.Comments))
	copy(cp.Comments, c.Comments)
	return &cp
}
