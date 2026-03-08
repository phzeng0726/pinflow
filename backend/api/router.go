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
	BoardH  *BoardHandler
	ColumnH *ColumnHandler
	CardH   *CardHandler
}

func NewRouter(boardH *BoardHandler, columnH *ColumnHandler, cardH *CardHandler) *gin.Engine {
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
			cards.PATCH("/:id", cardH.UpdateCard)
			cards.PATCH("/:id/move", cardH.MoveCard)
			cards.PATCH("/:id/pin", cardH.TogglePin)
			cards.DELETE("/:id", cardH.DeleteCard)
		}
	}

	return r
}
