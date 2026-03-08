package dto

type CreateCardRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=200"`
	Description string `json:"description" binding:"max=2000"`
}

type UpdateCardRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=200"`
	Description string `json:"description" binding:"max=2000"`
}

type MoveCardRequest struct {
	ColumnID uint    `json:"column_id" binding:"required"`
	Position float64 `json:"position" binding:"required"`
}

type PinnedCardResponse struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ColumnID    uint   `json:"column_id"`
	ColumnName  string `json:"column_name"`
}
