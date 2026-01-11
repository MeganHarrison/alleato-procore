-- Change Events RLS Policies Migration
-- Created: 2026-01-10
-- Purpose: Add Row Level Security policies for all change events tables
-- Security: CRITICAL - Prevents unauthorized access to change events data

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_event_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_event_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_event_approvals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CHANGE_EVENTS TABLE POLICIES
-- =====================================================

-- SELECT: Project members can read change events for their projects
CREATE POLICY "change_events_select_policy" ON change_events
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT project_id
    FROM project_users
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Standard+ role can create change events
CREATE POLICY "change_events_insert_policy" ON change_events
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT pu.project_id
    FROM project_users pu
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('standard', 'admin', 'owner')
  )
);

-- UPDATE: Creator or project admin can update
CREATE POLICY "change_events_update_policy" ON change_events
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR
  project_id IN (
    SELECT pu.project_id
    FROM project_users pu
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR
  project_id IN (
    SELECT pu.project_id
    FROM project_users pu
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- DELETE: Admin only can delete
CREATE POLICY "change_events_delete_policy" ON change_events
FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT pu.project_id
    FROM project_users pu
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- =====================================================
-- 3. CHANGE_EVENT_LINE_ITEMS TABLE POLICIES
-- =====================================================

-- SELECT: Inherit from parent change_event
CREATE POLICY "change_event_line_items_select_policy" ON change_event_line_items
FOR SELECT
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- INSERT: Can insert if can write to parent change_event
CREATE POLICY "change_event_line_items_insert_policy" ON change_event_line_items
FOR INSERT
TO authenticated
WITH CHECK (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('standard', 'admin', 'owner')
  )
);

-- UPDATE: Creator of parent change_event or admin can update
CREATE POLICY "change_event_line_items_update_policy" ON change_event_line_items
FOR UPDATE
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND (
      ce.created_by = auth.uid()
      OR pu.role IN ('admin', 'owner')
    )
  )
)
WITH CHECK (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND (
      ce.created_by = auth.uid()
      OR pu.role IN ('admin', 'owner')
    )
  )
);

-- DELETE: Admin only can delete
CREATE POLICY "change_event_line_items_delete_policy" ON change_event_line_items
FOR DELETE
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- =====================================================
-- 4. CHANGE_EVENT_ATTACHMENTS TABLE POLICIES
-- =====================================================

-- SELECT: Inherit from parent change_event
CREATE POLICY "change_event_attachments_select_policy" ON change_event_attachments
FOR SELECT
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- INSERT: Can insert if can write to parent change_event
CREATE POLICY "change_event_attachments_insert_policy" ON change_event_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('standard', 'admin', 'owner')
  )
);

-- UPDATE: Uploader or admin can update
CREATE POLICY "change_event_attachments_update_policy" ON change_event_attachments
FOR UPDATE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- DELETE: Uploader or admin can delete
CREATE POLICY "change_event_attachments_delete_policy" ON change_event_attachments
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- =====================================================
-- 5. CHANGE_EVENT_HISTORY TABLE POLICIES
-- =====================================================

-- SELECT: Read-only, inherit from parent change_event
CREATE POLICY "change_event_history_select_policy" ON change_event_history
FOR SELECT
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- INSERT: System only (triggers create history)
-- Allow authenticated users to insert (triggers will do this)
CREATE POLICY "change_event_history_insert_policy" ON change_event_history
FOR INSERT
TO authenticated
WITH CHECK (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- UPDATE: Not allowed (audit trail should be immutable)
-- No update policy = no updates allowed

-- DELETE: Not allowed (audit trail should be immutable)
-- No delete policy = no deletes allowed

-- =====================================================
-- 6. CHANGE_EVENT_APPROVALS TABLE POLICIES
-- =====================================================

-- SELECT: Inherit from parent change_event
CREATE POLICY "change_event_approvals_select_policy" ON change_event_approvals
FOR SELECT
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- INSERT: Creator of change_event or admin can request approvals
CREATE POLICY "change_event_approvals_insert_policy" ON change_event_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND (
      ce.created_by = auth.uid()
      OR pu.role IN ('admin', 'owner')
    )
  )
);

-- UPDATE: Approver can update their own approval
CREATE POLICY "change_event_approvals_update_policy" ON change_event_approvals
FOR UPDATE
TO authenticated
USING (
  approver_id = auth.uid()
  OR
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  approver_id = auth.uid()
  OR
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- DELETE: Admin only can delete approvals
CREATE POLICY "change_event_approvals_delete_policy" ON change_event_approvals
FOR DELETE
TO authenticated
USING (
  change_event_id IN (
    SELECT ce.id
    FROM change_events ce
    JOIN project_users pu ON ce.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
    AND pu.role IN ('admin', 'owner')
  )
);

-- =====================================================
-- 7. PERFORMANCE INDEXES FOR RLS QUERIES
-- =====================================================

-- Index on project_users for faster RLS policy checks
CREATE INDEX IF NOT EXISTS idx_project_users_user_project ON project_users(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_role ON project_users(project_id, role);

-- Index on change_events for faster joins in RLS policies
CREATE INDEX IF NOT EXISTS idx_change_events_created_by ON change_events(created_by);

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON POLICY "change_events_select_policy" ON change_events IS
  'Project members can read change events for their projects';

COMMENT ON POLICY "change_events_insert_policy" ON change_events IS
  'Standard+ role users can create change events in their projects';

COMMENT ON POLICY "change_events_update_policy" ON change_events IS
  'Creator or project admin can update change events';

COMMENT ON POLICY "change_events_delete_policy" ON change_events IS
  'Admin/Owner only can delete change events';
