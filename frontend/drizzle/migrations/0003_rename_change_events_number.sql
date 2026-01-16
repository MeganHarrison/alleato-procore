-- Rename change_events.event_number to change_events.number if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'change_events'
      AND column_name = 'event_number'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'change_events'
      AND column_name = 'number'
  ) THEN
    ALTER TABLE change_events RENAME COLUMN event_number TO number;
  END IF;
END $$;
