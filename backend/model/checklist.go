package model

type Checklist struct {
	ID       uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	CardID   uint            `gorm:"not null;index" json:"card_id"`
	Title    string          `gorm:"not null;size:200" json:"title"`
	Position float64         `gorm:"not null;default:0" json:"position"`
	Items    []ChecklistItem `gorm:"foreignKey:ChecklistID" json:"items"`
}
