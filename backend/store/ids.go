package store

// ID Generation
// ============================================================

// NextID returns the next auto-increment ID for the given entity type
// and persists the updated counter. Thread-safe.
func (s *FileStore) NextID(entity string) uint {
	s.idMu.Lock()
	defer s.idMu.Unlock()
	id := s.manifest.NextIDs[entity]
	if id == 0 {
		id = 1
	}
	s.manifest.NextIDs[entity] = id + 1
	_ = s.saveManifest()
	return id
}

// NextBoardID returns the next auto-increment ID for a per-board entity (e.g. "tag", "dependency").
// Thread-safe.
func (s *FileStore) NextBoardID(boardID uint, entity string) uint {
	s.idMu.Lock()
	defer s.idMu.Unlock()
	bm, ok := s.boardManifests[boardID]
	if !ok {
		bm = &BoardManifest{NextIDs: map[string]uint{"tag": 1, "dependency": 1}}
		s.boardManifests[boardID] = bm
	}
	id := bm.NextIDs[entity]
	if id == 0 {
		id = 1
	}
	bm.NextIDs[entity] = id + 1
	_ = s.writeJSON(s.boardManifestPath(boardID), bm)
	return id
}

// ============================================================
