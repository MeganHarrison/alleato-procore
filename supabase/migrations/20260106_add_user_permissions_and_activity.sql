-- Add missing fields to project_directory_memberships
ALTER TABLE project_directory_memberships
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS initials VARCHAR(10),
  ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Create user_permissions table for granular per-user permission overrides
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Tool Permissions
  tool_name VARCHAR(100) NOT NULL, -- 'directory', 'budget', 'rfis', 'documents', etc.
  permission_type VARCHAR(50) NOT NULL, -- 'read', 'write', 'admin', 'approve'

  -- Override or Grant
  is_granted BOOLEAN DEFAULT true, -- true = grant permission, false = revoke permission

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique permission per user per tool per type
  UNIQUE(person_id, project_id, tool_name, permission_type)
);

-- Create indexes for user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_person_project ON user_permissions(person_id, project_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tool ON user_permissions(tool_name);
CREATE INDEX IF NOT EXISTS idx_user_permissions_project ON user_permissions(project_id);

-- Create user_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,

  action VARCHAR(100) NOT NULL, -- 'added', 'updated', 'removed', 'invited', 'login', 'permission_changed'
  action_description TEXT,
  changes JSONB, -- Before/after values for what changed
  performed_by UUID REFERENCES people(id), -- Who performed the action
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create indexes for user_activity_log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_project_date ON user_activity_log(project_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_person_date ON user_activity_log(person_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);

-- Add updated_at trigger for user_permissions
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_permissions
CREATE POLICY "Users can view permissions in their projects" ON user_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = user_permissions.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users with directory:admin can manage permissions" ON user_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = user_permissions.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'admin'
        )
    );

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view activity logs in their projects" ON user_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = user_activity_log.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users with directory:write can create activity logs" ON user_activity_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = user_activity_log.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'write'
        )
    );

-- Create function to auto-generate initials from first and last name
CREATE OR REPLACE FUNCTION generate_initials(first_name TEXT, last_name TEXT)
RETURNS VARCHAR(10) AS $$
BEGIN
  RETURN UPPER(SUBSTRING(first_name FROM 1 FOR 1) || SUBSTRING(last_name FROM 1 FOR 1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-generate initials on insert/update
CREATE OR REPLACE FUNCTION set_person_initials()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set initials if not provided
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    -- Check if we're updating project_directory_memberships
    IF TG_TABLE_NAME = 'project_directory_memberships' THEN
      -- Get the person's name and generate initials
      SELECT generate_initials(p.first_name, p.last_name)
      INTO NEW.initials
      FROM people p
      WHERE p.id = NEW.person_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to project_directory_memberships for auto-generating initials
CREATE TRIGGER auto_generate_initials
    BEFORE INSERT OR UPDATE ON project_directory_memberships
    FOR EACH ROW
    WHEN (NEW.initials IS NULL)
    EXECUTE FUNCTION set_person_initials();

-- Add comment to explain the tables
COMMENT ON TABLE user_permissions IS 'Stores granular per-user permission overrides that supplement or override permission_templates';
COMMENT ON TABLE user_activity_log IS 'Audit trail for all user management actions (add, update, remove, invite, permission changes)';
COMMENT ON COLUMN project_directory_memberships.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN project_directory_memberships.initials IS 'Auto-generated initials from first and last name (e.g., JD for John Doe)';
COMMENT ON COLUMN project_directory_memberships.department IS 'Department or team the user belongs to within the project';
