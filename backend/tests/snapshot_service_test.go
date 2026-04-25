package tests

import (
	"testing"
	"time"

	"pinflow/repository"
	"pinflow/service"
)

func setupSnapshotService(t *testing.T) (*service.Services, uint) {
	t.Helper()
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	board, err := services.Board.CreateBoard("SnapBoard")
	if err != nil {
		t.Fatalf("create board: %v", err)
	}
	col, err := services.Column.CreateColumn(board.ID, "Todo")
	if err != nil {
		t.Fatalf("create column: %v", err)
	}
	if _, err := services.Card.CreateCard(col.ID, "Card A", ""); err != nil {
		t.Fatalf("create card: %v", err)
	}
	return services, board.ID
}

func TestSnapshotService_CreateManual(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	snap, err := svcs.Snapshot.CreateSnapshot(boardID, "my-snap", true, "manual", false)
	if err != nil {
		t.Fatalf("CreateSnapshot: %v", err)
	}
	if snap == nil {
		t.Fatal("expected non-nil snapshot")
	}
	if snap.Name != "my-snap" {
		t.Errorf("expected name 'my-snap', got %q", snap.Name)
	}
	if !snap.IsManual {
		t.Error("expected isManual=true")
	}
	if snap.Trigger != "manual" {
		t.Errorf("expected trigger 'manual', got %q", snap.Trigger)
	}
}

func TestSnapshotService_CreateAuto_GeneratesName(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	snap, err := svcs.Snapshot.CreateSnapshot(boardID, "", false, "create_card", false)
	if err != nil {
		t.Fatalf("CreateSnapshot: %v", err)
	}
	if snap == nil {
		t.Fatal("expected non-nil snapshot")
	}
	if snap.Name == "" {
		t.Error("expected auto-generated name")
	}
	if snap.IsManual {
		t.Error("expected isManual=false")
	}
}

func TestSnapshotService_Debounce_SkipsWithinWindow(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	// First auto snapshot
	snap1, err := svcs.Snapshot.CreateSnapshot(boardID, "", false, "create_card", false)
	if err != nil {
		t.Fatalf("first CreateSnapshot: %v", err)
	}
	if snap1 == nil {
		t.Fatal("expected first snapshot to be created")
	}

	// Second auto snapshot within debounce window — should be skipped
	snap2, err := svcs.Snapshot.CreateSnapshot(boardID, "", false, "update_card", false)
	if err != nil {
		t.Fatalf("second CreateSnapshot: %v", err)
	}
	if snap2 != nil {
		t.Error("expected nil (debounced), got a snapshot")
	}
}

func TestSnapshotService_List_SortedDesc(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	// Create two manual snapshots
	if _, err := svcs.Snapshot.CreateSnapshot(boardID, "snap-1", true, "manual", false); err != nil {
		t.Fatalf("snap-1: %v", err)
	}
	time.Sleep(5 * time.Millisecond)
	if _, err := svcs.Snapshot.CreateSnapshot(boardID, "snap-2", true, "manual", false); err != nil {
		t.Fatalf("snap-2: %v", err)
	}

	list, err := svcs.Snapshot.ListSnapshots(boardID)
	if err != nil {
		t.Fatalf("ListSnapshots: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 snapshots, got %d", len(list))
	}
	if list[0].Name != "snap-2" {
		t.Errorf("expected newest first, got %q", list[0].Name)
	}
}

func TestSnapshotService_Delete(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	snap, err := svcs.Snapshot.CreateSnapshot(boardID, "to-delete", true, "manual", false)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := svcs.Snapshot.DeleteSnapshot(boardID, snap.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	list, _ := svcs.Snapshot.ListSnapshots(boardID)
	for _, s := range list {
		if s.ID == snap.ID {
			t.Error("deleted snapshot still in list")
		}
	}
}

func TestSnapshotService_Restore(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	// Snapshot current state (1 column, 1 card)
	snap, err := svcs.Snapshot.CreateSnapshot(boardID, "before-change", true, "manual", false)
	if err != nil {
		t.Fatalf("create snapshot: %v", err)
	}

	// Add another column after snapshot
	if _, err := svcs.Column.CreateColumn(boardID, "Done"); err != nil {
		t.Fatalf("create column: %v", err)
	}

	// Restore
	if err := svcs.Snapshot.RestoreSnapshot(boardID, snap.ID); err != nil {
		t.Fatalf("restore: %v", err)
	}

	// After restore, board should have original structure (1 column)
	board, err := svcs.Board.GetBoardByID(boardID)
	if err != nil {
		t.Fatalf("get board after restore: %v", err)
	}
	if len(board.Columns) != 1 {
		t.Errorf("expected 1 column after restore, got %d", len(board.Columns))
	}
}

func TestSnapshotService_AutoCleanup_OldSnapshots(t *testing.T) {
	svcs, boardID := setupSnapshotService(t)

	// Create a manual snapshot (should not be auto-deleted)
	manual, err := svcs.Snapshot.CreateSnapshot(boardID, "keep-me", true, "manual", false)
	if err != nil {
		t.Fatalf("manual snapshot: %v", err)
	}
	_ = manual

	// Trigger a new auto snapshot (will trigger cleanup, but nothing is old enough yet)
	if _, err := svcs.Snapshot.CreateSnapshot(boardID, "", false, "create_card", false); err != nil {
		t.Fatalf("auto snapshot: %v", err)
	}

	list, _ := svcs.Snapshot.ListSnapshots(boardID)
	// Manual + auto should both exist
	if len(list) < 2 {
		t.Errorf("expected at least 2 snapshots, got %d", len(list))
	}

	// Verify manual snapshot is still present
	found := false
	for _, s := range list {
		if s.ID == manual.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("manual snapshot was incorrectly deleted")
	}
}
