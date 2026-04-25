package repository

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"pinflow/model"
	"pinflow/store"
)

type SnapshotRepository interface {
	// List returns all snapshots for a board, read from .snapshots/index.json.
	List(boardID uint) ([]model.Snapshot, error)
	// Save writes meta.json into the snapshot directory and updates index.json.
	Save(snap *model.Snapshot) error
	// SnapshotDir returns the absolute path to snap-{id}/ for reading during restore.
	SnapshotDir(boardID, snapshotID uint) string
	// Delete removes snap-{id}/ directory and updates index.json.
	Delete(boardID, snapshotID uint) error
}

type snapshotRepository struct {
	fs *store.FileStore
}

func newSnapshotRepository(fs *store.FileStore) SnapshotRepository {
	return &snapshotRepository{fs: fs}
}

func (r *snapshotRepository) snapshotsDir(boardID uint) string {
	return filepath.Join(r.fs.BoardDir(boardID), ".snapshots")
}

func (r *snapshotRepository) indexPath(boardID uint) string {
	return filepath.Join(r.snapshotsDir(boardID), "index.json")
}

func (r *snapshotRepository) SnapshotDir(boardID, snapshotID uint) string {
	return filepath.Join(r.snapshotsDir(boardID), fmt.Sprintf("snap-%d", snapshotID))
}

func (r *snapshotRepository) List(boardID uint) ([]model.Snapshot, error) {
	idx, err := r.readIndex(boardID)
	if err != nil {
		return nil, err
	}
	return idx.Snapshots, nil
}

func (r *snapshotRepository) Save(snap *model.Snapshot) error {
	snapDir := r.SnapshotDir(snap.BoardID, snap.ID)
	if err := os.MkdirAll(snapDir, 0755); err != nil {
		return fmt.Errorf("create snapshot dir: %w", err)
	}

	metaPath := filepath.Join(snapDir, "meta.json")
	if err := writeJSONFile(metaPath, snap); err != nil {
		return fmt.Errorf("write meta.json: %w", err)
	}

	idx, err := r.readIndex(snap.BoardID)
	if err != nil {
		return err
	}
	idx.Snapshots = append(idx.Snapshots, *snap)
	return writeJSONFile(r.indexPath(snap.BoardID), idx)
}

func (r *snapshotRepository) Delete(boardID, snapshotID uint) error {
	idx, err := r.readIndex(boardID)
	if err != nil {
		return err
	}

	found := false
	filtered := idx.Snapshots[:0]
	for _, s := range idx.Snapshots {
		if s.ID == snapshotID {
			found = true
			continue
		}
		filtered = append(filtered, s)
	}
	if !found {
		return store.ErrNotFound
	}
	idx.Snapshots = filtered

	snapDir := r.SnapshotDir(boardID, snapshotID)
	if err := os.RemoveAll(snapDir); err != nil {
		return fmt.Errorf("remove snapshot dir: %w", err)
	}
	return writeJSONFile(r.indexPath(boardID), idx)
}

func (r *snapshotRepository) readIndex(boardID uint) (*model.SnapshotIndex, error) {
	idx := &model.SnapshotIndex{Snapshots: []model.Snapshot{}}
	path := r.indexPath(boardID)
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return idx, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read index.json: %w", err)
	}
	if err := json.Unmarshal(data, idx); err != nil {
		return nil, fmt.Errorf("parse index.json: %w", err)
	}
	if idx.Snapshots == nil {
		idx.Snapshots = []model.Snapshot{}
	}
	return idx, nil
}

func writeJSONFile(path string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0644)
}
