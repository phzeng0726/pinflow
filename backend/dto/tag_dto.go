package dto

type CreateTagRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=100"`
	Color string `json:"color" binding:"max=50"`
}

type UpdateTagRequest struct {
	Name  *string `json:"name" binding:"omitempty,min=1,max=100"`
	Color *string `json:"color" binding:"omitempty,max=50"`
}

type AttachTagRequest struct {
	TagID uint `json:"tag_id" binding:"required"`
}

type TagResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}
