package service

import (
	"errors"
	"time"

	"pinflow/dto"
	"pinflow/model"
	"pinflow/repository"
	"strings"
)

type cardService struct {
	cardRepo          repository.CardRepository
	columnRepo        repository.ColumnRepository
	boardRepo         repository.BoardRepository
	tagRepo           repository.TagRepository
	checklistRepo     repository.ChecklistRepository
	checklistItemRepo repository.ChecklistItemRepository
	depRepo           repository.DependencyRepository
	imageSvc          ImageService
}

func newCardService(
	cardRepo repository.CardRepository,
	columnRepo repository.ColumnRepository,
	boardRepo repository.BoardRepository,
	tagRepo repository.TagRepository,
	checklistRepo repository.ChecklistRepository,
	checklistItemRepo repository.ChecklistItemRepository,
	depRepo repository.DependencyRepository,
	imageSvc ImageService,
) CardService {
	return &cardService{
		cardRepo:          cardRepo,
		columnRepo:        columnRepo,
		boardRepo:         boardRepo,
		tagRepo:           tagRepo,
		checklistRepo:     checklistRepo,
		checklistItemRepo: checklistItemRepo,
		depRepo:           depRepo,
		imageSvc:          imageSvc,
	}
}

func (s *cardService) CreateCard(columnID uint, title, description string) (*model.Card, error) {
	if strings.TrimSpace(title) == "" {
		return nil, errors.New("card title is required")
	}
	col, err := s.columnRepo.FindByID(columnID)
	if err != nil {
		return nil, err
	}
	maxPos, err := s.cardRepo.MaxPositionByColumn(columnID)
	if err != nil {
		return nil, err
	}
	card := &model.Card{
		ColumnID:    columnID,
		Title:       strings.TrimSpace(title),
		Description: description,
		Position:    maxPos + 1.0,
		IsPinned:    col.AutoPin,
	}
	if err := s.cardRepo.Create(card); err != nil {
		return nil, err
	}
	return card, nil
}

func (s *cardService) GetCardDetail(id uint) (*dto.CardResponse, error) {
	card, err := s.cardRepo.FindDetail(id)
	if err != nil {
		return nil, err
	}
	resp := ToCardResponse(card)
	if s.depRepo != nil {
		if count, err := s.depRepo.CountByCard(id); err == nil {
			resp.DependencyCount = count
		}
	}
	return &resp, nil
}

func (s *cardService) UpdateCard(id uint, title, description *string, storyPoint *int, priority *int, startTime, endTime *time.Time) (*model.Card, error) {
	if title != nil && strings.TrimSpace(*title) == "" {
		return nil, errors.New("card title is required")
	}
	if storyPoint != nil && *storyPoint < 0 {
		return nil, errors.New("storyPoint must be a positive integer")
	}
	if priority != nil && *priority != 0 && (*priority < 1 || *priority > 5) {
		return nil, errors.New("priority must be between 1 and 5")
	}
	if startTime != nil && endTime != nil && endTime.Before(*startTime) {
		return nil, errors.New("endTime must be after startTime")
	}
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if title != nil {
		card.Title = strings.TrimSpace(*title)
	}
	if description != nil {
		card.Description = *description
	}
	if storyPoint != nil {
		if *storyPoint == 0 {
			card.StoryPoint = nil // 0 = 清除
		} else {
			card.StoryPoint = storyPoint
		}
	}
	if priority != nil {
		if *priority == 0 {
			card.Priority = nil // 0 = 清除
		} else {
			card.Priority = priority
		}
	}
	if startTime != nil || endTime != nil {
		card.StartTime = startTime
		card.EndTime = endTime
	}
	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}
	if description != nil && s.imageSvc != nil {
		s.imageSvc.ReconcileBoardImages(card.ID)
	}
	return card, nil
}

func (s *cardService) UpdateSchedule(id uint, startTime, endTime *time.Time) (*model.Card, error) {
	if startTime != nil && endTime != nil && endTime.Before(*startTime) {
		return nil, errors.New("endTime must be after startTime")
	}
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	card.StartTime = startTime
	card.EndTime = endTime
	if err := s.cardRepo.Update(card); err != nil {
		return nil, err
	}
	return card, nil
}

