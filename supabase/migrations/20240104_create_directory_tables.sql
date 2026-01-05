-- Create people table for unified user/contact management
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_mobile TEXT,
  phone_business TEXT,
  job_title TEXT,
  company_id UUID REFERENCES companies(id),
  person_type TEXT CHECK (person_type IN ('user', 'contact')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for user emails
CREATE UNIQUE INDEX idx_people_email_user ON people(email) WHERE person_type = 'user' AND email IS NOT NULL;

-- Create index for company lookups
CREATE INDEX idx_people_company_id ON people(company_id);

-- Create users_auth table to link people to auth system
CREATE TABLE IF NOT EXISTS users_auth (
  person_id UUID PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  last_login_at TIMESTAMPTZ,
  UNIQUE(auth_user_id)
);

-- Create permission templates table
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT CHECK (scope IN ('project', 'company', 'global')) DEFAULT 'project',
  rules_json JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for template lookups
CREATE INDEX idx_permission_templates_scope ON permission_templates(scope);

-- Create project directory memberships table
CREATE TABLE IF NOT EXISTS project_directory_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  person_id UUID NOT NULL REFERENCES people(id),
  permission_template_id UUID REFERENCES permission_templates(id),
  role TEXT,
  invited_at TIMESTAMPTZ,
  last_invited_at TIMESTAMPTZ,
  invite_status TEXT CHECK (invite_status IN ('not_invited', 'invited', 'accepted', 'expired')) DEFAULT 'not_invited',
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, person_id)
);

-- Create indexes for memberships
CREATE INDEX idx_project_directory_memberships_project ON project_directory_memberships(project_id);
CREATE INDEX idx_project_directory_memberships_person ON project_directory_memberships(person_id);
CREATE INDEX idx_project_directory_memberships_status ON project_directory_memberships(status);
CREATE INDEX idx_project_directory_memberships_invite_token ON project_directory_memberships(invite_token) WHERE invite_token IS NOT NULL;

-- Create distribution groups table
CREATE TABLE IF NOT EXISTS distribution_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Create index for group lookups
CREATE INDEX idx_distribution_groups_project ON distribution_groups(project_id);

-- Create distribution group members table
CREATE TABLE IF NOT EXISTS distribution_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES distribution_groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, person_id)
);

-- Create indexes for group members
CREATE INDEX idx_distribution_group_members_group ON distribution_group_members(group_id);
CREATE INDEX idx_distribution_group_members_person ON distribution_group_members(person_id);

-- Create user project preferences table
CREATE TABLE IF NOT EXISTS user_project_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Insert default permission templates
INSERT INTO permission_templates (name, description, scope, rules_json, is_system) VALUES
('Admin', 'Full administrative access to all project features', 'project', '{
  "directory": ["read", "write", "admin"],
  "budget": ["read", "write", "admin"],
  "contracts": ["read", "write", "admin"],
  "documents": ["read", "write", "admin"],
  "schedule": ["read", "write", "admin"],
  "submittals": ["read", "write", "admin"],
  "rfis": ["read", "write", "admin"],
  "change_orders": ["read", "write", "admin"]
}'::jsonb, true),
('Project Manager', 'Project management access with limited admin capabilities', 'project', '{
  "directory": ["read", "write"],
  "budget": ["read", "write"],
  "contracts": ["read", "write"],
  "documents": ["read", "write"],
  "schedule": ["read", "write"],
  "submittals": ["read", "write"],
  "rfis": ["read", "write"],
  "change_orders": ["read", "write"]
}'::jsonb, true),
('Subcontractor', 'Limited access for external subcontractors', 'project', '{
  "directory": ["read"],
  "budget": ["read"],
  "contracts": ["read"],
  "documents": ["read"],
  "schedule": ["read"],
  "submittals": ["read", "write"],
  "rfis": ["read", "write"],
  "change_orders": ["read"]
}'::jsonb, true),
('View Only', 'Read-only access to project information', 'project', '{
  "directory": ["read"],
  "budget": ["read"],
  "contracts": ["read"],
  "documents": ["read"],
  "schedule": ["read"],
  "submittals": ["read"],
  "rfis": ["read"],
  "change_orders": ["read"]
}'::jsonb, true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permission_templates_updated_at BEFORE UPDATE ON permission_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_directory_memberships_updated_at BEFORE UPDATE ON project_directory_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribution_groups_updated_at BEFORE UPDATE ON distribution_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_project_preferences_updated_at BEFORE UPDATE ON user_project_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_directory_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for people table
CREATE POLICY "Users can view all people in their projects" ON people
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm1
            WHERE pdm1.person_id = people.id
            AND pdm1.status = 'active'
            AND EXISTS (
                SELECT 1 FROM project_directory_memberships pdm2
                JOIN users_auth ua ON ua.person_id = pdm2.person_id
                WHERE pdm2.project_id = pdm1.project_id
                AND pdm2.status = 'active'
                AND ua.auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users with directory:write can create people" ON people
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'write'
        )
    );

CREATE POLICY "Users with directory:write can update people" ON people
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'write'
        )
    );

-- RLS Policies for permission_templates
CREATE POLICY "All users can view permission templates" ON permission_templates
    FOR SELECT
    USING (true);

CREATE POLICY "Only system admins can modify permission templates" ON permission_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for project_directory_memberships
CREATE POLICY "Users can view memberships in their projects" ON project_directory_memberships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = project_directory_memberships.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users with directory:write can manage memberships" ON project_directory_memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = project_directory_memberships.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'write'
        )
    );

-- RLS Policies for distribution_groups
CREATE POLICY "Users can view groups in their projects" ON distribution_groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = distribution_groups.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users with directory:admin can manage groups" ON distribution_groups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = distribution_groups.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'admin'
        )
    );

-- RLS Policies for user_project_preferences
CREATE POLICY "Users can manage their own preferences" ON user_project_preferences
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());