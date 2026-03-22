package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"

	"github.com/gin-gonic/gin"
)

type ColumnHandler struct {
	svc service.ColumnService
}

func NewColumnHandler(svc service.ColumnService) *ColumnHandler {
	return &ColumnHandler{svc: svc}
}

// CreateColumn godoc
// @Summary     Create a column in a board
// @Tags        columns
// @Accept      json
// @Produce     json
// @Param       id path int true "Board ID"
// @Param       body body dto.CreateColumnRequest true "Column data"
// @Success     201 {object} model.Column
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /boards/{id}/columns [post]
func (h *ColumnHandler) CreateColumn(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	col, err := h.svc.CreateColumn(boardID, req.Name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, col)
}

// UpdateColumn godoc
// @Summary     Update a column (rename, auto_pin, position)
// @Tags        columns
// @Accept      json
// @Produce     json
// @Param       id path int true "Column ID"
// @Param       body body dto.UpdateColumnRequest true "Column update"
// @Success     200 {object} model.Column
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /columns/{id} [patch]
func (h *ColumnHandler) UpdateColumn(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	input := service.UpdateColumnInput{
		Name:     req.Name,
		AutoPin:  req.AutoPin,
		Position: req.Position,
	}
	col, err := h.svc.UpdateColumn(id, input)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, col)
}

// DeleteColumn godoc
// @Summary     Delete a column
// @Tags        columns
// @Param       id path int true "Column ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /columns/{id} [delete]
func (h *ColumnHandler) DeleteColumn(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.svc.DeleteColumn(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
