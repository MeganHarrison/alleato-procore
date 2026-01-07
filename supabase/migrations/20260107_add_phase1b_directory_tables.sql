-- Phase 1B: Contact & Company Management + Distribution Groups
-- This migration adds project-scoped company management and notification preferences

-- ============================================================================
-- 1. Project Companies Table (project-level company associations)
-- ============================================================================
-- This table links global companies to projects with project-specific metadata
CREATE TABLE IF NOT EXISTS project_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Project-specific company metadata
  business_phone VARCHAR(30),
  email_address VARCHAR(255),
  primary_contact_id UUID REFERENCES people(id),

  -- Vendor/contractor identifiers
  erp_vendor_id VARCHAR(100),

  -- Company classification for this project
  company_type VARCHAR(50) CHECK (company_type IN ('YOUR_COMPANY', 'VENDOR', 'SUBCONTRACTOR', 'SUPPLIER', 'CONNECTED_COMPANY')) DEFAULT 'VENDOR',

  -- Status within project
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',

  -- Logo for this project context
  logo_url VARCHAR(500),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique company per project
  UNIQUE(project_id, company_id),
  -- Ensure unique ERP vendor ID per project
  UNIQUE(project_id, erp_vendor_id)
);

-- Create indexes for project_companies
CREATE INDEX IF NOT EXISTS idx_project_companies_project ON project_companies(project_id);
CREATE INDEX IF NOT EXISTS idx_project_companies_company ON project_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_project_companies_status ON project_companies(status);
CREATE INDEX IF NOT EXISTS idx_project_companies_type ON project_companies(company_type);

-- ============================================================================
-- 2. User Email Notifications Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Notification preferences
  emails_default BOOLEAN DEFAULT false,
  rfis_default BOOLEAN DEFAULT false,
  submittals_default BOOLEAN DEFAULT false,
  punchlist_items_default BOOLEAN DEFAULT false,
  weather_delay_email BOOLEAN DEFAULT false,
  weather_delay_phone BOOLEAN DEFAULT false,
  daily_log_default BOOLEAN DEFAULT false,
  delay_log_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One notification preference record per user per project
  UNIQUE(person_id, project_id)
);

-- Create indexes for user_email_notifications
CREATE INDEX IF NOT EXISTS idx_user_email_notifications_person ON user_email_notifications(person_id);
CREATE INDEX IF NOT EXISTS idx_user_email_notifications_project ON user_email_notifications(project_id);

-- ============================================================================
-- 3. User Schedule Notifications Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_schedule_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Schedule notification preferences
  all_project_tasks_weekly BOOLEAN DEFAULT false,
  resource_tasks_assigned_to_id UUID REFERENCES people(id),
  upon_schedule_changes BOOLEAN DEFAULT false,
  upon_schedule_change_requests BOOLEAN DEFAULT false,
  project_schedule_lookahead_weekly BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One schedule notification preference record per user per project
  UNIQUE(person_id, project_id)
);

-- Create indexes for user_schedule_notifications
CREATE INDEX IF NOT EXISTS idx_user_schedule_notifications_person ON user_schedule_notifications(person_id);
CREATE INDEX IF NOT EXISTS idx_user_schedule_notifications_project ON user_schedule_notifications(project_id);

-- ============================================================================
-- 4. User Project Roles (join table for multiple roles per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES project_directory_memberships(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(membership_id, role_name)
);

-- Create index for user_project_roles
CREATE INDEX IF NOT EXISTS idx_user_project_roles_membership ON user_project_roles(membership_id);

-- ============================================================================
-- 5. Add employee-related fields to project_directory_memberships
-- ============================================================================
ALTER TABLE project_directory_memberships
  ADD COLUMN IF NOT EXISTS is_employee_of_company BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_insurance_manager BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);

