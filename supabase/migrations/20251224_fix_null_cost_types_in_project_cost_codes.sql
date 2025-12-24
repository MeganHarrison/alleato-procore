-- Fix existing project_cost_codes with NULL cost_type_id
-- Created: 2025-12-24
-- Purpose: Assign "Other" cost type to project cost codes missing a cost_type_id

-- First, ensure the "Other" cost type exists
INSERT INTO cost_code_types (code, description, category)
VALUES ('O', 'Other', 'Direct Costs')
ON CONFLICT (code) DO NOTHING;

-- Update all project_cost_codes with NULL cost_type_id to use "Other"
UPDATE project_cost_codes
SET cost_type_id = (SELECT id FROM cost_code_types WHERE code = 'O')
WHERE cost_type_id IS NULL;

-- Verify no NULL cost_type_id remain
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM project_cost_codes
  WHERE cost_type_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Still have % project_cost_codes with NULL cost_type_id after migration', null_count;
  END IF;

  RAISE NOTICE 'Successfully fixed all project_cost_codes with NULL cost_type_id';
END $$;
