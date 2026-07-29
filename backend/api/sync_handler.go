package api

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"pinflow/store"
	"pinflow/sync"
)

type SyncHandler struct {
	manager *sync.Manager
	store   *store.FileStore
}

func NewSyncHandler(manager *sync.Manager, store *store.FileStore) *SyncHandler {
	return &SyncHandler{manager: manager, store: store}
}
func (h *SyncHandler) GetStatus(c *gin.Context) { c.JSON(http.StatusOK, h.manager.Status()) }
func (h *SyncHandler) Trigger(c *gin.Context) {
	if h.manager.SourceState().Pending {
		c.JSON(http.StatusConflict, gin.H{"error": sync.ErrSourceDecisionRequired.Error()})
		return
	}
	h.manager.Trigger()
	c.Status(http.StatusAccepted)
}
func (h *SyncHandler) Enable(c *gin.Context) {
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	if req.Enabled && h.manager.SourceState().Pending {
		c.JSON(http.StatusConflict, gin.H{"error": sync.ErrSourceDecisionRequired.Error()})
		return
	}
	h.store.SetSyncEnabled(req.Enabled)
	h.manager.SetEnabled(req.Enabled)
	c.JSON(http.StatusOK, gin.H{"enabled": req.Enabled})
}
func (h *SyncHandler) Pull(c *gin.Context) {
	if err := h.manager.PullFromCloud(); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusOK)
}

func (h *SyncHandler) HasCloudData(c *gin.Context) {
	hasData, err := h.manager.HasCloudData()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"hasData": hasData})
}

func (h *SyncHandler) GetSource(c *gin.Context) {
	c.JSON(http.StatusOK, h.manager.SourceState())
}

func (h *SyncHandler) ResolveSource(c *gin.Context) {
	var req struct {
		Source string `json:"source" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	var err error
	switch req.Source {
	case "cloud":
		err = h.manager.ReplaceLocalFromCloud()
	case "local":
		err = h.manager.ReplaceCloudFromLocal()
	default:
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "source must be cloud or local"})
		return
	}
	if err != nil {
		status := http.StatusBadGateway
		if errors.Is(err, sync.ErrSourceDecisionRequired) ||
			errors.Is(err, sync.ErrSourceResolutionInProgress) {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.manager.SourceState())
}
