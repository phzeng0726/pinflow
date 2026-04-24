package service

import (
	"pinflow/model"
	"pinflow/repository"
)

type settingsService struct {
	repo repository.SettingsRepository
}

func newSettingsService(repo repository.SettingsRepository) SettingsService {
	return &settingsService{repo: repo}
}

func (s *settingsService) GetSettings() (*model.Settings, error) {
	return s.repo.Get()
}

func (s *settingsService) UpdateSettings(theme, locale *string) (*model.Settings, error) {
	return s.repo.Update(theme, locale)
}
