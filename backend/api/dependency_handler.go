package api

import (
	"net/http"
	"pinflow/dto"
	"pinflow/service"
	"pinflow/store"

	"github.com/gin-gonic/gin"
)

type DependencyHandler struct {
	svc service.DependencyService
}

func NewDependencyHandler(svc service.DependencyService) *DependencyHandler {
	return &DependencyHandler{svc: svc}
}

// CreateDependency godoc
// @Summary     Create a dependency between two cards
// @Tags        dependencies
// @Accept      json
// @Produce     json
// @Param       id path int true "From Card ID"
// @Param       body body dto.CreateDependencyRequest true "Dependency data"
// @Success     201 {object} dto.DependencyResponse
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Failure     409 {object} map[string]string
// @Failure     422 {object} map[string]string
// @Router      /cards/{id}/dependencies [post]
func (h *DependencyHandler) CreateDependency(c *gin.Context) {
	fromCardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateDependencyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	dep, err := h.svc.CreateForCard(fromCardID, req)
	if err != nil {
		switch err {
		case store.ErrSelfReference:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case store.ErrDependencyConflict:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, dep)
}

// ListDependencies godoc
// @Summary     List dependencies for a card
// @Tags        dependencies
// @Produce     json
// @Param       id path int true "Card ID"
// @Success     200 {array} dto.DependencyResponse
// @Failure     404 {object} map[string]string
// @Router      /cards/{id}/dependencies [get]
func (h *DependencyHandler) ListDependencies(c *gin.Context) {
	cardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	deps, err := h.svc.ListByCard(cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, deps)
}

// DeleteDependency godoc
// @Summary     Delete a dependency
// @Tags        dependencies
// @Param       id path int true "Dependency ID"
// @Success     204
// @Failure     404 {object} map[string]string
// @Router      /dependencies/{id} [delete]
func (h *DependencyHandler) DeleteDependency(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "dependency not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
