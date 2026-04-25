package service

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sort"
	"time"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/store"
)

const debounceWindow = 10 * time.Minute
const autoRetentionDays = 7

type SnapshotService interface {
	// force=true bypasses the debounce check (use for pre-delete safety-net snapshots).
	CreateSnapshot(boardID uint, name string, isManual bool, trigger string, force bool) (*dto.SnapshotResponse, error)
	ListSnapshots(boardID uint) ([]dto.SnapshotResponse, error)
	RestoreSnapshot(boardID, snapshotID uint) error
	DeleteSnapshot(boardID, snapshotID uint) error
}

type snapshotService struct {
	repo repository.SnapshotRepository
	fs   *store.FileStore
}

func newSnapshotService(repo repository.SnapshotRepository, fs *store.FileStore) SnapshotService {
	return &snapshotService{repo: repo, fs: fs}
}

// CreateSnapshot creates a new snapshot for the board.
// If isManual and force are both false and a recent auto-snapshot exists within debounceWindow, it is skipped (returns nil, nil).
func (s *snapshotService) CreateSnapshot(boardID uint, name string, isManual bool, trigger string, force bool) (*dto.SnapshotResponse, error) {
	if !isManual && !force {
		if skip, err := s.shouldDebounce(boardID); err != nil {
			log.Printf("snapshot: debounce check error for board %d: %v", boardID, err)
		} else if skip {
			return nil, nil
		}
	}

	now := time.Now()

	if name == "" {
		name = "snapshot-" + now.Format("20060102-150405")
	}

	snap := &model.Snapshot{
		ID:        s.fs.NextID("snapshot"),
		BoardID:   boardID,
		Name:      name,
		IsManual:  isManual,
		Trigger:   trigger,
		CreatedAt: now,
	}

	boardDir := s.fs.BoardDir(boardID)
	snapDir := s.repo.SnapshotDir(boardID, snap.ID)

	if err := copyBoardToSnapshot(boardDir, snapDir, boardID, s.fs); err != nil {
		return nil, fmt.Errorf("copy board data: %w", err)
	}

	if err := s.repo.Save(snap); err != nil {
		return nil, fmt.Errorf("save snapshot metadata: %w", err)
	}

	if !isManual {
		if err := s.cleanupOldAutoSnapshots(boardID); err != nil {
			log.Printf("snapshot: cleanup error for board %d: %v", boardID, err)
		}
	}

	return snapshotToResponse(snap), nil
}

// shouldDebounce returns true if a recent auto-snapshot exists within debounceWindow.
func (s *snapshotService) shouldDebounce(boardID uint) (bool, error) {
	snaps, err := s.repo.List(boardID)
	if err != nil {
		return false, err
	}
	for _, snap := range snaps {
		if !snap.IsManual && time.Since(snap.CreatedAt) < debounceWindow {
			return true, nil
		}
	}
	return false, nil
}

// ListSnapshots returns all snapshots for a board, sorted by createdAt descending.
func (s *snapshotService) ListSnapshots(boardID uint) ([]dto.SnapshotResponse, error) {
	snaps, err := s.repo.List(boardID)
	if err != nil {
		return nil, err
	}
	sort.Slice(snaps, func(i, j int) bool {
		return snaps[i].CreatedAt.After(snaps[j].CreatedAt)
	})
	result := make([]dto.SnapshotResponse, len(snaps))
	for i, sn := range snaps {
		result[i] = *snapshotToResponse(&sn)
	}
	return result, nil
}

// RestoreSnapshot restores a board to the given snapshot state.
func (s *snapshotService) RestoreSnapshot(boardID, snapshotID uint) error {
	now := time.Now()

	// Create a pre-restore safety-net snapshot
	preRestoreName := "restore-before-" + now.Format("20060102-150405")
	if _, err := s.CreateSnapshot(boardID, preRestoreName, false, "restore", true); err != nil {
		log.Printf("snapshot: pre-restore snapshot failed for board %d: %v", boardID, err)
	}

	snapDir := s.repo.SnapshotDir(boardID, snapshotID)
	if _, err := os.Stat(snapDir); os.IsNotExist(err) {
		return store.ErrNotFound
	}

	boardDir := s.fs.BoardDir(boardID)

	// Overwrite board files from snapshot
	if err := restoreBoardFromSnapshot(snapDir, boardDir); err != nil {
		return fmt.Errorf("restore board files: %w", err)
	}

	// Merge tags
	if err := s.mergeTags(snapDir); err != nil {
		log.Printf("snapshot: tag merge error: %v", err)
	}

	// Replace board dependencies
	if err := s.restoreDependencies(boardID, snapDir); err != nil {
		log.Printf("snapshot: dependency restore error: %v", err)
	}

	// Bump manifest NextIDs
	if err := s.bumpNextIDs(snapDir); err != nil {
		log.Printf("snapshot: manifest update error: %v", err)
	}

	return s.fs.ReloadBoard(boardID)
}

