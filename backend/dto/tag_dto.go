package dto

type CreateTagRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type AttachTagRequest struct {
	TagID uint `json:"tag_id" binding:"required"`
}

type TagResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}
