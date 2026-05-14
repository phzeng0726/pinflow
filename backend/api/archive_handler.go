package api

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"pinflow/service"
	"pinflow/store"
)

type ArchiveHandler struct {
	services *service.Services
}

// ArchiveCard godoc
// @Summary     Archive a card
// @Tags        archive
// @Produce     json
// @Param       id path int true "Card ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/archive [patch]
func (h *ArchiveHandler) ArchiveCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.ArchiveCard(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// RestoreCard godoc
// @Summary     Restore an archived card
// @Tags        archive
// @Produce     json
// @Param       id path int true "Card ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/restore [patch]
func (h *ArchiveHandler) RestoreCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.RestoreCard(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// DeleteArchivedCard godoc
// @Summary     Permanently delete an archived card
// @Tags        archive
// @Produce     json
// @Param       id path int true "Card ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/archive [delete]
func (h *ArchiveHandler) DeleteArchivedCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.DeleteArchivedCard(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ArchiveColumn godoc
// @Summary     Archive a column
// @Tags        archive
// @Produce     json
// @Param       id path int true "Column ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /columns/{id}/archive [patch]
func (h *ArchiveHandler) ArchiveColumn(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.ArchiveColumn(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ArchiveAllCardsInColumn godoc
// @Summary     Archive all cards in a column
// @Tags        archive
// @Produce     json
// @Param       id path int true "Column ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /columns/{id}/archive-cards [patch]
func (h *ArchiveHandler) ArchiveAllCardsInColumn(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.ArchiveAllCardsInColumn(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// RestoreColumn godoc
// @Summary     Restore an archived column
// @Tags        archive
// @Produce     json
// @Param       id path int true "Column ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /columns/{id}/restore [patch]
func (h *ArchiveHandler) RestoreColumn(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.RestoreColumn(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// DeleteArchivedColumn godoc
// @Summary     Permanently delete an archived column
// @Tags        archive
// @Produce     json
// @Param       id path int true "Column ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /columns/{id}/archive [delete]
func (h *ArchiveHandler) DeleteArchivedColumn(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Archive.DeleteArchivedColumn(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// GetArchivedCards godoc
// @Summary     List archived cards for a board
// @Tags        archive
// @Produce     json
// @Param       id path int true "Board ID"
// @Success     200 {array} dto.ArchivedCardResponse
// @Failure     400 {object} map[string]string
// @Router      /boards/{id}/archive/cards [get]
func (h *ArchiveHandler) GetArchivedCards(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	cards, err := h.services.Archive.GetArchivedCards(boardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cards)
}

// GetArchivedColumns godoc
// @Summary     List archived columns for a board
// @Tags        archive
// @Produce     json
// @Param       id path int true "Board ID"
// @Success     200 {array} dto.ArchivedColumnResponse
// @Failure     400 {object} map[string]string
// @Router      /boards/{id}/archive/columns [get]
func (h *ArchiveHandler) GetArchivedColumns(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	cols, err := h.services.Archive.GetArchivedColumns(boardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cols)
}
