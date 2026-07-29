package store

import (
	"os"
	"path/filepath"
	"testing"
)

func TestReplaceJSONFilesReplacesManagedJSONAndKeepsOtherFiles(t *testing.T) {
	basePath := t.TempDir()
	fs, err := New(basePath)
	if err != nil {
		t.Fatalf("create store: %v", err)
	}
	oldPath := filepath.Join(basePath, "boards", "old.json")
	if err := os.WriteFile(oldPath, []byte(`{"old":true}`), 0644); err != nil {
		t.Fatalf("write old JSON: %v", err)
	}
	assetPath := filepath.Join(basePath, "boards", "image.png")
	if err := os.WriteFile(assetPath, []byte("image"), 0644); err != nil {
		t.Fatalf("write non-JSON asset: %v", err)
	}

	err = fs.ReplaceJSONFiles(map[string][]byte{
		"manifest.json":     []byte(`{"version":"1.0","workspaceId":"cloud-workspace","next_ids":{"board":1}}`),
		"settings.json":     []byte(`{"theme":"dark","locale":"en-US","syncEnabled":false}`),
		"boards/cloud.json": []byte(`{"cloud":true}`),
	})
	if err != nil {
		t.Fatalf("replace workspace JSON: %v", err)
	}
	if _, err := os.Stat(oldPath); !os.IsNotExist(err) {
		t.Fatalf("expected old JSON to be removed, got %v", err)
	}
	if _, err := os.Stat(filepath.Join(basePath, "boards", "cloud.json")); err != nil {
		t.Fatalf("expected cloud JSON to be written: %v", err)
	}
	if _, err := os.Stat(assetPath); err != nil {
		t.Fatalf("expected non-JSON asset to remain: %v", err)
	}
	if got := fs.WorkspaceID(); got != "cloud-workspace" {
		t.Fatalf("expected reloaded cloud workspace ID, got %q", got)
	}
}

func TestReplaceJSONFilesRejectsUnsafePathBeforeChangingWorkspace(t *testing.T) {
	basePath := t.TempDir()
	fs, err := New(basePath)
	if err != nil {
		t.Fatalf("create store: %v", err)
	}
	manifestPath := filepath.Join(basePath, "manifest.json")
	before, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatalf("read original manifest: %v", err)
	}

	if err := fs.ReplaceJSONFiles(map[string][]byte{
		"../outside.json": []byte(`{"unsafe":true}`),
	}); err == nil {
		t.Fatal("expected unsafe path to be rejected")
	}

	after, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatalf("read preserved manifest: %v", err)
	}
	if string(after) != string(before) {
		t.Fatal("expected original workspace to remain unchanged")
	}
	if _, err := os.Stat(filepath.Join(filepath.Dir(basePath), "outside.json")); !os.IsNotExist(err) {
		t.Fatalf("expected no file outside workspace, got %v", err)
	}
}
