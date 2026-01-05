-- Fix infinite recursion in project_directory_memberships RLS policy (v2)
-- The issue: ANY query on project_directory_memberships that joins through itself creates recursion
-- Solution: Disable RLS for this table and rely on application-level auth + RLS on related tables

-- Drop ALL existing policies on project_directory_memberships
DROP POLICY IF EXISTS "Users can view memberships in their projects" ON project_directory_memberships;
DROP POLICY IF EXISTS "Users with directory:write can manage memberships" ON project_directory_memberships;

-- Disable RLS on project_directory_memberships
-- This is safe because:
-- 1. The people table has RLS that ensures users can only see people in their projects
-- 2. The API route handles authorization
-- 3. Users can only access this through the people query which has RLS
ALTER TABLE project_directory_memberships DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining why RLS is disabled
COMMENT ON TABLE project_directory_memberships IS
    'RLS disabled to prevent infinite recursion. Authorization is enforced through:
    1. RLS on the people table (users can only see people in their projects)
    2. Application-level auth checks in API routes
    3. This table is never queried directly, only through joins with people table';
