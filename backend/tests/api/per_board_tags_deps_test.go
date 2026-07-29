package api_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandler_CrossBoardDependency_Returns422(t *testing.T) {
	r := setupRouter(t)

	_, _ = createBoardAndColumn(t, r)
	cardAID := createCardInColumn(t, r, 1)

	_, colBID := createBoardAndColumn(t, r)
	cardBID := createCardInColumn(t, r, colBID)

	body := fmt.Sprintf(`{"toCardId":%d,"type":"blocks"}`, cardBID)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/dependencies", cardAID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422 for cross-board dependency, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_CrossBoardTagAttach_Returns422(t *testing.T) {
	r := setupRouter(t)

	_, _ = createBoardAndColumn(t, r)
	cardAID := createCardInColumn(t, r, 1)

	boardBID, _ := createBoardAndColumn(t, r)
	tagID := createTagForBoard(t, r, boardBID)

	body := fmt.Sprintf(`{"tag_id":%d}`, tagID)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/tags", cardAID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422 for cross-board tag attach, got %d: %s", w.Code, w.Body.String())
	}
}

func createTagForBoard(t *testing.T, r interface {
	ServeHTTP(http.ResponseWriter, *http.Request)
}, boardID int) int {
	t.Helper()
	w := httptest.NewRecorder()
	r.ServeHTTP(w, mustRequest(http.MethodPost, fmt.Sprintf("/api/v1/boards/%d/tags", boardID), `{"name":"cross-tag","color":"red"}`))
	var tag map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &tag); err != nil || tag["id"] == nil {
		t.Fatalf("failed to create tag for board %d: status=%d body=%s", boardID, w.Code, w.Body.String())
	}
	return int(tag["id"].(float64))
}
