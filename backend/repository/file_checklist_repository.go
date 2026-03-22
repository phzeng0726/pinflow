package repository

import (
	"sort"

	"pinflow/model"
	"pinflow/store"
)

type fileChecklistRepository struct {
	s *store.FileStore
}

func NewFileChecklistRepository(s *store.FileStore) ChecklistRepository {
	return &fileChecklistRepository{s: s}
}

func (r *fileChecklistRepository) Create(checklist *model.Checklist) error {
	checklist.ID = r.s.NextID("checklist")
	if checklist.Items == nil {
		checklist.Items = []model.ChecklistItem{}
	}

	card, err := r.s.GetCard(checklist.CardID)
	if err != nil {
		return err
	}
	card.Checklists = append(card.Checklists, *checklist)
	return r.s.UpdateCard(card)
}

func (r *fileChecklistRepository) FindByID(id uint) (*model.Checklist, error) {
	cardID, ok := r.s.CardIDForChecklist(id)
	if !ok {
		return nil, store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return nil, err
	}
	for _, cl := range card.Checklists {
		if cl.ID == id {
			items := make([]model.ChecklistItem, len(cl.Items))
			copy(items, cl.Items)
			cl.Items = items
			return &cl, nil
		}
	}
	return nil, store.ErrNotFound
}

func (r *fileChecklistRepository) ListByCard(cardID uint) ([]model.Checklist, error) {
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return nil, err
	}

	result := make([]model.Checklist, len(card.Checklists))
	copy(result, card.Checklists)

	// Sort checklists by position, items by position
	sort.Slice(result, func(i, j int) bool { return result[i].Position < result[j].Position })
	for i := range result {
		items := make([]model.ChecklistItem, len(result[i].Items))
		copy(items, result[i].Items)
		sort.Slice(items, func(a, b int) bool { return items[a].Position < items[b].Position })
		result[i].Items = items
	}
	return result, nil
}

func (r *fileChecklistRepository) MaxPositionByCard(cardID uint) (float64, error) {
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return 0, err
	}
	var max float64
	for _, cl := range card.Checklists {
		if cl.Position > max {
			max = cl.Position
		}
	}
	return max, nil
}

func (r *fileChecklistRepository) Update(checklist *model.Checklist) error {
	cardID, ok := r.s.CardIDForChecklist(checklist.ID)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for i, cl := range card.Checklists {
		if cl.ID == checklist.ID {
			// Preserve items, update metadata
			checklist.Items = cl.Items
			checklist.CardID = cl.CardID
			card.Checklists[i] = *checklist
			return r.s.UpdateCard(card)
		}
	}
	return store.ErrNotFound
}

func (r *fileChecklistRepository) Delete(id uint) error {
	cardID, ok := r.s.CardIDForChecklist(id)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for i, cl := range card.Checklists {
		if cl.ID == id {
			card.Checklists = append(card.Checklists[:i], card.Checklists[i+1:]...)
			return r.s.UpdateCard(card)
		}
	}
	return store.ErrNotFound
}
