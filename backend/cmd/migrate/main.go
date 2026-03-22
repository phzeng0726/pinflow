// migrate is a one-time tool to convert a Pinflow SQLite database to
// the file-based workspace format.
//
// Usage:
//
//	go run ./cmd/migrate --db pinflow.db --out ./pinflow-workspace
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"pinflow/model"
	"pinflow/store"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func main() {
	dbPath := flag.String("db", "pinflow.db", "path to SQLite database")
	outPath := flag.String("out", "./pinflow-workspace", "output workspace directory")
	flag.Parse()

	if _, err := os.Stat(*dbPath); os.IsNotExist(err) {
		log.Fatalf("database not found: %s", *dbPath)
	}

	// Open SQLite
	db, err := gorm.Open(sqlite.Open(*dbPath+"?_pragma=foreign_keys(1)"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	log.Printf("Opened database: %s", *dbPath)

	// Create workspace
	fs, err := store.New(*outPath)
	if err != nil {
		log.Fatalf("failed to create workspace: %v", err)
	}
	log.Printf("Created workspace: %s", fs.BasePath())

	// Migrate tags
	var tags []model.Tag
	if err := db.Order("id asc").Find(&tags).Error; err != nil {
		log.Fatalf("failed to read tags: %v", err)
	}
	for _, t := range tags {
		tag := &model.Tag{ID: t.ID, Name: t.Name, Color: t.Color}
		// Reserve the ID in manifest
		for fs.NextID("tag") < tag.ID {
		}
		if err := fs.CreateTag(tag); err != nil {
			log.Fatalf("failed to create tag %d: %v", tag.ID, err)
		}
	}
	log.Printf("Migrated %d tags", len(tags))

	// Migrate boards
	var boards []model.Board
	if err := db.Order("id asc").Find(&boards).Error; err != nil {
		log.Fatalf("failed to read boards: %v", err)
	}
	for _, b := range boards {
		board := &model.Board{
			ID:        b.ID,
			Name:      b.Name,
			CreatedAt: b.CreatedAt,
			UpdatedAt: b.UpdatedAt,
		}
		for fs.NextID("board") < board.ID {
		}
		if err := fs.CreateBoard(board); err != nil {
			log.Fatalf("failed to create board %d: %v", board.ID, err)
		}
	}
	log.Printf("Migrated %d boards", len(boards))

	// Migrate columns
	var columns []model.Column
	if err := db.Order("id asc").Find(&columns).Error; err != nil {
		log.Fatalf("failed to read columns: %v", err)
	}
	for _, c := range columns {
		col := &model.Column{
			ID:        c.ID,
			BoardID:   c.BoardID,
			Name:      c.Name,
			Position:  c.Position,
			AutoPin:   c.AutoPin,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		}
		for fs.NextID("column") < col.ID {
		}
		if err := fs.CreateColumn(col); err != nil {
			log.Fatalf("failed to create column %d: %v", col.ID, err)
		}
	}
	log.Printf("Migrated %d columns", len(columns))

	// Migrate cards with checklists and tag associations
	var cards []model.Card
	if err := db.
		Preload("Tags").
		Preload("Checklists", func(db *gorm.DB) *gorm.DB { return db.Order("id asc") }).
		Preload("Checklists.Items", func(db *gorm.DB) *gorm.DB { return db.Order("position asc") }).
		Order("id asc").
		Find(&cards).Error; err != nil {
		log.Fatalf("failed to read cards: %v", err)
	}

	for _, c := range cards {
		tagIDs := make([]uint, len(c.Tags))
		for i, t := range c.Tags {
			tagIDs[i] = t.ID
		}

		// Reserve checklist and item IDs
		checklists := make([]model.Checklist, len(c.Checklists))
		for ci, cl := range c.Checklists {
			for fs.NextID("checklist") < cl.ID {
			}
			items := make([]model.ChecklistItem, len(cl.Items))
			for ii, item := range cl.Items {
				for fs.NextID("checklist_item") < item.ID {
				}
				items[ii] = model.ChecklistItem{
					ID:          item.ID,
					ChecklistID: item.ChecklistID,
					Text:        item.Text,
					Completed:   item.Completed,
					Position:    item.Position,
				}
			}
			checklists[ci] = model.Checklist{
				ID:       cl.ID,
				CardID:   cl.CardID,
				Title:    cl.Title,
				Position: cl.Position,
				Items:    items,
			}
		}

		cf := &store.CardFile{
			ID:          c.ID,
			ColumnID:    c.ColumnID,
			Title:       c.Title,
			Description: c.Description,
			Position:    c.Position,
			IsPinned:    c.IsPinned,
			StoryPoint:  c.StoryPoint,
			StartTime:   c.StartTime,
			EndTime:     c.EndTime,
			TagIDs:      tagIDs,
			Checklists:  checklists,
			CreatedAt:   c.CreatedAt,
			UpdatedAt:   c.UpdatedAt,
		}
		for fs.NextID("card") < cf.ID {
		}
		if err := fs.CreateCard(cf); err != nil {
			log.Fatalf("failed to create card %d: %v", cf.ID, err)
		}
	}
	log.Printf("Migrated %d cards", len(cards))

	// Verify by listing the workspace
	log.Println("--- Migration complete ---")
	err = filepath.Walk(*outPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(*outPath, path)
		if info.IsDir() {
			log.Printf("  📁 %s/", rel)
		} else {
			log.Printf("  📄 %s (%s)", rel, humanSize(info.Size()))
		}
		return nil
	})
	if err != nil {
		log.Printf("Warning: failed to walk workspace: %v", err)
	}

	_ = time.Now() // keep time import
}

func humanSize(b int64) string {
	if b < 1024 {
		return fmt.Sprintf("%d B", b)
	}
	return fmt.Sprintf("%.1f KB", float64(b)/1024)
}
