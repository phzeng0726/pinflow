package api

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(h *Handlers) *gin.Engine {
	r := gin.Default()
	r.MaxMultipartMemory = 5 << 20

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: false,
	}))

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		boards := v1.Group("/boards")
		{
			boards.POST("", h.Board.CreateBoard)
			boards.GET("", h.Board.GetBoards)
			boards.GET("/:id", h.Board.GetBoard)
			boards.PUT("/:id", h.Board.UpdateBoard)
			boards.DELETE("/:id", h.Board.DeleteBoard)
			boards.POST("/:id/columns", h.Column.CreateColumn)
			boards.GET("/:id/images/:filename", h.Image.ServeImage)
		}

		columns := v1.Group("/columns")
		{
			columns.PATCH("/:id", h.Column.UpdateColumn)
			columns.DELETE("/:id", h.Column.DeleteColumn)
			columns.POST("/:id/cards", h.Card.CreateCard)
		}

		cards := v1.Group("/cards")
		{
			cards.GET("/pinned", h.Card.GetPinnedCards)
			cards.GET("/search", h.Card.SearchCards)
			cards.GET("/:id", h.Card.GetCard)
			cards.PATCH("/:id", h.Card.UpdateCard)
			cards.PATCH("/:id/move", h.Card.MoveCard)
			cards.PATCH("/:id/pin", h.Card.TogglePin)
			cards.PATCH("/:id/schedule", h.Card.UpdateSchedule)
			cards.DELETE("/:id", h.Card.DeleteCard)
			cards.POST("/:id/duplicate", h.Card.DuplicateCard)
			cards.POST("/:id/tags", h.Tag.AttachTag)
			cards.DELETE("/:id/tags/:tagId", h.Tag.DetachTag)
			cards.GET("/:id/checklists", h.Checklist.ListChecklists)
			cards.POST("/:id/checklists", h.Checklist.CreateChecklist)
			cards.GET("/:id/dependencies", h.Dependency.ListDependencies)
			cards.POST("/:id/dependencies", h.Dependency.CreateDependency)
			cards.POST("/:id/comments", h.Comment.CreateComment)
			cards.POST("/:id/images", h.Image.UploadImage)
		}

		dependencies := v1.Group("/dependencies")
		{
			dependencies.DELETE("/:id", h.Dependency.DeleteDependency)
		}

		tags := v1.Group("/tags")
		{
			tags.GET("", h.Tag.ListTags)
			tags.POST("", h.Tag.CreateTag)
			tags.PATCH("/:id", h.Tag.UpdateTag)
			tags.DELETE("/:id", h.Tag.DeleteTag)
		}

		checklists := v1.Group("/checklists")
		{
			checklists.PATCH("/:id", h.Checklist.UpdateChecklist)
			checklists.DELETE("/:id", h.Checklist.DeleteChecklist)
			checklists.POST("/:id/items", h.ChecklistItem.CreateItem)
			checklists.PUT("/:id/items", h.ChecklistItem.SyncItems)
		}

		checklistItems := v1.Group("/checklist-items")
		{
			checklistItems.PATCH("/:id", h.ChecklistItem.UpdateItem)
			checklistItems.DELETE("/:id", h.ChecklistItem.DeleteItem)
		}

		comments := v1.Group("/comments")
		{
			comments.PATCH("/:id", h.Comment.UpdateComment)
			comments.DELETE("/:id", h.Comment.DeleteComment)
		}
	}

	return r
}
