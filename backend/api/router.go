package api

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// RouterDeps holds handler dependencies (used in tests).
type RouterDeps struct {
	BoardH         *BoardHandler
	ColumnH        *ColumnHandler
	CardH          *CardHandler
	TagH           *TagHandler
	ChecklistH     *ChecklistHandler
	ChecklistItemH *ChecklistItemHandler
	DependencyH    *DependencyHandler
	CommentH       *CommentHandler
}

func NewRouter(
	boardH *BoardHandler,
	columnH *ColumnHandler,
	cardH *CardHandler,
	tagH *TagHandler,
	checklistH *ChecklistHandler,
	checklistItemH *ChecklistItemHandler,
	dependencyH *DependencyHandler,
	commentH *CommentHandler,
) *gin.Engine {
	r := gin.Default()

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
			boards.POST("", boardH.CreateBoard)
			boards.GET("", boardH.GetBoards)
			boards.GET("/:id", boardH.GetBoard)
			boards.PUT("/:id", boardH.UpdateBoard)
			boards.DELETE("/:id", boardH.DeleteBoard)
			boards.POST("/:id/columns", columnH.CreateColumn)
		}

		columns := v1.Group("/columns")
		{
			columns.PATCH("/:id", columnH.UpdateColumn)
			columns.DELETE("/:id", columnH.DeleteColumn)
			columns.POST("/:id/cards", cardH.CreateCard)
		}

		cards := v1.Group("/cards")
		{
			cards.GET("/pinned", cardH.GetPinnedCards)
			cards.GET("/search", cardH.SearchCards)
			cards.GET("/:id", cardH.GetCard)
			cards.PATCH("/:id", cardH.UpdateCard)
			cards.PATCH("/:id/move", cardH.MoveCard)
			cards.PATCH("/:id/pin", cardH.TogglePin)
			cards.PATCH("/:id/schedule", cardH.UpdateSchedule)
			cards.DELETE("/:id", cardH.DeleteCard)
			cards.POST("/:id/duplicate", cardH.DuplicateCard)
			cards.POST("/:id/tags", tagH.AttachTag)
			cards.DELETE("/:id/tags/:tagId", tagH.DetachTag)
			cards.GET("/:id/checklists", checklistH.ListChecklists)
			cards.POST("/:id/checklists", checklistH.CreateChecklist)
			cards.GET("/:id/dependencies", dependencyH.ListDependencies)
			cards.POST("/:id/dependencies", dependencyH.CreateDependency)
			cards.POST("/:id/comments", commentH.CreateComment)
		}

		dependencies := v1.Group("/dependencies")
		{
			dependencies.DELETE("/:id", dependencyH.DeleteDependency)
		}

		tags := v1.Group("/tags")
		{
			tags.GET("", tagH.ListTags)
			tags.POST("", tagH.CreateTag)
			tags.PATCH("/:id", tagH.UpdateTag)
			tags.DELETE("/:id", tagH.DeleteTag)
		}

		checklists := v1.Group("/checklists")
		{
			checklists.PATCH("/:id", checklistH.UpdateChecklist)
			checklists.DELETE("/:id", checklistH.DeleteChecklist)
			checklists.POST("/:id/items", checklistItemH.CreateItem)
			checklists.PUT("/:id/items", checklistItemH.SyncItems)
		}

		checklistItems := v1.Group("/checklist-items")
		{
			checklistItems.PATCH("/:id", checklistItemH.UpdateItem)
			checklistItems.DELETE("/:id", checklistItemH.DeleteItem)
		}

		comments := v1.Group("/comments")
		{
			comments.PATCH("/:id", commentH.UpdateComment)
			comments.DELETE("/:id", commentH.DeleteComment)
		}
	}

	return r
}