// DeleteSnapshot deletes a single snapshot.
func (s *snapshotService) DeleteSnapshot(boardID, snapshotID uint) error {
	return s.repo.Delete(boardID, snapshotID)
}

// cleanupOldAutoSnapshots deletes auto-snapshots older than autoRetentionDays.
func (s *snapshotService) cleanupOldAutoSnapshots(boardID uint) error {
	snaps, err := s.repo.List(boardID)
	if err != nil {
		return err
	}
	cutoff := time.Now().AddDate(0, 0, -autoRetentionDays)
	for _, sn := range snaps {
		if !sn.IsManual && sn.CreatedAt.Before(cutoff) {
			if err := s.repo.Delete(boardID, sn.ID); err != nil {
				log.Printf("snapshot: failed to delete old snapshot %d: %v", sn.ID, err)
			}
		}
	}
	return nil
}

// mergeTags merges snapshot tags into the global tags store (by ID; creates missing ones).
func (s *snapshotService) mergeTags(snapDir string) error {
	tagsPath := filepath.Join(snapDir, "tags.json")
	data, err := os.ReadFile(tagsPath)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	var tags []model.Tag
	if err := json.Unmarshal(data, &tags); err != nil {
		return err
	}
	for _, t := range tags {
		if _, err := s.fs.GetTag(t.ID); err != nil {
			tc := t
			if err := s.fs.CreateTag(&tc); err != nil {
				log.Printf("snapshot: failed to restore tag %d: %v", t.ID, err)
			}
		}
	}
	return nil
}

// restoreDependencies replaces the global dependencies for this board with snapshot's version.
func (s *snapshotService) restoreDependencies(boardID uint, snapDir string) error {
	depsPath := filepath.Join(snapDir, "dependencies.json")
	data, err := os.ReadFile(depsPath)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	var snapDeps []model.Dependency
	if err := json.Unmarshal(data, &snapDeps); err != nil {
		return err
	}

	// Keep global dependencies that don't belong to this board
	allDeps := s.fs.GetAllDependencies()
	boardCardSet := s.boardCardSet(boardID)
	kept := make([]model.Dependency, 0, len(allDeps))
	for _, d := range allDeps {
		_, fromOk := boardCardSet[d.FromCardID]
		_, toOk := boardCardSet[d.ToCardID]
		if !fromOk && !toOk {
			kept = append(kept, d)
		}
	}
	merged := append(kept, snapDeps...)
	return s.fs.ReplaceAllDependencies(merged)
}

// bumpNextIDs updates the manifest NextIDs based on snapshot content.
func (s *snapshotService) bumpNextIDs(snapDir string) error {
	// Read snapshot cards to find max IDs
	cardsDir := filepath.Join(snapDir, "cards")
	entries, err := os.ReadDir(cardsDir)
	if err != nil {
		return nil
	}
	var maxCardID, maxChecklistID, maxItemID, maxCommentID uint
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".json" {
			continue
		}
		var cf store.CardFile
		data, err := os.ReadFile(filepath.Join(cardsDir, e.Name()))
		if err != nil {
			continue
		}
		if err := json.Unmarshal(data, &cf); err != nil {
			continue
		}
		if cf.ID > maxCardID {
			maxCardID = cf.ID
		}
		for _, cl := range cf.Checklists {
			if cl.ID > maxChecklistID {
				maxChecklistID = cl.ID
			}
			for _, item := range cl.Items {
				if item.ID > maxItemID {
					maxItemID = item.ID
				}
			}
		}
		for _, c := range cf.Comments {
			if c.ID > maxCommentID {
				maxCommentID = c.ID
			}
		}
	}

	// Read snapshot columns
	var maxColumnID uint
	colsPath := filepath.Join(snapDir, "columns.json")
	if data, err := os.ReadFile(colsPath); err == nil {
		var cols []model.Column
		if json.Unmarshal(data, &cols) == nil {
			for _, col := range cols {
				if col.ID > maxColumnID {
					maxColumnID = col.ID
				}
			}
		}
	}

	// Read snapshot tags for max tag ID
	var maxTagID uint
	if data, err := os.ReadFile(filepath.Join(snapDir, "tags.json")); err == nil {
		var tags []model.Tag
		if json.Unmarshal(data, &tags) == nil {
			for _, t := range tags {
				if t.ID > maxTagID {
					maxTagID = t.ID
				}
			}
		}
	}

	// Read snapshot dependencies for max dependency ID
	var maxDepID uint
	if data, err := os.ReadFile(filepath.Join(snapDir, "dependencies.json")); err == nil {
		var deps []model.Dependency
		if json.Unmarshal(data, &deps) == nil {
			for _, d := range deps {
				if d.ID > maxDepID {
					maxDepID = d.ID
				}
			}
		}
	}

	bumps := map[string]uint{
		"card":           maxCardID + 1,
		"column":         maxColumnID + 1,
		"checklist":      maxChecklistID + 1,
		"checklist_item": maxItemID + 1,
		"comment":        maxCommentID + 1,
		"tag":            maxTagID + 1,
		"dependency":     maxDepID + 1,
	}
	return s.fs.BumpManifestNextIDs(bumps)
}

