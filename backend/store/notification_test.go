package store

import (
	"path/filepath"
	"sort"
	"testing"
	"time"

	"pinflow/model"
)

func TestWriteJSONNotifiesWorkspaceRelativePath(t *testing.T) {
	fs, err := New(t.TempDir())
	if err != nil {
		t.Fatalf("create store: %v", err)
	}
	notifications := make(chan string, 1)
	fs.SetWriteNotifier(notifications)
	t.Cleanup(func() { SetWriteNotifier(nil) })

	if err := writeJSON(filepath.Join(fs.BasePath(), "boards", "board-1", "board.json"), map[string]any{"id": 1}); err != nil {
		t.Fatalf("write JSON: %v", err)
	}

	select {
	case got := <-notifications:
		if got != "boards/board-1/board.json" {
			t.Fatalf("expected relative notification path, got %q", got)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for write notification")
	}
}

func TestDeleteBoardNotifiesEveryManagedJSONFile(t *testing.T) {
	fs, err := New(t.TempDir())
	if err != nil {
		t.Fatalf("create store: %v", err)
	}
	notifications := make(chan string, 32)
	fs.SetWriteNotifier(notifications)
	t.Cleanup(func() { SetWriteNotifier(nil) })

	if err := fs.CreateBoard(&model.Board{ID: 1, Name: "Board"}); err != nil {
		t.Fatalf("create board: %v", err)
	}
	for len(notifications) > 0 {
		<-notifications
	}

	if err := fs.DeleteBoard(1); err != nil {
		t.Fatalf("delete board: %v", err)
	}

	var got []string
	for len(notifications) > 0 {
		got = append(got, <-notifications)
	}
	sort.Strings(got)
	want := []string{
		"delete:boards/board-1/board.json",
		"delete:boards/board-1/columns.json",
		"delete:boards/board-1/dependencies.json",
		"delete:boards/board-1/manifest.json",
		"delete:boards/board-1/tags.json",
	}
	sort.Strings(want)
	if len(got) != len(want) {
		t.Fatalf("expected %d delete notifications, got %d: %v", len(want), len(got), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("expected notifications %v, got %v", want, got)
		}
	}
}
