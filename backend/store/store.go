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

// Manifest tracks the workspace version and auto-increment ID counters.
type Manifest struct {
	Version     string          `json:"version"`
	WorkspaceID string          `json:"workspaceId,omitempty"`
	NextIDs     map[string]uint `json:"next_ids"`
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
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// FileStore is an in-memory data store backed by a workspace directory of JSON files.
// All reads are served from memory; writes are persisted to disk synchronously.
type FileStore struct {
	basePath string
	mu       sync.RWMutex

	manifest Manifest

	boards       map[uint]*model.Board
	columns      map[uint]*model.Column
	cards        map[uint]*CardFile
	tags         map[uint]*model.Tag
	dependencies map[uint]*model.Dependency

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
		columnsByBoard:  make(map[uint][]uint),
		cardsByColumn:   make(map[uint][]uint),
		checklistToCard: make(map[uint]uint),
		itemToChecklist: make(map[uint]uint),
		commentToCard:   make(map[uint]uint),
		manifest: Manifest{
			Version: "1.0",
			NextIDs: map[string]uint{
				"board": 1, "column": 1, "card": 1,
				"tag": 1, "checklist": 1, "checklist_item": 1,
				"dependency": 1, "comment": 1,
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

	// Tags
	tp := filepath.Join(s.basePath, "tags.json")
	if fileExists(tp) {
		var tags []model.Tag
		if err := readJSON(tp, &tags); err != nil {
			return fmt.Errorf("tags: %w", err)
		}
		for i := range tags {
			s.tags[tags[i].ID] = &tags[i]
		}
	}

	// Dependencies
	if err := s.loadDependencies(); err != nil {
		return err
	}

	// Boards
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
// and persists the updated counter.
func (s *FileStore) NextID(entity string) uint {
	id := s.manifest.NextIDs[entity]
	s.manifest.NextIDs[entity] = id + 1
	_ = s.saveManifest()
	return id
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
	return writeJSON(filepath.Join(dir, "columns.json"), []model.Column{})
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
		if c.IsPinned {
			result = append(result, *copyCard(c))
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].UpdatedAt.After(result[j].UpdatedAt)
	})
	return result
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

	// Duplicate check
	for _, existing := range s.dependencies {
		if existing.Type == d.Type {
			if existing.FromCardID == d.FromCardID && existing.ToCardID == d.ToCardID {
				return ErrDependencyConflict
			}
			// related_to is symmetric: also check reverse direction
			if d.Type == model.DependencyTypeRelatedTo &&
				existing.FromCardID == d.ToCardID && existing.ToCardID == d.FromCardID {
				return ErrDependencyConflict
			}
		}
	}

	d.ID = s.NextID("dependency")
	s.dependencies[d.ID] = d
	return s.persistDependencies()
}

func (s *FileStore) DeleteDependency(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.dependencies[id]; !ok {
		return ErrNotFound
	}
	delete(s.dependencies, id)
	return s.persistDependencies()
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

func (s *FileStore) cleanDependenciesByCard(cardID uint) {
	for id, d := range s.dependencies {
		if d.FromCardID == cardID || d.ToCardID == cardID {
			delete(s.dependencies, id)
		}
	}
	_ = s.persistDependencies()
}

// ============================================================
// Tag
// ============================================================

func (s *FileStore) CreateTag(t *model.Tag) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.tags[t.ID] = t
	return s.persistTags()
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

func (s *FileStore) GetTagByName(name string) (*model.Tag, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	lower := strings.ToLower(strings.TrimSpace(name))
	for _, t := range s.tags {
		if strings.ToLower(t.Name) == lower {
			cp := *t
			return &cp, nil
		}
	}
	return nil, ErrNotFound
}

func (s *FileStore) GetAllTags() []model.Tag {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]model.Tag, 0, len(s.tags))
	for _, t := range s.tags {
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

	if _, ok := s.tags[t.ID]; !ok {
		return ErrNotFound
	}
	s.tags[t.ID] = t
	return s.persistTags()
}

func (s *FileStore) DeleteTag(id uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.tags[id]; !ok {
		return ErrNotFound
	}
	delete(s.tags, id)

	// Remove tag reference from all cards
	for _, card := range s.cards {
		newIDs, found := removeFromSliceWithFlag(card.TagIDs, id)
		if found {
			card.TagIDs = newIDs
			if col := s.columns[card.ColumnID]; col != nil {
				_ = writeJSON(s.cardPath(col.BoardID, card.ID), card)
			}
		}
	}

	return s.persistTags()
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
	for _, id := range card.TagIDs {
		if id == tagID {
			return nil // already attached
		}
	}
	card.TagIDs = append(card.TagIDs, tagID)
	if col := s.columns[card.ColumnID]; col != nil {
		return writeJSON(s.cardPath(col.BoardID, card.ID), card)
	}
	return nil
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
// Internal: paths
// ============================================================

func (s *FileStore) boardDir(boardID uint) string {
	return filepath.Join(s.basePath, "boards", fmt.Sprintf("board-%d", boardID))
}

func (s *FileStore) cardPath(boardID, cardID uint) string {
	return filepath.Join(s.boardDir(boardID), "cards", fmt.Sprintf("card-%d.json", cardID))
}

func (s *FileStore) dependenciesPath() string {
	return filepath.Join(s.basePath, "dependencies.json")
}

func (s *FileStore) loadDependencies() error {
	dp := s.dependenciesPath()
	if !fileExists(dp) {
		return nil
	}
	var deps []model.Dependency
	if err := readJSON(dp, &deps); err != nil {
		return fmt.Errorf("dependencies: %w", err)
	}
	for i := range deps {
		s.dependencies[deps[i].ID] = &deps[i]
	}
	return nil
}

func (s *FileStore) persistDependencies() error {
	deps := make([]model.Dependency, 0, len(s.dependencies))
	for _, d := range s.dependencies {
		deps = append(deps, *d)
	}
	return writeJSON(s.dependenciesPath(), deps)
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

func (s *FileStore) persistTags() error {
	tags := make([]model.Tag, 0, len(s.tags))
	for _, t := range s.tags {
		tags = append(tags, *t)
	}
	sort.Slice(tags, func(i, j int) bool { return tags[i].Name < tags[j].Name })
	return writeJSON(filepath.Join(s.basePath, "tags.json"), tags)
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
