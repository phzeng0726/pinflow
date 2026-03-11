package model

type Tag struct {
	ID   uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;uniqueIndex;size:100" json:"name"`
}