// boardCardSet returns a set of all card IDs belonging to the given board.
func (s *snapshotService) boardCardSet(boardID uint) map[uint]struct{} {
	cols := s.fs.GetColumnsByBoard(boardID)
	cardSet := make(map[uint]struct{})
	for _, col := range cols {
		for _, card := range s.fs.GetCardsByColumn(col.ID) {
			cardSet[card.ID] = struct{}{}
		}
	}
	return cardSet
}

// ============================================================
// File copy helpers
// ============================================================

// copyBoardToSnapshot copies board files into the snapshot directory.
func copyBoardToSnapshot(boardDir, snapDir string, boardID uint, fs *store.FileStore) error {
	if err := os.MkdirAll(snapDir, 0755); err != nil {
		return err
	}

	// board.json
	if err := copyFile(filepath.Join(boardDir, "board.json"), filepath.Join(snapDir, "board.json")); err != nil {
		return err
	}
	// columns.json
	if err := copyFile(filepath.Join(boardDir, "columns.json"), filepath.Join(snapDir, "columns.json")); err != nil {
		return err
	}
	// cards/
	if err := copyDir(filepath.Join(boardDir, "cards"), filepath.Join(snapDir, "cards")); err != nil {
		return err
	}
	// images/
	_ = copyDir(filepath.Join(boardDir, "images"), filepath.Join(snapDir, "images"))

	// tags subset
	cols := fs.GetColumnsByBoard(boardID)
	tagIDSet := make(map[uint]struct{})
	for _, col := range cols {
		for _, card := range fs.GetCardsByColumn(col.ID) {
			for _, tagID := range fs.GetTagIDsByCard(card.ID) {
				tagIDSet[tagID] = struct{}{}
			}
		}
	}
	tags := make([]model.Tag, 0)
	for _, t := range fs.GetAllTags() {
		if _, ok := tagIDSet[t.ID]; ok {
			tags = append(tags, t)
		}
	}
	if err := writeSnapshotJSON(filepath.Join(snapDir, "tags.json"), tags); err != nil {
		return err
	}

	// dependencies subset
	deps := fs.ListDependenciesByBoard(boardID)
	if deps == nil {
		deps = []model.Dependency{}
	}
	return writeSnapshotJSON(filepath.Join(snapDir, "dependencies.json"), deps)
}

// restoreBoardFromSnapshot overwrites board-N/ content with snapshot files.
func restoreBoardFromSnapshot(snapDir, boardDir string) error {
	for _, name := range []string{"board.json", "columns.json"} {
		src := filepath.Join(snapDir, name)
		dst := filepath.Join(boardDir, name)
		if err := copyFile(src, dst); err != nil {
			return err
		}
	}
	// Replace cards/
	cardsDir := filepath.Join(boardDir, "cards")
	if err := os.RemoveAll(cardsDir); err != nil {
		return err
	}
	if err := copyDir(filepath.Join(snapDir, "cards"), cardsDir); err != nil {
		return err
	}
	// Replace images/
	imagesDir := filepath.Join(boardDir, "images")
	if err := os.RemoveAll(imagesDir); err != nil {
		return err
	}
	_ = copyDir(filepath.Join(snapDir, "images"), imagesDir)
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func copyDir(src, dst string) error {
	entries, err := os.ReadDir(src)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}
	for _, e := range entries {
		srcPath := filepath.Join(src, e.Name())
		dstPath := filepath.Join(dst, e.Name())
		if e.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

func writeSnapshotJSON(path string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0644)
}

func snapshotToResponse(s *model.Snapshot) *dto.SnapshotResponse {
	return &dto.SnapshotResponse{
		ID:        s.ID,
		BoardID:   s.BoardID,
		Name:      s.Name,
		IsManual:  s.IsManual,
		Trigger:   s.Trigger,
		CreatedAt: s.CreatedAt,
	}
}
