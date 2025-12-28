-- Migration: Add Test User Access to Project 118
-- Created: 2025-12-28
-- Description: Grants test@example.com access to project 118 for E2E testing
--              This is in addition to project 67 access

DO $$
DECLARE
  v_test_user_id UUID;
  v_project_id INT := 118;
BEGIN
  -- Get test user ID
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email = 'test@example.com';

  IF v_test_user_id IS NOT NULL THEN
    -- Ensure user exists in public.users table
    INSERT INTO users (id, email)
    VALUES (v_test_user_id, 'test@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- Add user to project_users for project 118
    INSERT INTO project_users (user_id, project_id, role)
    VALUES (v_test_user_id, v_project_id, 'admin')
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role;

    RAISE NOTICE 'Test user % granted admin access to project %', v_test_user_id, v_project_id;
  ELSE
    RAISE NOTICE 'Test user test@example.com not found';
  END IF;
END $$;
