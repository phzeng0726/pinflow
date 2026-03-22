package repository

import (
	"pinflow/model"
	"pinflow/store"
)

type fileChecklistItemRepository struct {
	s *store.FileStore
}

func NewFileChecklistItemRepository(s *store.FileStore) ChecklistItemRepository {
	return &fileChecklistItemRepository{s: s}
}

func (r *fileChecklistItemRepository) Create(item *model.ChecklistItem) error {
	item.ID = r.s.NextID("checklist_item")

	cardID, ok := r.s.CardIDForChecklist(item.ChecklistID)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for i, cl := range card.Checklists {
		if cl.ID == item.ChecklistID {
			card.Checklists[i].Items = append(card.Checklists[i].Items, *item)
			return r.s.UpdateCard(card)
		}
	}
	return store.ErrNotFound
}

func (r *fileChecklistItemRepository) FindByID(id uint) (*model.ChecklistItem, error) {
	cardID, ok := r.s.CardIDForChecklistItem(id)
	if !ok {
		return nil, store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return nil, err
	}
	for _, cl := range card.Checklists {
		for _, item := range cl.Items {
			if item.ID == id {
				return &item, nil
			}
		}
	}
	return nil, store.ErrNotFound
}

func (r *fileChecklistItemRepository) MaxPositionByChecklist(checklistID uint) (float64, error) {
	cardID, ok := r.s.CardIDForChecklist(checklistID)
	if !ok {
		return 0, store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return 0, err
	}
	for _, cl := range card.Checklists {
		if cl.ID == checklistID {
			var max float64
			for _, item := range cl.Items {
				if item.Position > max {
					max = item.Position
				}
			}
			return max, nil
		}
	}
	return 0, store.ErrNotFound
}

func (r *fileChecklistItemRepository) Update(item *model.ChecklistItem) error {
	cardID, ok := r.s.CardIDForChecklistItem(item.ID)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for ci, cl := range card.Checklists {
		for ii, existing := range cl.Items {
			if existing.ID == item.ID {
				item.ChecklistID = existing.ChecklistID
				card.Checklists[ci].Items[ii] = *item
				return r.s.UpdateCard(card)
			}
		}
	}
	return store.ErrNotFound
}

func (r *fileChecklistItemRepository) Delete(id uint) error {
	cardID, ok := r.s.CardIDForChecklistItem(id)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}
	for ci, cl := range card.Checklists {
		for ii, item := range cl.Items {
			if item.ID == id {
				card.Checklists[ci].Items = append(cl.Items[:ii], cl.Items[ii+1:]...)
				return r.s.UpdateCard(card)
			}
		}
	}
	return store.ErrNotFound
}
