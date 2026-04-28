package seed

import (
	"embed"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

//go:embed workspace
var embedFS embed.FS

// SeedIfEmpty copies the example workspace into basePath when no boards exist yet.
func SeedIfEmpty(basePath string) error {
	boardsDir := filepath.Join(basePath, "boards")
	entries, err := os.ReadDir(boardsDir)
	if err == nil {
		for _, e := range entries {
			if e.IsDir() {
				return nil
			}
		}
	}

	return fs.WalkDir(embedFS, "workspace", func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if path == "workspace" {
			return nil
		}
		rel := filepath.FromSlash(strings.TrimPrefix(path, "workspace/"))
		target := filepath.Join(basePath, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		data, err := embedFS.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0644)
	})
}
