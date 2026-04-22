package api

import (
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"pinflow/service"

	"github.com/gin-gonic/gin"
)

var filenamePattern = regexp.MustCompile(`^[a-f0-9-]+\.(webp|svg)$`)

type ImageHandler struct {
	services *service.Services
}

// UploadImage godoc
// @Summary     Upload an image for a card
// @Tags        images
// @Accept      multipart/form-data
// @Produce     json
// @Param       id    path      int  true  "Card ID"
// @Param       file  formData  file true  "Image file"
// @Success     201   {object}  dto.ImageUploadResponse
// @Failure     400   {object}  map[string]string
// @Failure     404   {object}  map[string]string
// @Failure     500   {object}  map[string]string
// @Router      /cards/{id}/images [post]
func (h *ImageHandler) UploadImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid card id"})
		return
	}

	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	url, err := h.services.Image.Upload(uint(id), fh)
	if err != nil {
		msg := err.Error()
		status := http.StatusInternalServerError
		switch {
		case msg == "image must be less than 5 MB",
			strings.HasPrefix(msg, "unsupported image type"):
			status = http.StatusBadRequest
		case strings.Contains(msg, "card not found"):
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"url": url})
}

// ServeImage godoc
// @Summary     Serve a board image
// @Tags        images
// @Produce     octet-stream
// @Param       id        path  int     true  "Board ID"
// @Param       filename  path  string  true  "Image filename"
// @Success     200
// @Failure     400  {object}  map[string]string
// @Failure     404  {object}  map[string]string
// @Router      /boards/{id}/images/{filename} [get]
func (h *ImageHandler) ServeImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid board id"})
		return
	}

	filename := c.Param("filename")
	if !filenamePattern.MatchString(filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid filename"})
		return
	}

	imageDir := h.services.Image.BoardImageDir(uint(id))
	filePath := filepath.Join(imageDir, filename)
	c.File(filePath)
}
