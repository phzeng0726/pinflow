package sync

import (
	"os"
	"path/filepath"
	"strings"
)

const snapshotsDirectory = ".snapshots"

func isSnapshotPath(path string) bool {
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(path)))
	for _, segment := range strings.Split(clean, "/") {
		if segment == snapshotsDirectory {
			return true
		}
	}
	return false
}

func syncableWorkspaceFiles(files []WorkspaceFile) []WorkspaceFile {
	filtered := make([]WorkspaceFile, 0, len(files))
	for _, file := range files {
		if !isSnapshotPath(file.Path) {
			filtered = append(filtered, file)
		}
	}
	return filtered
}

func removeSnapshotDirs(basePath string) error {
	return filepath.Walk(basePath, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if !info.IsDir() || info.Name() != snapshotsDirectory {
			return nil
		}
		if err := os.RemoveAll(path); err != nil {
			return err
		}
		return filepath.SkipDir
	})
}
