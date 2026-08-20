package api

import (
	"net/http"

	"pinflow/sync"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth    *sync.AuthManager
	manager *sync.Manager
	client  *http.Client
}

func NewAuthHandler(auth *sync.AuthManager, manager *sync.Manager) *AuthHandler {
	return &AuthHandler{auth: auth, manager: manager, client: http.DefaultClient}
}

func (h *AuthHandler) CreateSession(c *gin.Context) {
	var req struct {
		AccessToken  string `json:"accessToken"`
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	state, err := sync.ValidateToken(h.client, req.AccessToken)
	if err != nil && req.RefreshToken != "" {
		state, err = sync.RefreshToken(h.client, req.RefreshToken)
	}
	if err != nil {
		h.auth.Clear()
		if h.manager != nil {
			h.manager.ClearSourceDecision()
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if state.RefreshToken == "" {
		state.RefreshToken = req.RefreshToken
	}
	h.auth.Set(state)
	if h.manager != nil {
		_ = h.manager.InitializeSourceDecision()
	}
	c.JSON(http.StatusOK, gin.H{
		"authenticated": true,
		"userId":        state.UserID,
		"email":         state.Email,
		"refreshToken":  state.RefreshToken,
		"expiresAt":     state.ExpiresAt,
	})
}

func (h *AuthHandler) GetSession(c *gin.Context) {
	state := h.auth.Get()
	if state.AccessToken == "" {
		c.JSON(http.StatusOK, gin.H{"authenticated": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"authenticated":   true,
		"userId":          state.UserID,
		"email":           state.Email,
		"expiresAt":       state.ExpiresAt,
		"renewalRequired": state.RenewalRequired,
	})
}

func (h *AuthHandler) GetConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"supabaseUrl": sync.SupabaseURL(),
		"configured":  sync.SupabaseConfigured(),
	})
}

func (h *AuthHandler) DeleteSession(c *gin.Context) {
	h.auth.Clear()
	if h.manager != nil {
		h.manager.ClearSourceDecision()
	}
	c.Status(http.StatusOK)
}
