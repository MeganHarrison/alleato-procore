-- =============================================================================
-- SCAFFOLD: Project-Scoped CRUD Table
-- Replace: __ENTITY_TABLE__, __ENTITY__, __entity__
-- =============================================================================

-- Create table
CREATE TABLE IF NOT EXISTS __ENTITY_TABLE__ (
    -- Primary key: UUID for entities that might sync across projects
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to projects (MUST be INTEGER, not UUID!)
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Core fields (customize these)
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),

    -- Audit fields (always include)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes (always index foreign keys and frequently filtered columns)
CREATE INDEX IF NOT EXISTS idx___ENTITY_TABLE___project_id ON __ENTITY_TABLE__(project_id);
CREATE INDEX IF NOT EXISTS idx___ENTITY_TABLE___status ON __ENTITY_TABLE__(status);
CREATE INDEX IF NOT EXISTS idx___ENTITY_TABLE___created_at ON __ENTITY_TABLE__(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update___ENTITY_TABLE___updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger___ENTITY_TABLE___updated_at ON __ENTITY_TABLE__;
CREATE TRIGGER trigger___ENTITY_TABLE___updated_at
    BEFORE UPDATE ON __ENTITY_TABLE__
    FOR EACH ROW
    EXECUTE FUNCTION update___ENTITY_TABLE___updated_at();

-- Enable RLS
ALTER TABLE __ENTITY_TABLE__ ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: User must be member of the project
CREATE POLICY "__ENTITY_TABLE___select_policy" ON __ENTITY_TABLE__
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN people p ON p.id = pdm.person_id
            WHERE pdm.project_id = __ENTITY_TABLE__.project_id
            AND p.auth_user_id = auth.uid()
            AND pdm.status = 'active'
        )
    );

-- INSERT: User must be member of the project
CREATE POLICY "__ENTITY_TABLE___insert_policy" ON __ENTITY_TABLE__
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN people p ON p.id = pdm.person_id
            WHERE pdm.project_id = __ENTITY_TABLE__.project_id
            AND p.auth_user_id = auth.uid()
            AND pdm.status = 'active'
        )
    );

-- UPDATE: User must be member of the project
CREATE POLICY "__ENTITY_TABLE___update_policy" ON __ENTITY_TABLE__
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN people p ON p.id = pdm.person_id
            WHERE pdm.project_id = __ENTITY_TABLE__.project_id
            AND p.auth_user_id = auth.uid()
            AND pdm.status = 'active'
        )
    );

-- DELETE: User must be member of the project
CREATE POLICY "__ENTITY_TABLE___delete_policy" ON __ENTITY_TABLE__
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_directory_memberships pdm
            JOIN people p ON p.id = pdm.person_id
            WHERE pdm.project_id = __ENTITY_TABLE__.project_id
            AND p.auth_user_id = auth.uid()
            AND pdm.status = 'active'
        )
    );

-- Table comment
COMMENT ON TABLE __ENTITY_TABLE__ IS '__ENTITY__ records for each project';
