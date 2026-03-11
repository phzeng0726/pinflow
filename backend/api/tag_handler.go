package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	svc service.TagService
}

func NewTagHandler(svc service.TagService) *TagHandler {
	return &TagHandler{svc: svc}
}

// CreateTag godoc
// @Summary     Create or get a tag by name
// @Tags        tags
// @Accept      json
// @Produce     json
// @Param       body body dto.CreateTagRequest true "Tag name"
// @Success     200 {object} dto.TagResponse
// @Success     201 {object} dto.TagResponse
// @Router      /tags [post]
func (h *TagHandler) CreateTag(c *gin.Context) {
	var req dto.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	tag, err := h.svc.CreateOrGet(req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.TagResponse{ID: tag.ID, Name: tag.Name})
}

// ListTags godoc
// @Summary     List all tags
// @Tags        tags
// @Produce     json
// @Success     200 {array} dto.TagResponse
// @Router      /tags [get]
func (h *TagHandler) ListTags(c *gin.Context) {
	tags, err := h.svc.ListAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := make([]dto.TagResponse, len(tags))
	for i, t := range tags {
		result[i] = dto.TagResponse{ID: t.ID, Name: t.Name}
	}
	c.JSON(http.StatusOK, result)
}

// AttachTag godoc
// @Summary     Attach a tag to a card
// @Tags        tags
// @Accept      json
// @Produce     json
// @Param       id path int true "Card ID"
// @Param       body body dto.AttachTagRequest true "Tag ID"
// @Success     200 {array} dto.TagResponse
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/tags [post]
func (h *TagHandler) AttachTag(c *gin.Context) {
	cardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.AttachTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.AttachToCard(cardID, req.TagID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	tags, err := h.svc.ListByCard(cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := make([]dto.TagResponse, len(tags))
	for i, t := range tags {
		result[i] = dto.TagResponse{ID: t.ID, Name: t.Name}
	}
	c.JSON(http.StatusOK, result)
}

// DetachTag godoc
// @Summary     Detach a tag from a card
// @Tags        tags
// @Param       id path int true "Card ID"
// @Param       tagId path int true "Tag ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/tags/{tagId} [delete]
func (h *TagHandler) DetachTag(c *gin.Context) {
	cardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	tagID, err := parseUintParam(c, "tagId")
	if err != nil {
		return
	}
	if err := h.svc.DetachFromCard(cardID, tagID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
