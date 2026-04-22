package repository

import (
	"time"

	"pinflow/model"
	"pinflow/store"
)

type cardRepository struct {
	s *store.FileStore
}

func newCardRepository(s *store.FileStore) CardRepository {
	return &cardRepository{s: s}
}

func (r *cardRepository) Create(card *model.Card) error {
	card.ID = r.s.NextID("card")
	now := time.Now()
	card.CreatedAt = now
	card.UpdatedAt = now

	cf := modelToCardFile(card)
	return r.s.CreateCard(cf)
}

func (r *cardRepository) FindByID(id uint) (*model.Card, error) {
	cf, err := r.s.GetCard(id)
	if err != nil {
		return nil, err
	}
	// Plain fetch without relations (matches GORM First behavior)
	card := &model.Card{
		ID:          cf.ID,
		ColumnID:    cf.ColumnID,
		Title:       cf.Title,
		Description: cf.Description,
		Position:    cf.Position,
		IsPinned:    cf.IsPinned,
		StoryPoint:  cf.StoryPoint,
		Priority:    cf.Priority,
		StartTime:   cf.StartTime,
		EndTime:     cf.EndTime,
		CreatedAt:   cf.CreatedAt,
		UpdatedAt:   cf.UpdatedAt,
	}
	return card, nil
}

func (r *cardRepository) FindDetail(id uint) (*model.Card, error) {
	cf, err := r.s.GetCard(id)
	if err != nil {
		return nil, err
	}
	card := cardFileToModel(cf, r.s)
	return &card, nil
}

func (r *cardRepository) FindByColumnID(columnID uint) ([]model.Card, error) {
	cfs := r.s.GetCardsByColumn(columnID)
	cards := make([]model.Card, 0, len(cfs))
	for _, cf := range cfs {
		cards = append(cards, model.Card{
			ID:          cf.ID,
			ColumnID:    cf.ColumnID,
			Title:       cf.Title,
			Description: cf.Description,
			Position:    cf.Position,
			IsPinned:    cf.IsPinned,
			StoryPoint:  cf.StoryPoint,
			Priority:    cf.Priority,
			StartTime:   cf.StartTime,
			EndTime:     cf.EndTime,
			CreatedAt:   cf.CreatedAt,
			UpdatedAt:   cf.UpdatedAt,
		})
	}
	return cards, nil
}

func (r *cardRepository) MaxPositionByColumn(columnID uint) (float64, error) {
	cfs := r.s.GetCardsByColumn(columnID)
	var max float64
	for _, cf := range cfs {
		if cf.Position > max {
			max = cf.Position
		}
	}
	return max, nil
}

func (r *cardRepository) Update(card *model.Card) error {
	card.UpdatedAt = time.Now()

	// Preserve existing tag_ids and checklists from the stored card
	existing, err := r.s.GetCard(card.ID)
	if err != nil {
		return err
	}

	cf := &store.CardFile{
		ID:          card.ID,
		ColumnID:    card.ColumnID,
		Title:       card.Title,
		Description: card.Description,
		Position:    card.Position,
		IsPinned:    card.IsPinned,
		StoryPoint:  card.StoryPoint,
		Priority:    card.Priority,
		StartTime:   card.StartTime,
		EndTime:     card.EndTime,
		TagIDs:      existing.TagIDs,
		Checklists:  existing.Checklists,
		Comments:    existing.Comments,
		CreatedAt:   card.CreatedAt,
		UpdatedAt:   card.UpdatedAt,
	}
	return r.s.UpdateCard(cf)
}

func (r *cardRepository) UpdateColumnAndPosition(id uint, columnID uint, position float64, isPinned bool) error {
	cf, err := r.s.GetCard(id)
	if err != nil {
		return err
	}
	cf.ColumnID = columnID
	cf.Position = position
	cf.IsPinned = isPinned
	cf.UpdatedAt = time.Now()
	return r.s.UpdateCard(cf)
}

func (r *cardRepository) UpdatePinned(id uint, isPinned bool) error {
	cf, err := r.s.GetCard(id)
	if err != nil {
		return err
	}
	cf.IsPinned = isPinned
	cf.UpdatedAt = time.Now()
	return r.s.UpdateCard(cf)
}

func (r *cardRepository) FindPinned() ([]model.Card, error) {
	cfs := r.s.GetPinnedCards()
	cards := make([]model.Card, 0, len(cfs))
	for _, cf := range cfs {
		cards = append(cards, model.Card{
			ID:          cf.ID,
			ColumnID:    cf.ColumnID,
			Title:       cf.Title,
			Description: cf.Description,
			Position:    cf.Position,
			IsPinned:    cf.IsPinned,
			StoryPoint:  cf.StoryPoint,
			Priority:    cf.Priority,
			StartTime:   cf.StartTime,
			EndTime:     cf.EndTime,
			CreatedAt:   cf.CreatedAt,
			UpdatedAt:   cf.UpdatedAt,
		})
	}
	return cards, nil
}

func (r *cardRepository) Search(query string, limit int) ([]model.Card, error) {
	cfs := r.s.SearchCards(query, limit)
	cards := make([]model.Card, 0, len(cfs))
	for _, cf := range cfs {
		cards = append(cards, model.Card{
			ID:          cf.ID,
			ColumnID:    cf.ColumnID,
			Title:       cf.Title,
			Description: cf.Description,
			Position:    cf.Position,
			IsPinned:    cf.IsPinned,
			StoryPoint:  cf.StoryPoint,
			Priority:    cf.Priority,
			StartTime:   cf.StartTime,
			EndTime:     cf.EndTime,
			CreatedAt:   cf.CreatedAt,
			UpdatedAt:   cf.UpdatedAt,
		})
	}
	return cards, nil
}

func (r *cardRepository) Delete(id uint) error {
	return r.s.DeleteCard(id)
}
