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
	"pinflow/seed"
	"pinflow/service"
	"pinflow/store"

	_ "pinflow/docs"
)

func main() {
	workspace := flag.String("workspace", "./pinflow-workspace", "path to workspace directory")
	flag.Parse()

	if err := seed.SeedIfEmpty(*workspace); err != nil {
		log.Printf("Warning: could not seed workspace: %v", err)
	}

	fs, err := store.New(*workspace)
	if err != nil {
		log.Fatalf("failed to open workspace: %v", err)
	}
	log.Printf("Workspace: %s", fs.BasePath())

	repos := repository.NewRepositories(fs)
	services := service.NewServices(service.Deps{Repos: repos, Store: fs})
	handlers := api.NewHandlers(services)
	router := api.NewRouter(handlers, fs)

	log.Println("Starting PinFlow API on :34115")
	if err := router.Run(":34115"); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
