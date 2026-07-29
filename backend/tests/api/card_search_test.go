package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCardSearch_Handler(t *testing.T) {
	r := setupRouter(t)

	createBoardAndColumn(t, r)
	createCardInColumn(t, r, 1)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/cards/search?q=Card&limit=10", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var results []interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &results)
	if len(results) == 0 {
		t.Error("expected at least 1 search result")
	}
}
