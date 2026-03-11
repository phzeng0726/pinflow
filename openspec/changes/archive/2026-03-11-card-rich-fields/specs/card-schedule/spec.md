## ADDED Requirements

### Requirement: Card schedule fields
The system SHALL support optional `start_time` and `end_time` datetime fields on a card. Both fields are nullable. Values MUST be stored and returned in RFC3339 format.

#### Scenario: Set schedule on card update
- **WHEN** user sends PATCH /api/cards/:id with `{"start_time": "2026-03-15T09:00:00Z", "end_time": "2026-03-15T17:00:00Z"}`
- **THEN** system persists both values and returns them in the card response

#### Scenario: Clear schedule
- **WHEN** user sends PATCH /api/cards/:id with `{"start_time": null, "end_time": null}`
- **THEN** system sets both fields to null and response omits or nulls them

#### Scenario: Card without schedule
- **WHEN** a card has no schedule set
- **THEN** card response returns `"start_time": null, "end_time": null`

### Requirement: Schedule validation
The system SHALL reject updates where `end_time` is earlier than `start_time`.

#### Scenario: Invalid range
- **WHEN** user sends PATCH with end_time before start_time
- **THEN** system returns HTTP 400 with an error message
