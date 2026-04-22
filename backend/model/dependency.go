package model

import "time"

type DependencyType string

const (
	DependencyTypeBlocks     DependencyType = "blocks"
	DependencyTypeParentOf   DependencyType = "parent_of"
	DependencyTypeDuplicates DependencyType = "duplicates"
	DependencyTypeRelatedTo  DependencyType = "related_to"
)

type Dependency struct {
	ID         uint           `json:"id"`
	FromCardID uint           `json:"fromCardId"`
	ToCardID   uint           `json:"toCardId"`
	Type       DependencyType `json:"type"`
	CreatedAt  time.Time      `json:"createdAt"`
}
