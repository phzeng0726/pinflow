package store

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

var notifier struct {
	sync.RWMutex
	ch       chan<- string
	basePath string
}

// SetWriteNotifier registers the optional non-blocking persistence notification channel.
func SetWriteNotifier(ch chan<- string) {
	setWriteNotifier(ch, "")
}

func setWriteNotifier(ch chan<- string, basePath string) {
	notifier.Lock()
	defer notifier.Unlock()
	notifier.ch = ch
	notifier.basePath = basePath
}

func readJSON(path string, v interface{}) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func writeJSON(path string, v interface{}) error {
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
	notifier.RLock()
	ch := notifier.ch
	basePath := notifier.basePath
	notifier.RUnlock()
	if ch != nil {
		notificationPath := path
		if basePath != "" {
			if rel, relErr := filepath.Rel(basePath, path); relErr == nil &&
				rel != ".." && !filepath.IsAbs(rel) {
				notificationPath = rel
			}
		}
		select {
		case ch <- filepath.ToSlash(notificationPath):
		default:
		}
	}
	return nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
