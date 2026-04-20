// @title           PinFlow API
// @version         1.0
// @description     Kanban board with pin mode API
// @host            localhost:34115
// @BasePath        /api/v1
package main

import (
	"flag"
	"log"
	"pinflow/api"
	"pinflow/repository"
	"pinflow/service"
	"pinflow/store"

	_ "pinflow/docs"
)

func main() {
	workspace := flag.String("workspace", "./pinflow-workspace", "path to workspace directory")
	flag.Parse()

	fs, err := store.New(*workspace)
	if err != nil {
		log.Fatalf("failed to open workspace: %v", err)
	}
	log.Printf("Workspace: %s", fs.BasePath())

	boardRepo := repository.NewFileBoardRepository(fs)
	columnRepo := repository.NewFileColumnRepository(fs)
	cardRepo := repository.NewFileCardRepository(fs)
	tagRepo := repository.NewFileTagRepository(fs)
	checklistRepo := repository.NewFileChecklistRepository(fs)
	checklistItemRepo := repository.NewFileChecklistItemRepository(fs)
	depRepo := repository.NewFileDependencyRepository(fs)
	commentRepo := repository.NewFileCommentRepository(fs)

	boardSvc := service.NewBoardService(boardRepo)
	columnSvc := service.NewColumnService(boardRepo, columnRepo)
	imageSvc := service.NewImageService(cardRepo, columnRepo, fs.BasePath())
	cardSvc := service.NewCardService(cardRepo, columnRepo, boardRepo, tagRepo, checklistRepo, checklistItemRepo, depRepo, imageSvc)
	tagSvc := service.NewTagService(tagRepo, cardRepo)
	checklistSvc := service.NewChecklistService(checklistRepo, checklistItemRepo, cardRepo)
	depSvc := service.NewDependencyService(depRepo, cardRepo, columnRepo, boardRepo)
	commentSvc := service.NewCommentService(commentRepo, cardRepo, fs, imageSvc)

	boardH := api.NewBoardHandler(boardSvc)
	columnH := api.NewColumnHandler(columnSvc)
	cardH := api.NewCardHandler(cardSvc)
	tagH := api.NewTagHandler(tagSvc)
	checklistH := api.NewChecklistHandler(checklistSvc)
	checklistItemH := api.NewChecklistItemHandler(checklistSvc)
	depH := api.NewDependencyHandler(depSvc)
	commentH := api.NewCommentHandler(commentSvc)
	imageH := api.NewImageHandler(imageSvc)

	router := api.NewRouter(boardH, columnH, cardH, tagH, checklistH, checklistItemH, depH, commentH, imageH)

	log.Println("Starting PinFlow API on :34115")
	if err := router.Run(":34115"); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
