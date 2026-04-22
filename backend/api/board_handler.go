package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BoardHandler struct {
	services *service.Services
}

// CreateBoard godoc
// @Summary     Create a board
// @Tags        boards
// @Accept      json
// @Produce     json
// @Param       body body dto.CreateBoardRequest true "Board name"
// @Success     201 {object} model.Board
// @Failure     422 {object} map[string]string
// @Router      /boards [post]
func (h *BoardHandler) CreateBoard(c *gin.Context) {
	var req dto.CreateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	board, err := h.services.Board.CreateBoard(req.Name)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, board)
}

// GetBoards godoc
// @Summary     List all boards
// @Tags        boards
// @Produce     json
// @Success     200 {array} model.Board
// @Router      /boards [get]
func (h *BoardHandler) GetBoards(c *gin.Context) {
	boards, err := h.services.Board.GetAllBoards()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, boards)
}

// GetBoard godoc
// @Summary     Get a board by ID
// @Tags        boards
// @Produce     json
// @Param       id path int true "Board ID"
// @Success     200 {object} model.Board
// @Failure     404 {object} map[string]string
// @Router      /boards/{id} [get]
func (h *BoardHandler) GetBoard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	board, err := h.services.Board.GetBoardByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "board not found"})
		return
	}
	c.JSON(http.StatusOK, board)
}

// UpdateBoard godoc
// @Summary     Update a board
// @Tags        boards
// @Accept      json
// @Produce     json
// @Param       id path int true "Board ID"
// @Param       body body dto.UpdateBoardRequest true "Board data"
// @Success     200 {object} model.Board
// @Failure     404 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /boards/{id} [put]
func (h *BoardHandler) UpdateBoard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.UpdateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	board, err := h.services.Board.UpdateBoard(id, req.Name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, board)
}

// DeleteBoard godoc
// @Summary     Delete a board
// @Tags        boards
// @Param       id path int true "Board ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /boards/{id} [delete]
func (h *BoardHandler) DeleteBoard(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.services.Board.DeleteBoard(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "board not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

func parseUintParam(c *gin.Context, name string) (uint, error) {
	raw := c.Param(name)
	val, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid " + name})
		return 0, err
	}
	return uint(val), nil
}
