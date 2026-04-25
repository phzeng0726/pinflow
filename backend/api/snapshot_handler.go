package api

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"pinflow/dto"
	"pinflow/service"
	"pinflow/store"
)

type SnapshotHandler struct {
	services *service.Services
}

// ListSnapshots godoc
// @Summary     List snapshots for a board
// @Tags        snapshots
// @Produce     json
// @Param       id path int true "Board ID"
// @Success     200 {array} dto.SnapshotResponse
// @Failure     400 {object} map[string]string
// @Router      /boards/{id}/snapshots [get]
func (h *SnapshotHandler) ListSnapshots(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	snaps, err := h.services.Snapshot.ListSnapshots(boardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, snaps)
}

// CreateSnapshot godoc
// @Summary     Manually create a snapshot for a board
// @Tags        snapshots
// @Accept      json
// @Produce     json
// @Param       id   path int                        true "Board ID"
// @Param       body body dto.CreateSnapshotRequest  false "Snapshot name (optional)"
// @Success     201 {object} dto.SnapshotResponse
// @Failure     400 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /boards/{id}/snapshots [post]
func (h *SnapshotHandler) CreateSnapshot(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	var req dto.CreateSnapshotRequest
	_ = c.ShouldBindJSON(&req) // name is optional

	snap, err := h.services.Snapshot.CreateSnapshot(boardID, req.Name, true, "manual", false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, snap)
}

// RestoreSnapshot godoc
// @Summary     Restore a board to a snapshot
// @Tags        snapshots
// @Param       id  path int true "Board ID"
// @Param       sid path int true "Snapshot ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /boards/{id}/snapshots/{sid}/restore [post]
func (h *SnapshotHandler) RestoreSnapshot(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	snapshotID, err := parseUintParam(c, "sid")
	if err != nil {
		return
	}
	if err := h.services.Snapshot.RestoreSnapshot(boardID, snapshotID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "snapshot not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// DeleteSnapshot godoc
// @Summary     Delete a snapshot
// @Tags        snapshots
// @Param       id  path int true "Board ID"
// @Param       sid path int true "Snapshot ID"
// @Success     204
// @Failure     400 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Router      /boards/{id}/snapshots/{sid} [delete]
func (h *SnapshotHandler) DeleteSnapshot(c *gin.Context) {
	boardID, err := parseUintParam(c, "id")
	if err != nil {
		return
	}
	snapshotID, err := parseUintParam(c, "sid")
	if err != nil {
		return
	}
	if err := h.services.Snapshot.DeleteSnapshot(boardID, snapshotID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "snapshot not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
