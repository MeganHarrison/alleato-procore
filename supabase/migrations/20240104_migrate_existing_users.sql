-- Migrate existing users from app_users to people table
-- This migration preserves existing data while transitioning to the new schema

-- First, migrate all app_users to people table
INSERT INTO people (
    id,
    first_name,
    last_name,
    email,
    job_title,
    person_type,
    status,
    created_at,
    updated_at
)
SELECT 
    id::uuid,
    COALESCE(
        SPLIT_PART(COALESCE(full_name, name, email), ' ', 1),
        'Unknown'
    ) as first_name,
    COALESCE(
        CASE 
            WHEN COALESCE(full_name, name, email) LIKE '% %' 
            THEN SUBSTRING(COALESCE(full_name, name, email) FROM POSITION(' ' IN COALESCE(full_name, name, email)) + 1)
            ELSE ''
        END,
        ''
    ) as last_name,
    email,
    role as job_title,
    'user' as person_type,
    'active' as status,
    created_at::timestamptz,
    updated_at::timestamptz
FROM app_users
ON CONFLICT (id) DO NOTHING;

-- Create users_auth links for all migrated users
INSERT INTO users_auth (person_id, auth_user_id)
SELECT 
    au.id::uuid as person_id,
    u.id as auth_user_id
FROM app_users au
JOIN auth.users u ON u.email = au.email
ON CONFLICT (person_id) DO NOTHING;

-- Migrate project_users to project_directory_memberships
-- First, create a mapping of roles to permission templates
WITH role_template_mapping AS (
    SELECT 
        'admin' as role,
        (SELECT id FROM permission_templates WHERE name = 'Admin' AND is_system = true) as template_id
    UNION ALL
    SELECT 
        'project_manager' as role,
        (SELECT id FROM permission_templates WHERE name = 'Project Manager' AND is_system = true) as template_id
    UNION ALL
    SELECT 
        'viewer' as role,
        (SELECT id FROM permission_templates WHERE name = 'View Only' AND is_system = true) as template_id
    UNION ALL
    SELECT 
        'foreman' as role,
        (SELECT id FROM permission_templates WHERE name = 'Project Manager' AND is_system = true) as template_id
    UNION ALL
    SELECT 
        'superintendent' as role,
        (SELECT id FROM permission_templates WHERE name = 'Project Manager' AND is_system = true) as template_id
)
INSERT INTO project_directory_memberships (
    project_id,
    person_id,
    permission_template_id,
    role,
    status,
    invite_status,
    created_at
)
SELECT 
    pu.project_id,
    pu.user_id::uuid as person_id,
    COALESCE(
        rtm.template_id,
        (SELECT id FROM permission_templates WHERE name = 'View Only' AND is_system = true)
    ) as permission_template_id,
    pu.role,
    'active' as status,
    'accepted' as invite_status,
    COALESCE(pu.assigned_at, NOW())::timestamptz as created_at
FROM project_users pu
LEFT JOIN role_template_mapping rtm ON LOWER(pu.role) = rtm.role
WHERE EXISTS (
    SELECT 1 FROM people p WHERE p.id = pu.user_id::uuid
)
ON CONFLICT (project_id, person_id) DO NOTHING;

-- Migrate companies from project_directory to people associations
-- This updates existing people records with their company associations
UPDATE people p
SET company_id = pd.company_id::uuid
FROM (
    SELECT DISTINCT ON (pu.user_id) 
        pu.user_id,
        pd.company_id
    FROM project_users pu
    JOIN project_directory pd ON pd.project_id = pu.project_id
    WHERE pd.company_id IS NOT NULL
    ORDER BY pu.user_id, pu.assigned_at DESC
) pd
WHERE p.id = pd.user_id::uuid
AND p.company_id IS NULL;

-- Create distribution groups for existing projects (optional - creates default groups)
INSERT INTO distribution_groups (project_id, name, description, status)
SELECT DISTINCT 
    p.id,
    'All Project Members' as name,
    'Default group containing all active project members' as description,
    'active' as status
FROM projects p
WHERE EXISTS (
    SELECT 1 FROM project_directory_memberships pdm 
    WHERE pdm.project_id = p.id
)
ON CONFLICT (project_id, name) DO NOTHING;

-- Add all active members to default distribution groups
INSERT INTO distribution_group_members (group_id, person_id)
SELECT 
    dg.id as group_id,
    pdm.person_id
FROM distribution_groups dg
JOIN project_directory_memberships pdm ON pdm.project_id = dg.project_id
WHERE dg.name = 'All Project Members'
AND pdm.status = 'active'
ON CONFLICT (group_id, person_id) DO NOTHING;

-- Create audit log entry for migration
INSERT INTO sync_status (
    id,
    sync_type,
    entity_type,
    entity_id,
    status,
    last_sync_at,
    metadata
) VALUES (
    gen_random_uuid(),
    'migration',
    'directory_tables',
    'initial_migration',
    'completed',
    NOW(),
    jsonb_build_object(
        'migrated_users', (SELECT COUNT(*) FROM people WHERE person_type = 'user'),
        'migrated_memberships', (SELECT COUNT(*) FROM project_directory_memberships),
        'created_groups', (SELECT COUNT(*) FROM distribution_groups),
        'migration_date', NOW()
    )
);

-- Verify migration success
DO $$
DECLARE
    app_user_count INTEGER;
    people_count INTEGER;
    membership_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO app_user_count FROM app_users;
    SELECT COUNT(*) INTO people_count FROM people WHERE person_type = 'user';
    SELECT COUNT(*) INTO membership_count FROM project_directory_memberships;
    
    IF app_user_count > people_count THEN
        RAISE WARNING 'Migration incomplete: % app_users but only % people created', app_user_count, people_count;
    END IF;
    
    RAISE NOTICE 'Migration completed: % users migrated, % project memberships created', people_count, membership_count;
END $$;