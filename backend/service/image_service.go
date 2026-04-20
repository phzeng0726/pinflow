package service

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/chai2010/webp"
	"github.com/google/uuid"
	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/webp"
	"pinflow/repository"
)

const maxImageSize = 5 << 20 // 5MB

var allowedContentTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
	"image/bmp":  true,
}

var localImageRegexp = regexp.MustCompile(`/api/v1/boards/(\d+)/images/([a-f0-9-]+\.(webp|svg))`)

// ImageService handles image upload, retrieval, and cleanup.
type ImageService interface {
	Upload(cardID uint, fh *multipart.FileHeader) (string, error)
	BoardImageDir(boardID uint) string
	CleanupImages(markdown string)
	CleanupOrphanedImages(oldMarkdown, newMarkdown string)
	ReconcileBoardImages(cardID uint)
}

type imageService struct {
	cardRepo   repository.CardRepository
	columnRepo repository.ColumnRepository
	basePath   string
}

// NewImageService creates an ImageService backed by file storage.
func NewImageService(
	cardRepo repository.CardRepository,
	columnRepo repository.ColumnRepository,
	basePath string,
) ImageService {
	return &imageService{
		cardRepo:   cardRepo,
		columnRepo: columnRepo,
		basePath:   basePath,
	}
}

func (s *imageService) BoardImageDir(boardID uint) string {
	return filepath.Join(s.basePath, "boards", fmt.Sprintf("board-%d", boardID), "images")
}

// Upload validates and stores an uploaded image, returning its URL path.
func (s *imageService) Upload(cardID uint, fh *multipart.FileHeader) (string, error) {
	if fh.Size > maxImageSize {
		return "", errors.New("image must be less than 5 MB")
	}

	f, err := fh.Open()
	if err != nil {
		return "", fmt.Errorf("open upload: %w", err)
	}
	defer f.Close()

	// Read up to 512 bytes for content type detection.
	buf := make([]byte, 512)
	n, err := f.Read(buf)
	if err != nil {
		return "", fmt.Errorf("read upload: %w", err)
	}
	buf = buf[:n]
	contentType := http.DetectContentType(buf)

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	isSVG := ext == ".svg" || strings.Contains(contentType, "xml") && ext == ".svg"

	if !isSVG && !allowedContentTypes[contentType] {
		return "", fmt.Errorf("unsupported image type: %s", contentType)
	}

	// Determine board ID from card.
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return "", fmt.Errorf("card not found: %w", err)
	}
	col, err := s.columnRepo.FindByID(card.ColumnID)
	if err != nil {
		return "", fmt.Errorf("column not found: %w", err)
	}
	boardID := col.BoardID

	// Ensure images directory exists (for boards created before this feature).
	imageDir := s.BoardImageDir(boardID)
	if err := os.MkdirAll(imageDir, 0755); err != nil {
		return "", fmt.Errorf("create image dir: %w", err)
	}

	id := uuid.New().String()

	if isSVG {
		// Read remaining bytes.
		var remaining bytes.Buffer
		remaining.Write(buf)
		if _, err := remaining.ReadFrom(f); err != nil {
			return "", fmt.Errorf("read svg: %w", err)
		}
		destPath := filepath.Join(imageDir, id+".svg")
		if err := os.WriteFile(destPath, remaining.Bytes(), 0644); err != nil {
			return "", fmt.Errorf("write svg: %w", err)
		}
		return fmt.Sprintf("/api/v1/boards/%d/images/%s.svg", boardID, id), nil
	}

	// Decode and re-encode as WebP.
	// Rebuild full reader from already-read buffer + remainder.
	var full bytes.Buffer
	full.Write(buf)
	if _, err := full.ReadFrom(f); err != nil {
		return "", fmt.Errorf("read image: %w", err)
	}

	img, _, err := image.Decode(bytes.NewReader(full.Bytes()))
	if err != nil {
		return "", fmt.Errorf("decode image: %w", err)
	}

	var webpBuf bytes.Buffer
	if err := webp.Encode(&webpBuf, img, &webp.Options{Quality: 75, Lossless: false}); err != nil {
		return "", fmt.Errorf("encode webp: %w", err)
	}

	destPath := filepath.Join(imageDir, id+".webp")
	if err := os.WriteFile(destPath, webpBuf.Bytes(), 0644); err != nil {
		return "", fmt.Errorf("write webp: %w", err)
	}

	return fmt.Sprintf("/api/v1/boards/%d/images/%s.webp", boardID, id), nil
}

// extractImagePaths returns the set of local image file paths referenced in the given markdown.
func (s *imageService) extractImagePaths(markdown string) map[string]struct{} {
	paths := make(map[string]struct{})
	for _, m := range localImageRegexp.FindAllStringSubmatch(markdown, -1) {
		boardIDStr := m[1]
		filename := m[2]
		p := filepath.Join(s.basePath, "boards", fmt.Sprintf("board-%s", boardIDStr), "images", filename)
		paths[p] = struct{}{}
	}
	return paths
}

// CleanupImages scans markdown for local image references and deletes their files.
func (s *imageService) CleanupImages(markdown string) {
	for p := range s.extractImagePaths(markdown) {
		if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
			log.Printf("[ImageService] cleanup %s: %v", p, err)
		}
	}
}

// CleanupOrphanedImages deletes image files that were in oldMarkdown but are no longer in newMarkdown.
func (s *imageService) CleanupOrphanedImages(oldMarkdown, newMarkdown string) {
	oldPaths := s.extractImagePaths(oldMarkdown)
	newPaths := s.extractImagePaths(newMarkdown)
	for p := range oldPaths {
		if _, stillUsed := newPaths[p]; !stillUsed {
			if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
				log.Printf("[ImageService] cleanup orphaned %s: %v", p, err)
			}
		}
	}
}

// ReconcileBoardImages scans the board's images directory and deletes any files
// not referenced by any card description or comment in the board.
func (s *imageService) ReconcileBoardImages(cardID uint) {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return
	}
	col, err := s.columnRepo.FindByID(card.ColumnID)
	if err != nil {
		return
	}
	boardID := col.BoardID

	imageDir := s.BoardImageDir(boardID)
	entries, err := os.ReadDir(imageDir)
	if err != nil || len(entries) == 0 {
		return
	}

	diskFiles := make(map[string]struct{}, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			diskFiles[filepath.Join(imageDir, e.Name())] = struct{}{}
		}
	}

	columns, err := s.columnRepo.FindByBoardID(boardID)
	if err != nil {
		return
	}
	var allMarkdown strings.Builder
	for _, c := range columns {
		cards, err := s.cardRepo.FindByColumnID(c.ID)
		if err != nil {
			continue
		}
		for _, cd := range cards {
			allMarkdown.WriteString(cd.Description)
			allMarkdown.WriteString("\n")
			if detail, err := s.cardRepo.FindDetail(cd.ID); err == nil {
				for _, comment := range detail.Comments {
					allMarkdown.WriteString(comment.Text)
					allMarkdown.WriteString("\n")
				}
			}
		}
	}

	referenced := s.extractImagePaths(allMarkdown.String())
	for p := range diskFiles {
		if _, ok := referenced[p]; !ok {
			if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
				log.Printf("[ImageService] reconcile: remove %s: %v", p, err)
			}
		}
	}
}
