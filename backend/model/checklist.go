package model

type Checklist struct {
	ID     uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	CardID uint            `gorm:"not null;index" json:"card_id"`
	Title  string          `gorm:"not null;size:200" json:"title"`
	Items  []ChecklistItem `gorm:"foreignKey:ChecklistID" json:"items"`
}
