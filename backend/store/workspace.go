package store

import (
	"fmt"
	"github.com/google/uuid"
	"os"
	"path/filepath"
	"pinflow/model"
	"strings"
	"sync"
	"time"
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
	basePath   string
	mu         sync.RWMutex
	idMu       sync.Mutex // dedicated mutex for NextID — separate from mu to avoid deadlock
	notifierMu sync.RWMutex
	notifier   chan<- string

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

func (s *FileStore) SetWriteNotifier(ch chan<- string) {
	s.notifierMu.Lock()
	defer s.notifierMu.Unlock()
	s.notifier = ch
}

func (s *FileStore) SetSyncEnabled(enabled bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings.SyncEnabled = enabled
	_ = s.persistSettings()
}

func (s *FileStore) ReloadAll() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.resetLocked()
	return s.load()
}

func (s *FileStore) resetLocked() {
	s.boards = make(map[uint]*model.Board)
	s.columns = make(map[uint]*model.Column)
	s.cards = make(map[uint]*CardFile)
	s.tags = make(map[uint]*model.Tag)
	s.dependencies = make(map[uint]*model.Dependency)
	s.boardManifests = make(map[uint]*BoardManifest)
	s.tagsByBoard = make(map[uint]map[uint]*model.Tag)
	s.depsByBoard = make(map[uint]map[uint]*model.Dependency)
	s.columnsByBoard = make(map[uint][]uint)
	s.cardsByColumn = make(map[uint][]uint)
	s.checklistToCard = make(map[uint]uint)
	s.itemToChecklist = make(map[uint]uint)
	s.commentToCard = make(map[uint]uint)
}

// ReplaceJSONFiles replaces all JSON files managed by the workspace and reloads
// the in-memory store. Paths must be relative to the workspace root.
func (s *FileStore) ReplaceJSONFiles(files map[string][]byte) error {
	normalized, err := normalizeWorkspaceJSONFiles(files)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	backup, err := readWorkspaceJSONFiles(s.basePath)
	if err != nil {
		return fmt.Errorf("backup workspace JSON: %w", err)
	}
	if err := replaceWorkspaceJSONFiles(s.basePath, normalized); err != nil {
		restoreErr := replaceWorkspaceJSONFiles(s.basePath, backup)
		s.resetLocked()
		reloadErr := s.load()
		if restoreErr != nil {
			return fmt.Errorf("replace workspace JSON: %w; restore failed: %v", err, restoreErr)
		}
		if reloadErr != nil {
			return fmt.Errorf("replace workspace JSON: %w; reload restored workspace: %v", err, reloadErr)
		}
		return fmt.Errorf("replace workspace JSON: %w", err)
	}

	s.resetLocked()
	if err := s.load(); err != nil {
		restoreErr := replaceWorkspaceJSONFiles(s.basePath, backup)
		s.resetLocked()
		reloadErr := s.load()
		if restoreErr != nil {
			return fmt.Errorf("reload replacement workspace: %w; restore failed: %v", err, restoreErr)
		}
		if reloadErr != nil {
			return fmt.Errorf("reload replacement workspace: %w; reload restored workspace: %v", err, reloadErr)
		}
		return fmt.Errorf("reload replacement workspace: %w", err)
	}
	return nil
}

func (s *FileStore) ReadJSONFiles() (map[string][]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return readWorkspaceJSONFiles(s.basePath)
}

func normalizeWorkspaceJSONFiles(files map[string][]byte) (map[string][]byte, error) {
	normalized := make(map[string][]byte, len(files))
	for path, data := range files {
		clean := filepath.Clean(filepath.FromSlash(path))
		if clean == "." || filepath.IsAbs(clean) || clean == ".." ||
			strings.HasPrefix(clean, ".."+string(filepath.Separator)) ||
			filepath.Ext(clean) != ".json" {
			return nil, fmt.Errorf("invalid workspace JSON path %q", path)
		}
		if _, exists := normalized[clean]; exists {
			return nil, fmt.Errorf("duplicate workspace JSON path %q", path)
		}
		normalized[clean] = data
	}
	return normalized, nil
}

func readWorkspaceJSONFiles(basePath string) (map[string][]byte, error) {
	files := make(map[string][]byte)
	err := filepath.Walk(basePath, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.IsDir() || filepath.Ext(path) != ".json" {
			return nil
		}
		rel, err := filepath.Rel(basePath, path)
		if err != nil {
			return err
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		files[rel] = data
		return nil
	})
	return files, err
}

func replaceWorkspaceJSONFiles(basePath string, files map[string][]byte) error {
	existing, err := readWorkspaceJSONFiles(basePath)
	if err != nil {
		return err
	}
	for rel := range existing {
		if err := os.Remove(filepath.Join(basePath, rel)); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	for rel, data := range files {
		target := filepath.Join(basePath, rel)
		if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}
		if err := os.WriteFile(target, data, 0644); err != nil {
			return err
		}
	}
	return nil
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
		s.settings = &model.Settings{Theme: "dark", Locale: "en-US", SyncEnabled: false}
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
