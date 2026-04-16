package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"

	"github.com/gin-gonic/gin"
)

type ChecklistItemHandler struct {
	svc service.ChecklistService
}

func NewChecklistItemHandler(svc service.ChecklistService) *ChecklistItemHandler {
	return &ChecklistItemHandler{svc: svc}
}

// CreateChecklistItem godoc
// @Summary     Add an item to a checklist
// @Tags        checklist-items
// @Accept      json
// @Produce     json
// @Param       id path int true "Checklist ID"
// @Param       body body dto.CreateChecklistItemRequest true "Item data"
// @Success     201 {object} dto.ChecklistItemResponse
// @Failure     404 {object} map[string]string
// @Router      /checklists/{id}/items [post]
func (h *ChecklistItemHandler) CreateItem(c *gin.Context) {
	checklistID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateChecklistItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.CreateItem(checklistID, req.Text, req.Position)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, service.ToChecklistItemResponse(*item))
}

// UpdateChecklistItem godoc
// @Summary     Update a checklist item
// @Tags        checklist-items
// @Accept      json
// @Produce     json
// @Param       id path int true "Item ID"
// @Param       body body dto.UpdateChecklistItemRequest true "Update data"
// @Success     200 {object} dto.ChecklistItemResponse
// @Failure     404 {object} map[string]string
// @Router      /checklist-items/{id} [patch]
func (h *ChecklistItemHandler) UpdateItem(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateChecklistItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.UpdateItem(id, req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToChecklistItemResponse(*item))
}

// SyncChecklistItems godoc
// @Summary     Sync all items of a checklist (smart diff)
// @Tags        checklist-items
// @Accept      json
// @Produce     json
// @Param       id path int true "Checklist ID"
// @Param       body body dto.SyncChecklistItemsRequest true "Items to sync"
// @Success     200 {object} dto.ChecklistResponse
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /checklists/{id}/items [put]
func (h *ChecklistItemHandler) SyncItems(c *gin.Context) {
	checklistID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.SyncChecklistItemsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	cl, err := h.svc.SyncItems(checklistID, req.Items)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.ToChecklistResponse(*cl))
}

// DeleteChecklistItem godoc
// @Summary     Delete a checklist item
// @Tags        checklist-items
// @Param       id path int true "Item ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /checklist-items/{id} [delete]
func (h *ChecklistItemHandler) DeleteItem(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.svc.DeleteItem(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
