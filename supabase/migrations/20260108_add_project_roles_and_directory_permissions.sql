-- Project Directory Settings: Roles & Permissions
-- This migration adds support for:
-- 1. Project Roles (Architect, Project Manager, Superintendent, etc.)
-- 2. User Directory Permissions (None, Read Only, Standard, Admin)

-- ============================================================================
-- 1. Project Roles Table
-- ============================================================================
-- Defines the available roles for a project and their assigned members
-- Each role can have multiple members (people)

CREATE TABLE IF NOT EXISTS project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  role_type VARCHAR(50) DEFAULT 'Person', -- Type is always 'Person' per Procore
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each role name should be unique per project
  UNIQUE(project_id, role_name)
);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_project_roles_project ON project_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_project_roles_name ON project_roles(role_name);

-- ============================================================================
-- 2. Project Role Members Table (junction table)
-- ============================================================================
-- Links people to project roles (many-to-many)

CREATE TABLE IF NOT EXISTS project_role_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_role_id UUID NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES people(id),

  -- Each person can only be assigned to a role once
  UNIQUE(project_role_id, person_id)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_project_role_members_role ON project_role_members(project_role_id);
CREATE INDEX IF NOT EXISTS idx_project_role_members_person ON project_role_members(person_id);

-- ============================================================================
-- 3. User Directory Permissions Table
-- ============================================================================
-- Stores per-user directory permission levels for each project
-- Levels: 'none', 'read_only', 'standard', 'admin'

CREATE TABLE IF NOT EXISTS user_directory_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('none', 'read_only', 'standard', 'admin')) DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One permission record per user per project
  UNIQUE(project_id, person_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_directory_permissions_project ON user_directory_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_user_directory_permissions_person ON user_directory_permissions(person_id);
CREATE INDEX IF NOT EXISTS idx_user_directory_permissions_level ON user_directory_permissions(permission_level);

-- ============================================================================
-- 4. Insert Default Project Roles
-- ============================================================================
-- Function to create default roles when a project is created

CREATE OR REPLACE FUNCTION create_default_project_roles()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_roles (project_id, role_name, display_order)
  VALUES
    (NEW.id, 'Architect', 1),
    (NEW.id, 'Project Manager', 2),
    (NEW.id, 'Superintendent', 3)
  ON CONFLICT (project_id, role_name) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create roles for new projects
DROP TRIGGER IF EXISTS trigger_create_default_project_roles ON projects;
CREATE TRIGGER trigger_create_default_project_roles
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_project_roles();

-- ============================================================================
-- 5. Create default roles for existing projects
-- ============================================================================
INSERT INTO project_roles (project_id, role_name, display_order)
SELECT p.id, role_data.role_name, role_data.display_order
FROM projects p
CROSS JOIN (
  VALUES
    ('Architect', 1),
    ('Project Manager', 2),
    ('Superintendent', 3)
) AS role_data(role_name, display_order)
ON CONFLICT (project_id, role_name) DO NOTHING;

-- ============================================================================
-- 6. Updated_at triggers
-- ============================================================================
CREATE OR REPLACE TRIGGER update_project_roles_updated_at
  BEFORE UPDATE ON project_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_directory_permissions_updated_at
  BEFORE UPDATE ON user_directory_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Enable Row Level Security
-- ============================================================================
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_role_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_directory_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS Policies for project_roles
-- ============================================================================
CREATE POLICY "Users can view roles in their projects" ON project_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_directory_memberships pdm
      WHERE pdm.project_id = project_roles.project_id
      AND pdm.status = 'active'
      AND pdm.person_id = auth.uid()::uuid
    )
    OR
    -- Allow service role access
    auth.role() = 'service_role'
  );

CREATE POLICY "Admins can manage project roles" ON project_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_directory_memberships pdm
      JOIN permission_templates pt ON pt.id = pdm.permission_template_id
      WHERE pdm.project_id = project_roles.project_id
      AND pdm.status = 'active'
      AND pdm.person_id = auth.uid()::uuid
      AND pt.rules_json->'directory' ? 'admin'
    )
    OR
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 9. RLS Policies for project_role_members
-- ============================================================================
CREATE POLICY "Users can view role members in their projects" ON project_role_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_roles pr
      JOIN project_directory_memberships pdm ON pdm.project_id = pr.project_id
      WHERE pr.id = project_role_members.project_role_id
      AND pdm.status = 'active'
      AND pdm.person_id = auth.uid()::uuid
    )
    OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Admins can manage role members" ON project_role_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_roles pr
      JOIN project_directory_memberships pdm ON pdm.project_id = pr.project_id
      JOIN permission_templates pt ON pt.id = pdm.permission_template_id
      WHERE pr.id = project_role_members.project_role_id
      AND pdm.status = 'active'
      AND pdm.person_id = auth.uid()::uuid
      AND pt.rules_json->'directory' ? 'admin'
    )
    OR
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 10. RLS Policies for user_directory_permissions
-- ============================================================================
CREATE POLICY "Users can view directory permissions in their projects" ON user_directory_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_directory_memberships pdm
      WHERE pdm.project_id = user_directory_permissions.project_id
      AND pdm.status = 'active'
      AND pdm.person_id = auth.uid()::uuid
    )
    OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Admins can manage directory permissions" ON user_directory_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_directory_memberships pdm
      JOIN permission_templates pt ON pt.id = pdm.permission_template_id
      WHERE pdm.project_id = user_directory_permissions.project_id
      AND pdm.status = 'active'
      AND pdm.person_id = auth.uid()::uuid
      AND pt.rules_json->'directory' ? 'admin'
    )
    OR
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 11. Helper function to get project team for home page
-- ============================================================================
CREATE OR REPLACE FUNCTION get_project_team(p_project_id INTEGER)
RETURNS TABLE (
  id UUID,
  role VARCHAR(100),
  person_id UUID,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name TEXT,
  email VARCHAR(255),
  company_name VARCHAR(255),
  phone_office VARCHAR(30),
  phone_mobile VARCHAR(30)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    prm.id,
    pr.role_name as role,
    p.id as person_id,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.email,
    c.name as company_name,
    p.phone_business as phone_office,
    p.phone_mobile
  FROM project_roles pr
  JOIN project_role_members prm ON prm.project_role_id = pr.id
  JOIN people p ON p.id = prm.person_id
  LEFT JOIN companies c ON c.id = p.company_id
  WHERE pr.project_id = p_project_id
  ORDER BY pr.display_order, p.last_name, p.first_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 12. Comments
-- ============================================================================
COMMENT ON TABLE project_roles IS 'Defines project roles like Architect, Project Manager, Superintendent';
COMMENT ON TABLE project_role_members IS 'Junction table linking people to project roles';
COMMENT ON TABLE user_directory_permissions IS 'Per-user directory permission levels (none, read_only, standard, admin)';
COMMENT ON COLUMN project_roles.role_type IS 'Type of role assignment, currently always Person';
COMMENT ON COLUMN user_directory_permissions.permission_level IS 'Directory permission level: none, read_only, standard, admin';
