package api

import (
	"net/http"

	"pinflow/dto"
	"pinflow/service"
	"pinflow/store"

	"github.com/gin-gonic/gin"
)

type CommentHandler struct {
	svc service.CommentService
}

func NewCommentHandler(svc service.CommentService) *CommentHandler {
	return &CommentHandler{svc: svc}
}

// CreateComment godoc
// @Summary     Create a comment on a card
// @Tags        comments
// @Accept      json
// @Produce     json
// @Param       id   path int                        true "Card ID"
// @Param       body body dto.CreateCommentRequest   true "Comment data"
// @Success     201  {object} dto.CommentResponse
// @Failure     404  {object} map[string]string
// @Failure     422  {object} map[string]string
// @Router      /cards/{id}/comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	cardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	resp, err := h.svc.CreateComment(cardID, req)
	if err != nil {
		if err == store.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}

// UpdateComment godoc
// @Summary     Update a comment
// @Tags        comments
// @Accept      json
// @Produce     json
// @Param       id   path int                        true "Comment ID"
// @Param       body body dto.UpdateCommentRequest   true "Comment data"
// @Success     200  {object} dto.CommentResponse
// @Failure     404  {object} map[string]string
// @Failure     422  {object} map[string]string
// @Router      /comments/{id} [patch]
func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	resp, err := h.svc.UpdateComment(id, req)
	if err != nil {
		if err == store.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "comment not found"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

// DeleteComment godoc
// @Summary     Delete a comment
// @Tags        comments
// @Param       id path int true "Comment ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /comments/{id} [delete]
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.svc.DeleteComment(id); err != nil {
		if err == store.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "comment not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.Status(http.StatusNoContent)
}
