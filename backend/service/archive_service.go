package service

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"pinflow/dto"
	"pinflow/repository"
	"pinflow/store"
)

type archiveService struct {
	cardRepo   repository.CardRepository
	columnRepo repository.ColumnRepository
	store      *store.FileStore
	imageSvc   ImageService
}

func newArchiveService(
	cardRepo repository.CardRepository,
	columnRepo repository.ColumnRepository,
	s *store.FileStore,
	imageSvc ImageService,
) ArchiveService {
	return &archiveService{
		cardRepo:   cardRepo,
		columnRepo: columnRepo,
		store:      s,
		imageSvc:   imageSvc,
	}
}

func (s *archiveService) ArchiveCard(id uint) error {
	card, err := s.cardRepo.FindByID(id)
	if err != nil {
		return err
	}
	if card.ArchivedAt != nil {
		return errors.New("card is already archived")
	}
	return s.cardRepo.ArchiveCard(id)
}

func (s *archiveService) ArchiveColumn(id uint) error {
	col, err := s.columnRepo.FindByID(id)
	if err != nil {
		return err
	}
	if col.ArchivedAt != nil {
		return errors.New("column is already archived")
	}
	return s.columnRepo.ArchiveColumn(id)
}

func (s *archiveService) ArchiveAllCardsInColumn(columnID uint) error {
	cards, err := s.cardRepo.FindByColumnID(columnID)
	if err != nil {
		return err
	}
	for _, card := range cards {
		if err := s.cardRepo.ArchiveCard(card.ID); err != nil {
			return fmt.Errorf("archive card %d: %w", card.ID, err)
		}
	}
	return nil
}

func (s *archiveService) RestoreCard(id uint) error {
	cf, err := s.store.GetCard(id)
	if err != nil {
		return store.ErrNotFound
	}
	if cf.ArchivedAt == nil {
		return errors.New("card is not archived")
	}

	// Determine position: top of column (min position - 1024, or 1024 if empty)
	cards, err := s.cardRepo.FindByColumnID(cf.ColumnID)
	if err != nil {
		return err
	}
	var position float64 = 1024.0
	if len(cards) > 0 {
		minPos := cards[0].Position
		for _, c := range cards[1:] {
			if c.Position < minPos {
				minPos = c.Position
			}
		}
		position = minPos - 1024.0
	}

	return s.cardRepo.RestoreCard(id, position)
}

func (s *archiveService) RestoreColumn(id uint) error {
	col, err := s.store.GetColumnIncludingArchived(id)
	if err != nil {
		return store.ErrNotFound
	}
	if col.ArchivedAt == nil {
		return errors.New("column is not archived")
	}

	// Place at right end of board
	cols, err := s.columnRepo.FindArchivedByBoardID(col.BoardID)
	if err != nil {
		return err
	}
	activeCols, err := s.columnRepo.FindByBoardID(col.BoardID)
	if err != nil {
		return err
	}
	allCols := append(activeCols, cols...)
	var maxPos float64
	for _, c := range allCols {
		if c.ArchivedAt == nil && c.Position > maxPos {
			maxPos = c.Position
		}
	}
	// Use only active columns for max position
	maxPos = 0
	for _, c := range activeCols {
		if c.Position > maxPos {
			maxPos = c.Position
		}
	}

	return s.columnRepo.RestoreColumn(id, maxPos+1024.0)
}

func (s *archiveService) DeleteArchivedCard(id uint) error {
	cf, err := s.store.GetCard(id)
	if err != nil {
		return store.ErrNotFound
	}
	if cf.ArchivedAt == nil {
		return errors.New("card is not archived")
	}

	// Cleanup images from description and comments
	if s.imageSvc != nil {
		detail, err := s.cardRepo.FindDetail(id)
		if err == nil {
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

func (s *archiveService) DeleteArchivedColumn(id uint) error {
	col, err := s.store.GetColumnIncludingArchived(id)
	if err != nil {
		return store.ErrNotFound
	}
	if col.ArchivedAt == nil {
		return errors.New("column is not archived")
	}
	return s.columnRepo.Delete(id)
}

func (s *archiveService) GetArchivedCards(boardID uint) ([]dto.ArchivedCardResponse, error) {
	cards, err := s.cardRepo.FindArchivedByBoardID(boardID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.ArchivedCardResponse, 0, len(cards))
	for _, card := range cards {
		if card.ArchivedAt == nil {
			continue
		}
		col, err := s.store.GetColumnIncludingArchived(card.ColumnID)
		columnName := ""
		columnArchived := false
		if err == nil {
			columnName = col.Name
			columnArchived = col.ArchivedAt != nil
		}
		result = append(result, dto.ArchivedCardResponse{
			ID:             card.ID,
			Title:          card.Title,
			ColumnID:       card.ColumnID,
			ColumnName:     columnName,
			ColumnArchived: columnArchived,
			ArchivedAt:     *card.ArchivedAt,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].ArchivedAt.After(result[j].ArchivedAt)
	})

	return result, nil
}

func (s *archiveService) GetArchivedColumns(boardID uint) ([]dto.ArchivedColumnResponse, error) {
	cols, err := s.columnRepo.FindArchivedByBoardID(boardID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.ArchivedColumnResponse, 0, len(cols))
	for _, col := range cols {
		if col.ArchivedAt == nil {
			continue
		}
		allCards := s.store.GetAllCardsByColumn(col.ID)
		result = append(result, dto.ArchivedColumnResponse{
			ID:         col.ID,
			Name:       col.Name,
			CardCount:  len(allCards),
			ArchivedAt: *col.ArchivedAt,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].ArchivedAt.After(result[j].ArchivedAt)
	})

	return result, nil
}
