package dto

type CreateBoardRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type UpdateBoardRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type MoveBoardRequest struct {
	Position float64 `json:"position" binding:"required"`
}
