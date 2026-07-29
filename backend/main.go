// @title           PinFlow API
// @version         1.0
// @description     Kanban board with pin mode API
// @host            localhost:34115
// @BasePath        /api/v1
package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"pinflow/api"
	"pinflow/repository"
	"pinflow/seed"
	"pinflow/service"
	"pinflow/store"
	"pinflow/sync"
	"syscall"
	"time"

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
	auth := &sync.AuthManager{}
	writes := make(chan string, 1000)
	fs.SetWriteNotifier(writes)
	manager := sync.NewManager(fs, auth, writes)
	done := make(chan struct{})
	managerDone := make(chan struct{})
	go func() {
		defer close(managerDone)
		manager.Run(done)
	}()
	handlers := api.NewHandlers(services, auth, manager, fs)
	router := api.NewRouter(handlers, fs)

	log.Println("Starting PinFlow API on :34115")
	server := &http.Server{
		Addr:    ":34115",
		Handler: router,
	}
	serverErrors := make(chan error, 1)
	go func() {
		serverErrors <- server.ListenAndServe()
	}()

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(signals)

	select {
	case received := <-signals:
		log.Printf("Received %s, shutting down", received)
	case err := <-serverErrors:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Printf("HTTP server stopped unexpectedly: %v", err)
		}
	}

	close(done)
	fs.SetWriteNotifier(nil)

	shutdownContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		log.Printf("HTTP server shutdown failed: %v", err)
	}
	select {
	case <-managerDone:
	case <-shutdownContext.Done():
		log.Printf("Sync manager shutdown timed out: %v", shutdownContext.Err())
	}
}
