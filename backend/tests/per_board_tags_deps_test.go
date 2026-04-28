package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"
	"pinflow/store"
)

// --- Task 11.1: tag attach cross-board rejected (service level) ---

func TestTagService_AttachCrossBoard_Rejected(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	// Board A
	boardA, _ := services.Board.CreateBoard("Board A")
	colA, _ := services.Column.CreateColumn(boardA.ID, "ColA")
	cardA, _ := services.Card.CreateCard(colA.ID, "Card A", "")

	// Board B
	boardB, _ := services.Board.CreateBoard("Board B")
	tagB, _ := services.Tag.CreateOrGet(boardB.ID, "b-tag", "blue")

	// Attach tag from board B to card on board A — should fail
	err := services.Tag.AttachToCard(cardA.ID, tagB.ID)
	if err != store.ErrCrossBoardTag {
		t.Errorf("expected ErrCrossBoardTag, got: %v", err)
	}
}

// --- Task 11.2: dependency create cross-board rejected (store level) ---

func TestDepStore_CreateCrossBoard_Rejected(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	// Board A with card
	boardA, _ := services.Board.CreateBoard("Board A")
	colA, _ := services.Column.CreateColumn(boardA.ID, "ColA")
	cardA, _ := services.Card.CreateCard(colA.ID, "Card A", "")

	// Board B with card
	boardB, _ := services.Board.CreateBoard("Board B")
	colB, _ := services.Column.CreateColumn(boardB.ID, "ColB")
	cardB, _ := services.Card.CreateCard(colB.ID, "Card B", "")

	// Directly via store — cross-board should be rejected
	dep := &model.Dependency{
		FromCardID: cardA.ID,
		ToCardID:   cardB.ID,
		Type:       model.DependencyTypeBlocks,
	}
	err := fs.CreateDependency(dep)
	if err != store.ErrCrossBoardDependency {
		t.Errorf("expected ErrCrossBoardDependency from store, got: %v", err)
	}
}

// --- Task 11.3: per-board tag CRUD ---

func TestPerBoardTag_DifferentBoardsSameName(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	boardA, _ := services.Board.CreateBoard("Board A")
	boardB, _ := services.Board.CreateBoard("Board B")

	// Both boards can have tag named "urgent"
	tagA, err := services.Tag.CreateOrGet(boardA.ID, "urgent", "red")
	if err != nil {
		t.Fatalf("CreateOrGet board A: %v", err)
	}
	tagB, err := services.Tag.CreateOrGet(boardB.ID, "urgent", "blue")
	if err != nil {
		t.Fatalf("CreateOrGet board B: %v", err)
	}
	// Per-board IDs may repeat across boards (both start at 1) — that's correct behavior.
	// What matters is isolation: each board's tag list only shows its own tags.
	_ = tagA
	_ = tagB

	// Tags are isolated: list for board A should only show A's tags
	tagsA, _ := services.Tag.ListByBoard(boardA.ID)
	if len(tagsA) != 1 {
		t.Errorf("expected 1 tag for board A, got %d", len(tagsA))
	}
	tagsB, _ := services.Tag.ListByBoard(boardB.ID)
	if len(tagsB) != 1 {
		t.Errorf("expected 1 tag for board B, got %d", len(tagsB))
	}
}

func TestPerBoardTag_DeleteBoardRemovesTags(t *testing.T) {
	fs := setupTestStore(t)
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})

	boardA, _ := services.Board.CreateBoard("Board A")
	_, _ = services.Tag.CreateOrGet(boardA.ID, "urgent", "red")
	_, _ = services.Tag.CreateOrGet(boardA.ID, "feature", "blue")

	// Also create board B with a tag (should not be affected)
	boardB, _ := services.Board.CreateBoard("Board B")
	_, _ = services.Tag.CreateOrGet(boardB.ID, "keepme", "green")

	// Delete board A
	if err := services.Board.DeleteBoard(boardA.ID); err != nil {
		t.Fatalf("DeleteBoard error: %v", err)
	}

	// Tags for board A should be gone
	tagsA, _ := services.Tag.ListByBoard(boardA.ID)
	if len(tagsA) != 0 {
		t.Errorf("expected 0 tags for deleted board, got %d", len(tagsA))
	}

	// Board B tags should be unaffected
	tagsB, _ := services.Tag.ListByBoard(boardB.ID)
	if len(tagsB) != 1 {
		t.Errorf("expected 1 tag for board B, got %d", len(tagsB))
	}
}

// --- Task 11.4: handler cross-board POST /cards/:id/dependencies → 422 ---

func TestHandler_CrossBoardDependency_Returns422(t *testing.T) {
	r := setupRouter(t)

	// Board A: board, column, card
	_, _ = createBoardAndColumn(t, r)
	cardAID := createCardInColumn(t, r, 1)

	// Board B: board, column, card
	_, colBID := createBoardAndColumn(t, r)
	cardBID := createCardInColumn(t, r, colBID)

	// Attempt cross-board dependency
	body := fmt.Sprintf(`{"toCardId":%d,"type":"blocks"}`, cardBID)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/dependencies", cardAID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422 for cross-board dependency, got %d: %s", w.Code, w.Body.String())
	}
}

// --- Task 11.5: handler cross-board POST /cards/:id/tags → 422 ---

func TestHandler_CrossBoardTagAttach_Returns422(t *testing.T) {
	r := setupRouter(t)

	// Board A: board (id=1), column (id=1), card (id=1)
	boardAID, _ := createBoardAndColumn(t, r)
	cardAID := createCardInColumn(t, r, 1)

	// Board B: create it to get board id=2
	boardBID, _ := createBoardAndColumn(t, r)
	_ = boardBID

	// Create a tag for board B
	tagID := createTagForBoard(t, r, boardBID)

	// Attempt to attach board B's tag to board A's card
	_ = boardAID
	body := fmt.Sprintf(`{"tag_id":%d}`, tagID)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/tags", cardAID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422 for cross-board tag attach, got %d: %s", w.Code, w.Body.String())
	}
}

func createTagForBoard(t *testing.T, r interface{ ServeHTTP(http.ResponseWriter, *http.Request) }, boardID int) int {
	t.Helper()
	w := httptest.NewRecorder()
	r.ServeHTTP(w, mustRequest(http.MethodPost, fmt.Sprintf("/api/v1/boards/%d/tags", boardID), `{"name":"cross-tag","color":"red"}`))
	var tag map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &tag); err != nil || tag["id"] == nil {
		t.Fatalf("failed to create tag for board %d: status=%d body=%s", boardID, w.Code, w.Body.String())
	}
	return int(tag["id"].(float64))
}