func ToCardResponse(card *model.Card) dto.CardResponse {
	tags := make([]dto.TagResponse, len(card.Tags))
	for i, t := range card.Tags {
		tags[i] = dto.TagResponse{ID: t.ID, Name: t.Name, Color: t.Color}
	}
	checklists := make([]dto.ChecklistResponse, len(card.Checklists))
	for i, cl := range card.Checklists {
		items := make([]dto.ChecklistItemResponse, len(cl.Items))
		completedCount := 0
		for j, item := range cl.Items {
			items[j] = dto.ChecklistItemResponse{
				ID:          item.ID,
				ChecklistID: item.ChecklistID,
				Text:        item.Text,
				Completed:   item.Completed,
				Position:    item.Position,
			}
			if item.Completed {
				completedCount++
			}
		}
		checklists[i] = dto.ChecklistResponse{
			ID:             cl.ID,
			CardID:         cl.CardID,
			Title:          cl.Title,
			Position:       cl.Position,
			Items:          items,
			CompletedCount: completedCount,
			TotalCount:     len(cl.Items),
		}
	}
	comments := make([]dto.CommentResponse, len(card.Comments))
	for i, c := range card.Comments {
		comments[i] = dto.CommentResponse{
			ID:        c.ID,
			CardID:    c.CardID,
			Text:      c.Text,
			AuthorID:  c.AuthorID,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		}
	}
	return dto.CardResponse{
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
		Tags:        tags,
		Checklists:  checklists,
		Comments:    comments,
		CreatedAt:   card.CreatedAt,
		UpdatedAt:   card.UpdatedAt,
	}
}

func (s *cardService) MoveCard(id uint, columnID uint, position float64) (*model.Card, error) {
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	col, err := s.columnRepo.FindByID(columnID)
	if err != nil {
		return nil, err
	}
	isPinned := card.IsPinned
	if col.AutoPin {
		isPinned = true
	}
	if err := s.cardRepo.UpdateColumnAndPosition(id, columnID, position, isPinned); err != nil {
		return nil, err
	}
	card.ColumnID = columnID
	card.Position = position
	card.IsPinned = isPinned
	return card, nil
}

func (s *cardService) TogglePin(id uint) (*model.Card, error) {
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	newPinned := !card.IsPinned
	if err := s.cardRepo.UpdatePinned(id, newPinned); err != nil {
		return nil, err
	}
	card.IsPinned = newPinned
	return card, nil
}

func (s *cardService) GetPinnedCards() ([]dto.PinnedCardResponse, error) {
	cards, err := s.cardRepo.FindPinned()
	if err != nil {
		return nil, err
	}
	result := make([]dto.PinnedCardResponse, 0, len(cards))
	for _, c := range cards {
		detail, err := s.cardRepo.FindDetail(c.ID)
		if err != nil {
			continue
		}
		colName := ""
		var boardID uint
		boardName := ""
		if col, err := s.columnRepo.FindByID(c.ColumnID); err == nil {
			colName = col.Name
			boardID = col.BoardID
			if board, err := s.boardRepo.FindByID(boardID); err == nil {
				boardName = board.Name
			}
		}
		tags := make([]dto.TagResponse, len(detail.Tags))
		for i, t := range detail.Tags {
			tags[i] = dto.TagResponse{ID: t.ID, Name: t.Name, Color: t.Color}
		}
		var totalCount, completedCount int
		for _, cl := range detail.Checklists {
			totalCount += len(cl.Items)
			for _, item := range cl.Items {
				if item.Completed {
					completedCount++
				}
			}
		}
		depCount := 0
		if s.depRepo != nil {
			if count, err := s.depRepo.CountByCard(c.ID); err == nil {
				depCount = count
			}
		}
		result = append(result, dto.PinnedCardResponse{
			ID:          c.ID,
			Title:       c.Title,
			Description: c.Description,
			BoardID:     boardID,
			BoardName:   boardName,
			ColumnID:    c.ColumnID,
			ColumnName:  colName,
			Priority:    c.Priority,
			StoryPoint:  c.StoryPoint,
			StartTime:   c.StartTime,
			EndTime:     c.EndTime,
			Tags:        tags,
			ChecklistSummary: dto.ChecklistSummary{
				TotalCount:     totalCount,
				CompletedCount: completedCount,
			},
			DependencyCount: depCount,
		})
	}
	return result, nil
}

