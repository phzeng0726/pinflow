package store_test

import (
	"sort"
	"testing"

	"pinflow/model"
	"pinflow/tests/testutil"
)

func TestWriteNotificationUsesWorkspaceRelativePath(t *testing.T) {
	fs := testutil.NewStore(t)
	notifications := make(chan string, 16)
	fs.SetWriteNotifier(notifications)

	if err := fs.CreateBoard(&model.Board{ID: 1, Name: "Board"}); err != nil {
		t.Fatalf("create board: %v", err)
	}

	got := drainNotifications(notifications)
	if !contains(got, "boards/board-1/board.json") {
		t.Fatalf("expected board write notification, got %v", got)
	}
}

func TestWriteWithoutNotifierCompletes(t *testing.T) {
	fs := testutil.NewStore(t)
	if err := fs.CreateBoard(&model.Board{ID: 1, Name: "Board"}); err != nil {
		t.Fatalf("create board without notifier: %v", err)
	}
}

func TestFullNotificationChannelDoesNotBlockWrite(t *testing.T) {
	fs := testutil.NewStore(t)
	notifications := make(chan string, 1)
	notifications <- "occupied"
	fs.SetWriteNotifier(notifications)

	if err := fs.CreateBoard(&model.Board{ID: 1, Name: "Board"}); err != nil {
		t.Fatalf("create board with full notifier: %v", err)
	}
	if _, err := fs.GetBoard(1); err != nil {
		t.Fatalf("expected board write to complete: %v", err)
	}
}

func TestNotifierIsIsolatedPerStore(t *testing.T) {
	first := testutil.NewStore(t)
	second := testutil.NewStore(t)
	firstNotifications := make(chan string, 16)
	secondNotifications := make(chan string, 16)
	first.SetWriteNotifier(firstNotifications)
	second.SetWriteNotifier(secondNotifications)

	if err := first.CreateBoard(&model.Board{ID: 1, Name: "First"}); err != nil {
		t.Fatalf("create first board: %v", err)
	}
	if len(secondNotifications) != 0 {
		t.Fatalf("second store received first store notifications: %v", drainNotifications(secondNotifications))
	}

	if err := second.CreateBoard(&model.Board{ID: 2, Name: "Second"}); err != nil {
		t.Fatalf("create second board: %v", err)
	}
	if len(firstNotifications) == 0 || len(secondNotifications) == 0 {
		t.Fatal("expected each store to receive its own notifications")
	}
}

func TestDeleteBoardNotifiesEveryManagedJSONFile(t *testing.T) {
	fs := testutil.NewStore(t)
	notifications := make(chan string, 32)
	fs.SetWriteNotifier(notifications)

	if err := fs.CreateBoard(&model.Board{ID: 1, Name: "Board"}); err != nil {
		t.Fatalf("create board: %v", err)
	}
	drainNotifications(notifications)

	if err := fs.DeleteBoard(1); err != nil {
		t.Fatalf("delete board: %v", err)
	}
	got := drainNotifications(notifications)
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

func drainNotifications(ch chan string) []string {
	result := make([]string, 0, len(ch))
	for len(ch) > 0 {
		result = append(result, <-ch)
	}
	return result
}

func contains(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}
