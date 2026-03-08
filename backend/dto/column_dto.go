package dto

type CreateColumnRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type UpdateColumnRequest struct {
	Name     *string  `json:"name"`
	AutoPin  *bool    `json:"auto_pin"`
	Position *float64 `json:"position"`
}
