-- =============================================================================
-- FIX DIRECT COSTS RLS SELECT POLICY
-- =============================================================================
-- Issue: SELECT queries are failing even when user has project access
-- Root cause: RLS policy subquery might be inefficient or auth context issue
--
-- Solution:
-- 1. Add index on project_members for RLS performance
-- 2. Simplify RLS policy to be more explicit
-- 3. Add policy for service_role bypass

-- Add index for RLS policy performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_project_members_user_project 
  ON project_members(user_id, project_id);

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view direct costs from their projects" ON direct_costs;

-- Recreate with explicit type casting and better performance
CREATE POLICY "Users can view direct costs from their projects"
  ON direct_costs FOR SELECT
  USING (
    -- Allow if user is a member of the project
    EXISTS (
      SELECT 1 
      FROM project_members pm
      WHERE pm.project_id = direct_costs.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Add service role bypass policy for admin operations
CREATE POLICY "Service role can view all direct costs"
  ON direct_costs FOR SELECT
  TO service_role
  USING (true);

COMMENT ON POLICY "Users can view direct costs from their projects" ON direct_costs IS 
  'Users can view direct costs for projects where they are members. Requires project_members relationship.';

COMMENT ON POLICY "Service role can view all direct costs" ON direct_costs IS 
  'Service role (admin) can view all direct costs without restrictions.';
