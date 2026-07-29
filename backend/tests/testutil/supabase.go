package testutil

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
)

// RecordedRequest is a stable copy of a request received by SupabaseMock.
type RecordedRequest struct {
	Method string
	Path   string
	Query  string
	Header http.Header
	Body   []byte
}

// SupabaseMock records requests before delegating to its responder.
type SupabaseMock struct {
	Server *httptest.Server

	mu       sync.Mutex
	requests []RecordedRequest
}

// NewSupabaseMock creates an isolated Supabase endpoint and configures the test
// process to use it. The responder may emulate auth and PostgREST responses.
func NewSupabaseMock(t *testing.T, responder http.HandlerFunc) *SupabaseMock {
	t.Helper()
	mock := &SupabaseMock{}
	mock.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("read Supabase mock request: %v", err)
		}
		r.Body = io.NopCloser(bytes.NewReader(body))

		mock.mu.Lock()
		mock.requests = append(mock.requests, RecordedRequest{
			Method: r.Method,
			Path:   r.URL.Path,
			Query:  r.URL.RawQuery,
			Header: r.Header.Clone(),
			Body:   append([]byte(nil), body...),
		})
		mock.mu.Unlock()

		if responder == nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		responder(w, r)
	}))
	t.Cleanup(mock.Server.Close)
	t.Setenv("PINFLOW_SUPABASE_URL", mock.Server.URL)
	t.Setenv("PINFLOW_SUPABASE_ANON_KEY", "publishable-test-key")
	return mock
}

// Requests returns copies of all requests received by the mock.
func (m *SupabaseMock) Requests() []RecordedRequest {
	m.mu.Lock()
	defer m.mu.Unlock()
	result := make([]RecordedRequest, len(m.requests))
	copy(result, m.requests)
	return result
}
