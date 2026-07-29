package store

import (
	"pinflow/model"
)

// Internal: index management
// ============================================================

func (s *FileStore) buildChecklistIndex(card *CardFile) {
	for _, cl := range card.Checklists {
		s.checklistToCard[cl.ID] = card.ID
		for _, item := range cl.Items {
			s.itemToChecklist[item.ID] = cl.ID
		}
	}
	for _, c := range card.Comments {
		s.commentToCard[c.ID] = card.ID
	}
}

func (s *FileStore) clearChecklistIndex(card *CardFile) {
	for _, cl := range card.Checklists {
		delete(s.checklistToCard, cl.ID)
		for _, item := range cl.Items {
			delete(s.itemToChecklist, item.ID)
		}
	}
	for _, c := range card.Comments {
		delete(s.commentToCard, c.ID)
	}
}

// ============================================================
// Utility functions
// ============================================================

func removeFromSlice(slice []uint, val uint) []uint {
	for i, v := range slice {
		if v == val {
			return append(slice[:i], slice[i+1:]...)
		}
	}
	return slice
}

func removeFromSliceWithFlag(slice []uint, val uint) ([]uint, bool) {
	for i, v := range slice {
		if v == val {
			return append(slice[:i], slice[i+1:]...), true
		}
	}
	return slice, false
}

func initCardSlices(c *CardFile) {
	if c.TagIDs == nil {
		c.TagIDs = []uint{}
	}
	if c.Checklists == nil {
		c.Checklists = []model.Checklist{}
	}
	for i := range c.Checklists {
		if c.Checklists[i].Items == nil {
			c.Checklists[i].Items = []model.ChecklistItem{}
		}
	}
	if c.Comments == nil {
		c.Comments = []model.Comment{}
	}
}

func copyCard(c *CardFile) *CardFile {
	cp := *c
	if c.ArchivedAt != nil {
		t := *c.ArchivedAt
		cp.ArchivedAt = &t
	}
	cp.TagIDs = make([]uint, len(c.TagIDs))
	copy(cp.TagIDs, c.TagIDs)
	cp.Checklists = make([]model.Checklist, len(c.Checklists))
	for i, cl := range c.Checklists {
		cp.Checklists[i] = cl
		cp.Checklists[i].Items = make([]model.ChecklistItem, len(cl.Items))
		copy(cp.Checklists[i].Items, cl.Items)
	}
	cp.Comments = make([]model.Comment, len(c.Comments))
	copy(cp.Comments, c.Comments)
	return &cp
}
