package dto

import (
	"pinflow/model"
	"time"
)

type CreateDependencyRequest struct {
	ToCardID uint                  `json:"toCardId" binding:"required"`
	Type     model.DependencyType  `json:"type" binding:"required"`
}

type DependencyCardRef struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	BoardID  uint   `json:"boardId"`
	ColumnID uint   `json:"columnId"`
}

type DependencyResponse struct {
	ID         uint                  `json:"id"`
	FromCard   DependencyCardRef     `json:"fromCard"`
	ToCard     DependencyCardRef     `json:"toCard"`
	Type       model.DependencyType  `json:"type"`
	CreatedAt  time.Time             `json:"createdAt"`
}

type CardSearchResult struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	BoardID  uint   `json:"boardId"`
	BoardName string `json:"boardName"`
	ColumnID  uint   `json:"columnId"`
	ColumnName string `json:"columnName"`
}