func (s *cardService) Search(query string, limit int) ([]dto.CardSearchResult, error) {
	cards, err := s.cardRepo.Search(query, limit)
	if err != nil {
		return nil, err
	}
	result := make([]dto.CardSearchResult, 0, len(cards))
	for _, card := range cards {
		col, err := s.columnRepo.FindByID(card.ColumnID)
		if err != nil {
			continue
		}
		boardName := ""
		if board, err := s.boardRepo.FindByID(col.BoardID); err == nil {
			boardName = board.Name
		}
		result = append(result, dto.CardSearchResult{
			ID:         card.ID,
			Title:      card.Title,
			BoardID:    col.BoardID,
			BoardName:  boardName,
			ColumnID:   col.ID,
			ColumnName: col.Name,
		})
	}
	return result, nil
}

func (s *cardService) DeleteCard(id uint) error {
	if s.imageSvc != nil {
		if detail, err := s.cardRepo.FindDetail(id); err == nil {
			var combined strings.Builder
			combined.WriteString(detail.Description)
			for _, c := range detail.Comments {
				combined.WriteString("\n")
				combined.WriteString(c.Text)
			}
			s.imageSvc.CleanupImages(combined.String())
		}
	}
	return s.cardRepo.Delete(id)
}

func (s *cardService) DuplicateCard(id uint, req dto.DuplicateCardRequest) (*dto.CardResponse, error) {
	src, err := s.cardRepo.FindDetail(id)
	if err != nil {
		return nil, err
	}

	// Calculate position in target column
	targetCards, err := s.cardRepo.FindByColumnID(req.TargetColumnID)
	if err != nil {
		return nil, err
	}
	var position float64
	if req.Position <= 0 || req.Position > len(targetCards) {
		// Append to end
		if len(targetCards) == 0 {
			position = 1.0
		} else {
			position = targetCards[len(targetCards)-1].Position + 1.0
		}
	} else {
		// Insert at 1-based index
		var before float64
		if req.Position > 1 {
			before = targetCards[req.Position-2].Position
		}
		after := targetCards[req.Position-1].Position
		position = (before + after) / 2.0
	}

	newCard := &model.Card{
		ColumnID:    req.TargetColumnID,
		Title:       strings.TrimSpace(req.Title),
		Description: src.Description,
		Position:    position,
		IsPinned:    req.Pin,
	}
	if req.CopySchedule {
		newCard.StartTime = src.StartTime
		newCard.EndTime = src.EndTime
	}
	if err := s.cardRepo.Create(newCard); err != nil {
		return nil, err
	}

	if req.CopyTags {
		for _, tag := range src.Tags {
			if err := s.tagRepo.AttachToCard(newCard.ID, tag.ID); err != nil {
				return nil, err
			}
		}
	}

	if req.CopyChecklists {
		for _, cl := range src.Checklists {
			newCL := &model.Checklist{
				CardID: newCard.ID,
				Title:  cl.Title,
			}
			if err := s.checklistRepo.Create(newCL); err != nil {
				return nil, err
			}
			for _, item := range cl.Items {
				newItem := &model.ChecklistItem{
					ChecklistID: newCL.ID,
					Text:        item.Text,
					Completed:   false,
					Position:    item.Position,
				}
				if err := s.checklistItemRepo.Create(newItem); err != nil {
					return nil, err
				}
			}
		}
	}

	detail, err := s.cardRepo.FindDetail(newCard.ID)
	if err != nil {
		return nil, err
	}
	resp := ToCardResponse(detail)
	return &resp, nil
}
