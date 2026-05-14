package middleware

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"pinflow/service"
	"pinflow/store"
)

type boardIDSource int

const (
	boardIDFromPath          boardIDSource = iota // path param "id" is boardID
	boardIDFromCard                               // path param "id" is cardID
	boardIDFromColumn                             // path param "id" is columnID
	boardIDFromChecklist                          // path param "id" is checklistID
	boardIDFromChecklistItem                      // path param "id" is checklistItemID
	boardIDFromComment                            // path param "id" is commentID
	boardIDFromDependency                         // path param "id" is dependencyID
)

type snapshotMode int

const (
	modeSync     snapshotMode = iota // snapshot BEFORE handler (for deletes)
	modeDebounce                     // snapshot AFTER handler, async, with debounce (for creates/updates)
)

type mutationRule struct {
	Method      string
	PathPattern string
	Trigger     string
	Mode        snapshotMode
	BoardIDFrom boardIDSource
}

// mutationRules maps mutation routes to their snapshot trigger configuration.
var mutationRules = []mutationRule{
	// Column operations
	{http.MethodPost, "/api/v1/boards/:id/columns", "create_column", modeDebounce, boardIDFromPath},
	{http.MethodPatch, "/api/v1/columns/:id", "update_column", modeDebounce, boardIDFromColumn},
	{http.MethodDelete, "/api/v1/columns/:id", "delete_column", modeSync, boardIDFromColumn},

	// Card operations
	{http.MethodPost, "/api/v1/columns/:id/cards", "create_card", modeDebounce, boardIDFromColumn},
	{http.MethodPatch, "/api/v1/cards/:id", "update_card", modeDebounce, boardIDFromCard},
	{http.MethodPatch, "/api/v1/cards/:id/move", "move_card", modeDebounce, boardIDFromCard},
	{http.MethodPatch, "/api/v1/cards/:id/pin", "pin_card", modeDebounce, boardIDFromCard},
	{http.MethodPatch, "/api/v1/cards/:id/schedule", "schedule_card", modeDebounce, boardIDFromCard},
	{http.MethodDelete, "/api/v1/cards/:id", "delete_card", modeSync, boardIDFromCard},
	{http.MethodPost, "/api/v1/cards/:id/duplicate", "duplicate_card", modeDebounce, boardIDFromCard},

	// Tag operations on cards
	{http.MethodPost, "/api/v1/cards/:id/tags", "attach_tag", modeDebounce, boardIDFromCard},
	{http.MethodDelete, "/api/v1/cards/:id/tags/:tagId", "detach_tag", modeDebounce, boardIDFromCard},

	// Checklist operations
	{http.MethodPost, "/api/v1/cards/:id/checklists", "create_checklist", modeDebounce, boardIDFromCard},
	{http.MethodPatch, "/api/v1/checklists/:id", "update_checklist", modeDebounce, boardIDFromChecklist},
	{http.MethodDelete, "/api/v1/checklists/:id", "delete_checklist", modeSync, boardIDFromChecklist},
	{http.MethodPost, "/api/v1/checklists/:id/items", "create_checklist_item", modeDebounce, boardIDFromChecklist},
	{http.MethodPut, "/api/v1/checklists/:id/items", "sync_checklist_items", modeDebounce, boardIDFromChecklist},
	{http.MethodPatch, "/api/v1/checklist-items/:id", "update_checklist_item", modeDebounce, boardIDFromChecklistItem},
	{http.MethodPatch, "/api/v1/checklist-items/:id/move", "move_checklist_item", modeDebounce, boardIDFromChecklistItem},
	{http.MethodDelete, "/api/v1/checklist-items/:id", "delete_checklist_item", modeSync, boardIDFromChecklistItem},

	// Comment operations
	{http.MethodPost, "/api/v1/cards/:id/comments", "create_comment", modeDebounce, boardIDFromCard},
	{http.MethodPatch, "/api/v1/comments/:id", "update_comment", modeDebounce, boardIDFromComment},
	{http.MethodDelete, "/api/v1/comments/:id", "delete_comment", modeSync, boardIDFromComment},

	// Dependency operations
	{http.MethodPost, "/api/v1/cards/:id/dependencies", "create_dependency", modeDebounce, boardIDFromCard},
	{http.MethodDelete, "/api/v1/dependencies/:id", "delete_dependency", modeSync, boardIDFromDependency},

	// Archive operations
	{http.MethodPatch, "/api/v1/cards/:id/archive", "archive_card", modeDebounce, boardIDFromCard},
	{http.MethodPatch, "/api/v1/cards/:id/restore", "restore_card", modeDebounce, boardIDFromCard},
	{http.MethodDelete, "/api/v1/cards/:id/archive", "delete_archived_card", modeSync, boardIDFromCard},
	{http.MethodPatch, "/api/v1/columns/:id/archive", "archive_column", modeDebounce, boardIDFromColumn},
	{http.MethodPatch, "/api/v1/columns/:id/archive-cards", "archive_column_cards", modeDebounce, boardIDFromColumn},
	{http.MethodPatch, "/api/v1/columns/:id/restore", "restore_column", modeDebounce, boardIDFromColumn},
	{http.MethodDelete, "/api/v1/columns/:id/archive", "delete_archived_column", modeSync, boardIDFromColumn},
}

// Snapshot returns a Gin middleware that auto-triggers board snapshots based on mutation rules.
func Snapshot(svc service.SnapshotService, fs *store.FileStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		rule := findRule(c.FullPath(), c.Request.Method)
		if rule == nil {
			c.Next()
			return
		}

		boardID, ok := resolveBoardID(c, rule.BoardIDFrom, fs)
		if !ok {
			c.Next()
			return
		}

		if rule.Mode == modeSync {
			// Create snapshot BEFORE handler executes; force=true bypasses debounce for destructive ops.
			if _, err := svc.CreateSnapshot(boardID, "", false, rule.Trigger, true); err != nil {
				log.Printf("snapshot middleware: pre-mutation snapshot failed (board=%d trigger=%s): %v", boardID, rule.Trigger, err)
				// fail-open: don't block the mutation
			}
			c.Next()
			return
		}

		// modeDebounce: create snapshot AFTER handler, only on 2xx
		// Run synchronously: snapshot is fast file I/O and desktop app can absorb the latency.
		c.Next()
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			if _, err := svc.CreateSnapshot(boardID, "", false, rule.Trigger, false); err != nil {
				log.Printf("snapshot middleware: post-mutation snapshot failed (board=%d trigger=%s): %v", boardID, rule.Trigger, err)
			}
		}
	}
}

func findRule(fullPath, method string) *mutationRule {
	for i := range mutationRules {
		if mutationRules[i].Method == method && mutationRules[i].PathPattern == fullPath {
			return &mutationRules[i]
		}
	}
	return nil
}

func resolveBoardID(c *gin.Context, from boardIDSource, fs *store.FileStore) (uint, bool) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, false
	}
	entityID := uint(id)

	switch from {
	case boardIDFromPath:
		return entityID, true
	case boardIDFromCard:
		return fs.BoardIDOfCard(entityID)
	case boardIDFromColumn:
		return fs.BoardIDOfColumn(entityID)
	case boardIDFromChecklist:
		return fs.BoardIDOfChecklist(entityID)
	case boardIDFromChecklistItem:
		return fs.BoardIDOfChecklistItem(entityID)
	case boardIDFromComment:
		return fs.BoardIDOfComment(entityID)
	case boardIDFromDependency:
		return fs.BoardIDOfDependency(entityID)
	}
	return 0, false
}
