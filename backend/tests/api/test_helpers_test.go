package api_test

import (
	"testing"

	"pinflow/store"
	"pinflow/tests/testutil"
)

func setupTestStore(t *testing.T) *store.FileStore {
	t.Helper()
	return testutil.NewStore(t)
}
