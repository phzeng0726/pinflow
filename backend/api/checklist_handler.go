package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"
	"strings"

	"github.com/gin-gonic/gin"
)

type ChecklistHandler struct {
	svc service.ChecklistService
}

func NewChecklistHandler(svc service.ChecklistService) *ChecklistHandler {
	return &ChecklistHandler{svc: svc}
}

// CreateChecklist godoc
// @Summary     Create a checklist on a card
// @Tags        checklists
// @Accept      json
// @Produce     json
// @Param       id path int true "Card ID"
// @Param       body body dto.CreateChecklistRequest true "Checklist data"
// @Success     201 {object} dto.ChecklistResponse
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/checklists [post]
func (h *ChecklistHandler) CreateChecklist(c *gin.Context) {
	cardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateChecklistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	cl, err := h.svc.CreateChecklist(cardID, req.Title)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, service.ToChecklistResponse(*cl))
}

// ListChecklists godoc
// @Summary     List checklists for a card
// @Tags        checklists
// @Produce     json
// @Param       id path int true "Card ID"
// @Success     200 {array} dto.ChecklistResponse
// @Router      /cards/{id}/checklists [get]
func (h *ChecklistHandler) ListChecklists(c *gin.Context) {
	cardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	cls, err := h.svc.ListByCard(cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToChecklistResponses(cls))
}

// UpdateChecklist godoc
// @Summary     Update a checklist
// @Tags        checklists
// @Accept      json
// @Produce     json
// @Param       id path int true "Checklist ID"
// @Param       body body dto.UpdateChecklistRequest true "Checklist data"
// @Success     200 {object} dto.ChecklistResponse
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /checklists/{id} [patch]
func (h *ChecklistHandler) UpdateChecklist(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateChecklistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	if req.Title == nil && req.Position == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one field (title or position) is required"})
		return
	}
	if req.Title != nil && len(strings.TrimSpace(*req.Title)) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title must not be empty"})
		return
	}
	cl, err := h.svc.UpdateChecklist(id, req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToChecklistResponse(*cl))
}

// DeleteChecklist godoc
// @Summary     Delete a checklist and its items
// @Tags        checklists
// @Param       id path int true "Checklist ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /checklists/{id} [delete]
func (h *ChecklistHandler) DeleteChecklist(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.svc.DeleteChecklist(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
