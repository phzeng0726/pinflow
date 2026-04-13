## MODIFIED Requirements

### Requirement: Inline schedule editing in dialog
The dialog SHALL allow the user to set or clear start and end datetimes via a popover button in the metadata row. The Schedule button SHALL be positioned between Priority and Tags in the metadata row.

#### Scenario: No schedule set — button shows icon only
- **WHEN** dialog opens for a card with no start or end time
- **THEN** a Schedule button displaying only a Calendar icon is rendered in the metadata row

#### Scenario: Schedule partially set — button shows summary
- **WHEN** dialog opens for a card with only startTime set
- **THEN** the Schedule button displays a short summary (e.g., "4/13 →")

#### Scenario: Schedule fully set — button shows date range
- **WHEN** dialog opens for a card with both startTime and endTime set
- **THEN** the Schedule button displays a short date range (e.g., "4/13 → 4/20")

#### Scenario: Open popover to set dates
- **WHEN** user clicks the Schedule button
- **THEN** a popover opens containing start time and end time DateTimePicker controls

#### Scenario: Save on popover close
- **WHEN** user changes a date and closes the popover
- **THEN** card schedule is updated via API and the button reflects the new value

#### Scenario: Validation — end before start
- **WHEN** user sets endTime earlier than startTime and attempts to close the popover
- **THEN** popover remains open and an error message is displayed; no API call is made

#### Scenario: Clear all schedule
- **WHEN** at least one date is set and user clicks "清除全部" in the popover
- **THEN** both startTime and endTime are cleared via API and the button reverts to showing only the Calendar icon
