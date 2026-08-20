package sync

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type authUserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

// ValidateToken verifies an access token and returns its user identity.
func ValidateToken(client *http.Client, accessToken string) (AuthState, error) {
	if SupabaseURL() == "" || SupabaseAnonKey() == "" {
		return AuthState{}, fmt.Errorf("Supabase is not configured")
	}
	req, err := http.NewRequest(http.MethodGet, strings.TrimRight(SupabaseURL(), "/")+"/auth/v1/user", nil)
	if err != nil {
		return AuthState{}, err
	}
	req.Header.Set("apikey", SupabaseAnonKey())
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := client.Do(req)
	if err != nil {
		return AuthState{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return AuthState{}, fmt.Errorf("token validation failed: %s", resp.Status)
	}
	var user authUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return AuthState{}, err
	}
	return AuthState{
		AccessToken: accessToken,
		UserID:      user.ID,
		Email:       user.Email,
		ExpiresAt:   accessTokenExpiry(accessToken),
	}, nil
}

// RefreshToken exchanges a stored refresh token for a new authenticated session.
func RefreshToken(client *http.Client, refreshToken string) (AuthState, error) {
	if SupabaseURL() == "" || SupabaseAnonKey() == "" {
		return AuthState{}, fmt.Errorf("Supabase is not configured")
	}
	body, _ := json.Marshal(map[string]string{"refresh_token": refreshToken})
	req, err := http.NewRequest(http.MethodPost, strings.TrimRight(SupabaseURL(), "/")+"/auth/v1/token?grant_type=refresh_token", bytes.NewReader(body))
	if err != nil {
		return AuthState{}, err
	}
	req.Header.Set("apikey", SupabaseAnonKey())
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return AuthState{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return AuthState{}, fmt.Errorf("token refresh failed: %s", resp.Status)
	}
	var tokens struct {
		AccessToken  string           `json:"access_token"`
		RefreshToken string           `json:"refresh_token"`
		User         authUserResponse `json:"user"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokens); err != nil {
		return AuthState{}, err
	}
	return AuthState{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		UserID:       tokens.User.ID,
		Email:        tokens.User.Email,
		ExpiresAt:    accessTokenExpiry(tokens.AccessToken),
	}, nil
}

func accessTokenExpiry(accessToken string) *time.Time {
	parts := strings.Split(accessToken, ".")
	if len(parts) != 3 {
		return nil
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil
	}
	var claims struct {
		ExpiresAt int64 `json:"exp"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil || claims.ExpiresAt <= 0 {
		return nil
	}
	expiresAt := time.Unix(claims.ExpiresAt, 0).UTC()
	return &expiresAt
}
