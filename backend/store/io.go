package store

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func readJSON(path string, v interface{}) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func (s *FileStore) writeJSON(path string, v interface{}) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data = append(data, '\n')
	if err := os.WriteFile(path, data, 0644); err != nil {
		return err
	}
	rel, err := filepath.Rel(s.basePath, path)
	if err == nil && rel != ".." && !filepath.IsAbs(rel) {
		s.sendNotification(filepath.ToSlash(rel))
	}
	return nil
}

func (s *FileStore) sendNotification(value string) {
	s.notifierMu.RLock()
	ch := s.notifier
	s.notifierMu.RUnlock()
	if ch == nil {
		return
	}
	select {
	case ch <- value:
	default:
	}
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
