-- Migration: Add Test User Access for E2E Tests
-- Created: 2025-12-28
-- Description: Grants test@example.com access to project 67 for E2E testing
--              This enables budget views and other RLS-protected features to work in tests

-- Step 1: Get or create test user
DO $$
DECLARE
  v_test_user_id UUID;
  v_project_id INT := 67;
BEGIN
  -- Get test user ID (created by dev-login route)
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email = 'test@example.com';

  -- If user doesn't exist yet, this will be NULL and the INSERT will be skipped
  -- The dev-login route will create the user on first test run

  IF v_test_user_id IS NOT NULL THEN
    -- First ensure user exists in public.users table (mirrors auth.users)
    INSERT INTO users (id, email)
    VALUES (v_test_user_id, 'test@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- Add user to project_users if not already added
    INSERT INTO project_users (user_id, project_id, role)
    VALUES (v_test_user_id, v_project_id, 'admin')
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role;

    RAISE NOTICE 'Test user % granted admin access to project %', v_test_user_id, v_project_id;
  ELSE
    RAISE NOTICE 'Test user test@example.com not found - will be created on first test run';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE project_users IS 'User access to projects - used by RLS policies for budget views, contracts, etc.';
