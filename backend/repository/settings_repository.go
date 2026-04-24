package repository

import (
	"pinflow/model"
	"pinflow/store"
)

type SettingsRepository interface {
	Get() (*model.Settings, error)
	Update(theme, locale *string) (*model.Settings, error)
}

type settingsRepository struct {
	fs *store.FileStore
}

func newSettingsRepository(fs *store.FileStore) SettingsRepository {
	return &settingsRepository{fs: fs}
}

func (r *settingsRepository) Get() (*model.Settings, error) {
	return r.fs.GetSettings(), nil
}

func (r *settingsRepository) Update(theme, locale *string) (*model.Settings, error) {
	return r.fs.UpdateSettings(theme, locale), nil
}
