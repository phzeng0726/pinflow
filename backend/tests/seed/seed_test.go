package seed_test

import (
	"os"
	"path/filepath"
	"testing"

	"pinflow/seed"
)

func TestSeedIfEmptyAlwaysProvidesExampleBoardForLocalUse(t *testing.T) {
	workspace := t.TempDir()

	if err := seed.SeedIfEmpty(workspace); err != nil {
		t.Fatalf("seed workspace: %v", err)
	}

	boards, err := os.ReadDir(filepath.Join(workspace, "boards"))
	if err != nil {
		t.Fatalf("read seeded boards: %v", err)
	}
	foundBoard := false
	for _, entry := range boards {
		if entry.IsDir() {
			foundBoard = true
			break
		}
	}
	if !foundBoard {
		t.Fatal("expected an example board without requiring authentication")
	}
}
