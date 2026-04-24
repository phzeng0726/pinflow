package dto

type UpdateSettingsRequest struct {
	Theme  *string `json:"theme"`
	Locale *string `json:"locale"`
}

type SettingsResponse struct {
	Theme  string `json:"theme"`
	Locale string `json:"locale"`
}
