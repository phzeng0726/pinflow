package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandler_Dependency_CreateAndList(t *testing.T) {
	r := setupRouter(t)

	// Setup: board, column, two cards
	boardID, colID := createBoardAndColumn(t, r)
	_ = colID
	card1ID := createCardInColumn(t, r, 1)
	card2ID := createCardInColumn(t, r, 1)

	// Create dependency
	body := fmt.Sprintf(`{"toCardId":%d,"type":"blocks"}`, card2ID)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/dependencies", card1ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var dep map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &dep)
	depID := dep["id"].(float64)

	// List dependencies for card1
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/cards/%d/dependencies", card1ID), nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var list []interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &list)
	if len(list) != 1 {
		t.Errorf("expected 1 dependency, got %d", len(list))
	}

	// Delete dependency
	req = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/dependencies/%d", int(depID)), nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", w.Code)
	}

	_ = boardID
}

func TestHandler_Dependency_SelfReference(t *testing.T) {
	r := setupRouter(t)

	createBoardAndColumn(t, r)
	cardID := createCardInColumn(t, r, 1)

	body := fmt.Sprintf(`{"toCardId":%d,"type":"blocks"}`, cardID)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/dependencies", cardID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for self-reference, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_Dependency_Conflict(t *testing.T) {
	r := setupRouter(t)

	createBoardAndColumn(t, r)
	card1ID := createCardInColumn(t, r, 1)
	card2ID := createCardInColumn(t, r, 1)

	body := fmt.Sprintf(`{"toCardId":%d,"type":"blocks"}`, card2ID)

	// First creation should succeed
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/dependencies", card1ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("first create failed: %d %s", w.Code, w.Body.String())
	}

	// Second creation should conflict
	req = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/dependencies", card1ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d: %s", w.Code, w.Body.String())
	}
}

// Helper: create board and column, return IDs
func createBoardAndColumn(t *testing.T, r interface{ ServeHTTP(http.ResponseWriter, *http.Request) }) (int, int) {
	t.Helper()

	w := httptest.NewRecorder()
	r.ServeHTTP(w, mustRequest(http.MethodPost, "/api/v1/boards", `{"name":"Board"}`))
	var board map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &board)
	boardID := int(board["id"].(float64))

	w = httptest.NewRecorder()
	r.ServeHTTP(w, mustRequest(http.MethodPost, fmt.Sprintf("/api/v1/boards/%d/columns", boardID), `{"name":"Col"}`))
	var col map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &col)
	colID := int(col["id"].(float64))

	return boardID, colID
}

func createCardInColumn(t *testing.T, r interface{ ServeHTTP(http.ResponseWriter, *http.Request) }, colID int) int {
	t.Helper()
	w := httptest.NewRecorder()
	r.ServeHTTP(w, mustRequest(http.MethodPost, fmt.Sprintf("/api/v1/columns/%d/cards", colID), `{"title":"Card"}`))
	var card map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &card)
	return int(card["id"].(float64))
}

func mustRequest(method, path, body string) *http.Request {
	req := httptest.NewRequest(method, path, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	return req
}
