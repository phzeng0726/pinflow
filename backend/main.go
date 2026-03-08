// @title           Pinflow API
// @version         1.0
// @description     Kanban board with pin mode API
// @host            localhost:34115
// @BasePath        /api/v1
package main

import (
	"log"
	"pinflow/api"
	"pinflow/model"
	"pinflow/repository"
	"pinflow/service"

	_ "pinflow/docs"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("pinflow.db?_pragma=foreign_keys(1)"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(&model.Board{}, &model.Column{}, &model.Card{}); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	boardRepo := repository.NewBoardRepository(db)
	columnRepo := repository.NewColumnRepository(db)
	cardRepo := repository.NewCardRepository(db)

	boardSvc := service.NewBoardService(boardRepo)
	columnSvc := service.NewColumnService(boardRepo, columnRepo)
	cardSvc := service.NewCardService(cardRepo, columnRepo)

	boardH := api.NewBoardHandler(boardSvc)
	columnH := api.NewColumnHandler(columnSvc)
	cardH := api.NewCardHandler(cardSvc)

	router := api.NewRouter(boardH, columnH, cardH)

	log.Println("Starting Pinflow API on :34115")
	if err := router.Run(":34115"); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