-- ============================================================================
-- 6. Add updated_at triggers
-- ============================================================================
CREATE TRIGGER update_project_companies_updated_at BEFORE UPDATE ON project_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_email_notifications_updated_at BEFORE UPDATE ON user_email_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_schedule_notifications_updated_at BEFORE UPDATE ON user_schedule_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Enable Row Level Security
-- ============================================================================
ALTER TABLE project_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schedule_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS Policies for project_companies
-- ============================================================================
CREATE POLICY "Users can view companies in their projects" ON project_companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = project_companies.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users with directory:write can manage project companies" ON project_companies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = project_companies.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'write'
        )
    );

-- ============================================================================
-- 9. RLS Policies for user_email_notifications
-- ============================================================================
CREATE POLICY "Users can view email notifications in their projects" ON user_email_notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = user_email_notifications.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own email notifications" ON user_email_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_auth ua
            WHERE ua.person_id = user_email_notifications.person_id
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage any user email notifications" ON user_email_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = user_email_notifications.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'admin'
        )
    );

-- ============================================================================
-- 10. RLS Policies for user_schedule_notifications
-- ============================================================================
CREATE POLICY "Users can view schedule notifications in their projects" ON user_schedule_notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.project_id = user_schedule_notifications.project_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own schedule notifications" ON user_schedule_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_auth ua
            WHERE ua.person_id = user_schedule_notifications.person_id
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage any user schedule notifications" ON user_schedule_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            JOIN permission_templates pt ON pt.id = pdm.permission_template_id
            WHERE pdm.project_id = user_schedule_notifications.project_id
            AND ua.auth_user_id = auth.uid()
            AND pdm.status = 'active'
            AND pt.rules_json->'directory' ? 'admin'
        )
    );

-- ============================================================================
-- 11. RLS Policies for user_project_roles
-- ============================================================================
CREATE POLICY "Users can view roles in their projects" ON user_project_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN users_auth ua ON ua.person_id = pdm.person_id
            WHERE pdm.id = user_project_roles.membership_id
            AND pdm.status = 'active'
            AND ua.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage user roles" ON user_project_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN project_directory_memberships pdm2 ON pdm2.project_id = pdm.project_id
            JOIN users_auth ua ON ua.person_id = pdm2.person_id
            JOIN permission_templates pt ON pt.id = pdm2.permission_template_id
            WHERE pdm.id = user_project_roles.membership_id
            AND ua.auth_user_id = auth.uid()
            AND pdm2.status = 'active'
            AND pt.rules_json->'directory' ? 'admin'
        )
    );

-- ============================================================================
-- 12. Helper function to get company user count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_project_company_user_count(p_project_id INTEGER, p_company_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM people p
    JOIN project_directory_memberships pdm ON pdm.person_id = p.id
    WHERE p.company_id = p_company_id
    AND pdm.project_id = p_project_id
    AND pdm.status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 13. Helper function to get distribution group member count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_distribution_group_member_count(p_group_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM distribution_group_members
    WHERE group_id = p_group_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 14. Comments
-- ============================================================================
COMMENT ON TABLE project_companies IS 'Project-level company associations with project-specific metadata like contact info and type';
COMMENT ON TABLE user_email_notifications IS 'User email notification preferences per project';
COMMENT ON TABLE user_schedule_notifications IS 'User schedule notification preferences per project';
COMMENT ON TABLE user_project_roles IS 'Multiple roles per user per project membership';
COMMENT ON COLUMN project_companies.company_type IS 'Classification of company within this project: YOUR_COMPANY, VENDOR, SUBCONTRACTOR, SUPPLIER, CONNECTED_COMPANY';
COMMENT ON COLUMN project_companies.erp_vendor_id IS 'Unique identifier for ERP system integration';
COMMENT ON COLUMN project_directory_memberships.is_employee_of_company IS 'Whether this person is an employee of their associated company';
COMMENT ON COLUMN project_directory_memberships.is_insurance_manager IS 'Whether this person manages insurance for their company';
COMMENT ON COLUMN project_directory_memberships.employee_id IS 'Employee ID within their company';
