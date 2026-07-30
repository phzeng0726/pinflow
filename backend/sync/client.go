package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

type Client struct {
	http *http.Client
	auth *AuthManager
}

func NewClient(auth *AuthManager) *Client {
	return NewClientWithHTTPClient(auth, http.DefaultClient)
}

// NewClientWithHTTPClient creates a Supabase client with an explicit transport.
func NewClientWithHTTPClient(auth *AuthManager, client *http.Client) *Client {
	if client == nil {
		client = http.DefaultClient
	}
	return &Client{http: client, auth: auth}
}

func (c *Client) request(method, endpoint string, body any, headers map[string]string) (*http.Response, error) {
	state := c.auth.Get()
	if state.AccessToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	resp, err := c.requestOnce(state.AccessToken, method, endpoint, body, headers)
	if err != nil || resp.StatusCode != http.StatusUnauthorized {
		return resp, err
	}
	resp.Body.Close()

	refreshed, refreshErr := RefreshToken(c.http, state.RefreshToken)
	if refreshErr != nil {
		c.auth.Clear()
		return nil, refreshErr
	}
	c.auth.Set(refreshed)
	return c.requestOnce(refreshed.AccessToken, method, endpoint, body, headers)
}

func (c *Client) requestOnce(accessToken, method, endpoint string, body any, headers map[string]string) (*http.Response, error) {
	var reader *bytes.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(data)
	} else {
		reader = bytes.NewReader(nil)
	}
	req, err := http.NewRequest(method, strings.TrimRight(SupabaseURL(), "/")+endpoint, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", SupabaseAnonKey())
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	for name, value := range headers {
		req.Header.Set(name, value)
	}
	return c.http.Do(req)
}

func (c *Client) UpsertFile(path string, content []byte) error {
	return c.UpsertFiles(map[string][]byte{path: content})
}

func (c *Client) UpsertFiles(files map[string][]byte) error {
	state := c.auth.Get()
	if state.UserID == "" {
		return fmt.Errorf("authenticated user ID is missing")
	}
	paths := make([]string, 0, len(files))
	for path := range files {
		paths = append(paths, path)
	}
	sort.Strings(paths)
	rows := make([]map[string]any, 0, len(paths))
	for _, path := range paths {
		var value any
		if err := json.Unmarshal(files[path], &value); err != nil {
			return fmt.Errorf("decode %s: %w", path, err)
		}
		rows = append(rows, map[string]any{
			"user_id": state.UserID,
			"path":    path,
			"content": value,
		})
	}
	if len(rows) == 0 {
		return nil
	}
	resp, err := c.request(
		http.MethodPost,
		"/rest/v1/workspace_files",
		rows,
		map[string]string{"Prefer": "resolution=merge-duplicates"},
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("upsert failed: %s", resp.Status)
	}
	return nil
}
func (c *Client) ListFiles() ([]WorkspaceFile, error) {
	resp, err := c.request(http.MethodGet, "/rest/v1/workspace_files?select=path,content", nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("list failed: %s", resp.Status)
	}
	var files []WorkspaceFile
	return files, json.NewDecoder(resp.Body).Decode(&files)
}

func (c *Client) GetLatestUpdatedAt() (*time.Time, error) {
	resp, err := c.request(
		http.MethodGet,
		"/rest/v1/workspace_files?select=updated_at&order=updated_at.desc&limit=1",
		nil,
		nil,
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("latest updated_at query failed: %s", resp.Status)
	}
	var rows []struct {
		UpdatedAt time.Time `json:"updated_at"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0].UpdatedAt, nil
}

func (c *Client) DeleteFile(path string) error {
	resp, err := c.request(http.MethodDelete, "/rest/v1/workspace_files?path=eq."+url.QueryEscape(path), nil, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("delete failed: %s", resp.Status)
	}
	return nil
}

func (c *Client) DeleteAllFiles() error {
	state := c.auth.Get()
	if state.UserID == "" {
		return fmt.Errorf("authenticated user ID is missing")
	}
	resp, err := c.request(
		http.MethodDelete,
		"/rest/v1/workspace_files?user_id=eq."+url.QueryEscape(state.UserID),
		nil,
		nil,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("delete all failed: %s", resp.Status)
	}
	return nil
}
