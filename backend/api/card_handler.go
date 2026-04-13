package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"

	"github.com/gin-gonic/gin"
)

type CardHandler struct {
	svc service.CardService
}

func NewCardHandler(svc service.CardService) *CardHandler {
	return &CardHandler{svc: svc}
}

// CreateCard godoc
// @Summary     Create a card in a column
// @Tags        cards
// @Accept      json
// @Produce     json
// @Param       id path int true "Column ID"
// @Param       body body dto.CreateCardRequest true "Card data"
// @Success     201 {object} model.Card
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /columns/{id}/cards [post]
func (h *CardHandler) CreateCard(c *gin.Context) {
	columnID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	card, err := h.svc.CreateCard(columnID, req.Title, req.Description)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, card)
}

// GetCard godoc
// @Summary     Get a card by ID with full details
// @Tags        cards
// @Produce     json
// @Param       id path int true "Card ID"
// @Success     200 {object} dto.CardResponse
// @Failure     404 {object} map[string]string
// @Router      /cards/{id} [get]
func (h *CardHandler) GetCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	card, err := h.svc.GetCardDetail(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
		return
	}
	c.JSON(http.StatusOK, card)
}

// UpdateCard godoc
// @Summary     Update a card's title, description, story points, priority, and schedule
// @Tags        cards
// @Accept      json
// @Produce     json
// @Param       id path int true "Card ID"
// @Param       body body dto.UpdateCardRequest true "Card data"
// @Success     200 {object} dto.CardResponse
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /cards/{id} [patch]
func (h *CardHandler) UpdateCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	if req.Priority != nil && *req.Priority != 0 && (*req.Priority < 1 || *req.Priority > 5) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "priority must be between 1 and 5"})
		return
	}
	card, err := h.svc.UpdateCard(id, req.Title, req.Description, req.StoryPoint, req.Priority, req.StartTime, req.EndTime)
	if err != nil {
		if err.Error() == "endTime must be after startTime" || err.Error() == "priority must be between 1 and 5" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, card)
}

// MoveCard godoc
// @Summary     Move a card to another column or reorder
// @Tags        cards
// @Accept      json
// @Produce     json
// @Param       id path int true "Card ID"
// @Param       body body dto.MoveCardRequest true "Move data"
// @Success     200 {object} model.Card
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /cards/{id}/move [patch]
func (h *CardHandler) MoveCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.MoveCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	card, err := h.svc.MoveCard(id, req.ColumnID, req.Position)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, card)
}

// TogglePin godoc
// @Summary     Toggle pin status of a card
// @Tags        cards
// @Param       id path int true "Card ID"
// @Success     200 {object} model.Card
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/pin [patch]
func (h *CardHandler) TogglePin(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	card, err := h.svc.TogglePin(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, card)
}

// DeleteCard godoc
// @Summary     Delete a card
// @Tags        cards
// @Param       id path int true "Card ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /cards/{id} [delete]
func (h *CardHandler) DeleteCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.svc.DeleteCard(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// DuplicateCard godoc
// @Summary     Duplicate a card
// @Tags        cards
// @Accept      json
// @Produce     json
// @Param       id path int true "Card ID"
// @Param       body body dto.DuplicateCardRequest true "Duplicate data"
// @Success     201 {object} dto.CardResponse
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /cards/{id}/duplicate [post]
func (h *CardHandler) DuplicateCard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.DuplicateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	card, err := h.svc.DuplicateCard(id, req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, card)
}

// GetPinnedCards godoc
// @Summary     Get all pinned cards
// @Tags        cards
// @Produce     json
// @Success     200 {array} dto.PinnedCardResponse
// @Router      /cards/pinned [get]
func (h *CardHandler) GetPinnedCards(c *gin.Context) {
	cards, err := h.svc.GetPinnedCards()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cards)
}
