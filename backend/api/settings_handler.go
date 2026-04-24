package api

import (
	"net/http"

	"pinflow/dto"
	"pinflow/service"

	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	services *service.Services
}

// GetSettings godoc
// @Summary     Get application settings
// @Tags        settings
// @Produce     json
// @Success     200 {object} dto.SettingsResponse
// @Router      /settings [get]
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	settings, err := h.services.Settings.GetSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.SettingsResponse{
		Theme:  settings.Theme,
		Locale: settings.Locale,
	})
}

// UpdateSettings godoc
// @Summary     Update application settings
// @Tags        settings
// @Accept      json
// @Produce     json
// @Param       body body dto.UpdateSettingsRequest true "Settings to update"
// @Success     200 {object} dto.SettingsResponse
// @Failure     422 {object} map[string]string
// @Router      /settings [put]
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var req dto.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	settings, err := h.services.Settings.UpdateSettings(req.Theme, req.Locale)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.SettingsResponse{
		Theme:  settings.Theme,
		Locale: settings.Locale,
	})
}
