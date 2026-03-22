package model

type ChecklistItem struct {
	ID          uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	ChecklistID uint    `gorm:"not null;index" json:"checklist_id"`
	Text        string  `gorm:"not null;size:500" json:"text"`
	Completed   bool    `gorm:"not null;default:false" json:"completed"`
	Position    float64 `gorm:"not null;default:0" json:"position"`
}
