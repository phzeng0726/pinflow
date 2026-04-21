package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"pinflow/api"
	"pinflow/repository"
	"pinflow/service"
	"pinflow/store"
)

// makePNG generates a valid 1×1 white PNG in memory.
func makePNG(t *testing.T) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 1, 1))
	img.Set(0, 0, color.White)
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("png.Encode: %v", err)
	}
	return buf.Bytes()
}

// setupRouterWithImages builds a full router with a real ImageService wired in.
// Returns the router and the workspace basePath.
func setupRouterWithImages(t *testing.T) (interface {
	ServeHTTP(http.ResponseWriter, *http.Request)
}, string) {
	t.Helper()
	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("store.New: %v", err)
	}
	basePath := fs.BasePath()

	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	r := api.NewRouter(handlers)
	return r, basePath
}

// makeMultipartBody constructs a multipart/form-data body with a single file field.
func makeMultipartBody(t *testing.T, fieldName, filename string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile(fieldName, filename)
	if err != nil {
		t.Fatalf("CreateFormFile: %v", err)
	}
	if _, err := fw.Write(content); err != nil {
		t.Fatalf("write form file: %v", err)
	}
	w.Close()
	return &buf, w.FormDataContentType()
}

// createBoardColumnCard creates board → column → card and returns the card ID.
func createBoardColumnCard(t *testing.T, r interface {
	ServeHTTP(http.ResponseWriter, *http.Request)
}) int {
	t.Helper()
	_, colID := createBoardAndColumn(t, r)
	return createCardInColumn(t, r, colID)
}

// ── Handler tests ─────────────────────────────────────────────

func TestHandler_UploadImage_Valid(t *testing.T) {
	r, _ := setupRouterWithImages(t)
	cardID := createBoardColumnCard(t, r)

	body, ct := makeMultipartBody(t, "file", "test.png", makePNG(t))
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/images", cardID), body)
	req.Header.Set("Content-Type", ct)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	url, ok := resp["url"].(string)
	if !ok || url == "" {
		t.Fatalf("expected non-empty url in response, got %v", resp)
	}
}

func TestHandler_UploadImage_InvalidCardID(t *testing.T) {
	r, _ := setupRouterWithImages(t)

	body, ct := makeMultipartBody(t, "file", "test.png", makePNG(t))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/cards/99999/images", body)
	req.Header.Set("Content-Type", ct)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 for non-existent card, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_UploadImage_Oversized(t *testing.T) {
	r, _ := setupRouterWithImages(t)
	cardID := createBoardColumnCard(t, r)

	oversized := make([]byte, 5*1024*1024+1) // 5MB + 1 byte
	copy(oversized, makePNG(t))

	body, ct := makeMultipartBody(t, "file", "big.png", oversized)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/images", cardID), body)
	req.Header.Set("Content-Type", ct)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for oversized file, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_UploadImage_InvalidFormat(t *testing.T) {
	r, _ := setupRouterWithImages(t)
	cardID := createBoardColumnCard(t, r)

	body, ct := makeMultipartBody(t, "file", "document.txt", []byte("Hello, this is plain text"))
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/cards/%d/images", cardID), body)
	req.Header.Set("Content-Type", ct)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for unsupported format, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_ServeImage_InvalidFilename(t *testing.T) {
	r, _ := setupRouterWithImages(t)

	cases := []struct {
		name     string
		filename string
	}{
		{"wrong extension", "abc123ef-0000-0000-0000-000000000000.jpg"},
		{"uppercase UUID", "ABC123EF-0000-0000-0000-000000000000.webp"},
		{"no extension", "abc123ef-0000-0000-0000-000000000000"},
		{"script injection", "script.php.webp"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/boards/1/images/%s", tc.filename), nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400 for filename %q, got %d", tc.filename, w.Code)
			}
		})
	}
}

func TestHandler_ServeImage_NotFound(t *testing.T) {
	r, _ := setupRouterWithImages(t)

	// Valid filename format but file does not exist
	req := httptest.NewRequest(http.MethodGet, "/api/v1/boards/1/images/00000000-0000-0000-0000-000000000000.webp", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Gin's c.File returns 404 when the file is not found
	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 for missing image, got %d", w.Code)
	}
}

// ── Service tests ─────────────────────────────────────────────

func setupImageService(t *testing.T) (service.ImageService, string) {
	t.Helper()
	fs, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("store.New: %v", err)
	}
	basePath := fs.BasePath()
	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	return services.Image, basePath
}

func TestImageService_CleanupImages_DeletesReferencedFiles(t *testing.T) {
	svc, basePath := setupImageService(t)

	// Manually create a fake board images directory and file.
	imageDir := filepath.Join(basePath, "boards", "board-1", "images")
	if err := os.MkdirAll(imageDir, 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	fakeFile := filepath.Join(imageDir, "abc123ef-0000-0000-0000-000000000000.webp")
	if err := os.WriteFile(fakeFile, []byte("fake"), 0644); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	markdown := "Some text\n![img](/api/v1/boards/1/images/abc123ef-0000-0000-0000-000000000000.webp)\nMore text"
	svc.CleanupImages(markdown)

	if _, err := os.Stat(fakeFile); !os.IsNotExist(err) {
		t.Error("expected image file to be deleted after CleanupImages")
	}
}

func TestImageService_CleanupImages_IgnoresRemoteURLs(t *testing.T) {
	svc, basePath := setupImageService(t)

	// Create a local file that should NOT be deleted (not referenced by local URL pattern).
	imageDir := filepath.Join(basePath, "boards", "board-1", "images")
	if err := os.MkdirAll(imageDir, 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	localFile := filepath.Join(imageDir, "aabbccdd-0000-0000-0000-000000000000.webp")
	if err := os.WriteFile(localFile, []byte("fake"), 0644); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	// Markdown only has a remote URL — local file must survive.
	markdown := "![img](https://example.com/photo.jpg)"
	svc.CleanupImages(markdown)

	if _, err := os.Stat(localFile); os.IsNotExist(err) {
		t.Error("local file should not be deleted when only remote URLs are in markdown")
	}
}

func TestImageService_CleanupImages_MissingFileIsIgnored(t *testing.T) {
	svc, _ := setupImageService(t)

	// Reference a file that does not exist — CleanupImages must not panic or error.
	markdown := "![img](/api/v1/boards/99/images/deadbeef-0000-0000-0000-000000000000.webp)"
	svc.CleanupImages(markdown) // should complete without panic
}
