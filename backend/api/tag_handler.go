package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"
	"pinflow/store"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	services *service.Services
}

// ListBoardTags godoc
// @Summary     List all tags for a board
// @Tags        tags
// @Produce     json
// @Param       id path int true "Board ID"
// @Success     200 {array} dto.TagResponse
// @Failure     404 {object} map[string]string
// @Router      /boards/{id}/tags [get]
func (h *TagHandler) ListBoardTags(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	tags, err := h.services.Tag.ListByBoard(boardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToTagResponses(tags))
}

// CreateBoardTag godoc
// @Summary     Create or get a tag for a board
// @Tags        tags
// @Accept      json
// @Produce     json
// @Param       id path int true "Board ID"
// @Param       body body dto.CreateTagRequest true "Tag data"
// @Success     200 {object} dto.TagResponse
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /boards/{id}/tags [post]
func (h *TagHandler) CreateBoardTag(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	tag, err := h.services.Tag.CreateOrGet(boardID, req.Name, req.Color)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToTagResponse(*tag))
}

// UpdateTag godoc
// @Summary     Update a tag's name and/or color
// @Tags        tags
// @Accept      json
// @Produce     json
// @Param       id path int true "Tag ID"
// @Param       body body dto.UpdateTagRequest true "Tag data"
// @Success     200 {object} dto.TagResponse
// @Failure     404 {object} map[string]string
// @Failure     409 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /tags/{id} [patch]
func (h *TagHandler) UpdateTag(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	tag, err := h.services.Tag.UpdateTag(id, req)
	if err != nil {
		if err.Error() == "tag name already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToTagResponse(*tag))
}

// DeleteTag godoc
// @Summary     Delete a tag and its card associations
// @Tags        tags
// @Param       id path int true "Tag ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /tags/{id} [delete]
func (h *TagHandler) DeleteTag(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Tag.DeleteTag(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
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
// @Failure     422 {object} map[string]string
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
	if err := h.services.Tag.AttachToCard(cardID, req.TagID); err != nil {
		if err == store.ErrCrossBoardTag {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	tags, err := h.services.Tag.ListByCard(cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToTagResponses(tags))
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
	if err := h.services.Tag.DetachFromCard(cardID, tagID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
