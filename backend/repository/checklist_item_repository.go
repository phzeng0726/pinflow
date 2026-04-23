package repository

import (
	"pinflow/model"
	"pinflow/store"
)

type checklistItemRepository struct {
	s *store.FileStore
}

func newChecklistItemRepository(s *store.FileStore) ChecklistItemRepository {
	return &checklistItemRepository{s: s}
}

func (r *checklistItemRepository) Create(item *model.ChecklistItem) error {
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

func (r *checklistItemRepository) FindByID(id uint) (*model.ChecklistItem, error) {
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

func (r *checklistItemRepository) MaxPositionByChecklist(checklistID uint) (float64, error) {
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

func (r *checklistItemRepository) MoveItem(itemID uint, targetChecklistID uint, position float64) error {
	cardID, ok := r.s.CardIDForChecklistItem(itemID)
	if !ok {
		return store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return err
	}

	// Verify target checklist belongs to the same card
	targetFound := false
	for _, cl := range card.Checklists {
		if cl.ID == targetChecklistID {
			targetFound = true
			break
		}
	}
	if !targetFound {
		return store.ErrNotFound
	}

	// Find and remove item from source checklist
	var item *model.ChecklistItem
	for ci, cl := range card.Checklists {
		for ii, it := range cl.Items {
			if it.ID == itemID {
				item = &model.ChecklistItem{
					ID:          it.ID,
					ChecklistID: targetChecklistID,
					Text:        it.Text,
					Completed:   it.Completed,
					Position:    position,
				}
				card.Checklists[ci].Items = append(cl.Items[:ii], cl.Items[ii+1:]...)
				break
			}
		}
		if item != nil {
			break
		}
	}
	if item == nil {
		return store.ErrNotFound
	}

	// Add item to target checklist
	for ci, cl := range card.Checklists {
		if cl.ID == targetChecklistID {
			card.Checklists[ci].Items = append(card.Checklists[ci].Items, *item)
			break
		}
	}

	return r.s.UpdateCard(card)
}

func (r *checklistItemRepository) Update(item *model.ChecklistItem) error {
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

func (r *checklistItemRepository) SyncItems(checklistID uint, items []model.ChecklistItem) ([]model.ChecklistItem, error) {
	cardID, ok := r.s.CardIDForChecklist(checklistID)
	if !ok {
		return nil, store.ErrNotFound
	}
	card, err := r.s.GetCard(cardID)
	if err != nil {
		return nil, err
	}

	for ci, cl := range card.Checklists {
		if cl.ID != checklistID {
			continue
		}

		// Build textPool: text → queue of existing items with that text
		type queue []model.ChecklistItem
		textPool := make(map[string]queue)
		for _, existing := range cl.Items {
			textPool[existing.Text] = append(textPool[existing.Text], existing)
		}

		newItems := make([]model.ChecklistItem, 0, len(items))
		for i, incoming := range items {
			var item model.ChecklistItem
			if q, found := textPool[incoming.Text]; found && len(q) > 0 {
				// Reuse existing ID
				item = q[0]
				textPool[incoming.Text] = q[1:]
			} else {
				// New item
				item.ID = r.s.NextID("checklist_item")
				item.ChecklistID = checklistID
			}
			item.Text = incoming.Text
			item.Completed = incoming.Completed
			item.Position = float64(i + 1)
			newItems = append(newItems, item)
		}

		card.Checklists[ci].Items = newItems
		if err := r.s.UpdateCard(card); err != nil {
			return nil, err
		}
		return newItems, nil
	}
	return nil, store.ErrNotFound
}

func (r *checklistItemRepository) Delete(id uint) error {
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
