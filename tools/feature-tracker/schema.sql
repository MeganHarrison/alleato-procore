-- Feature Tracker Database Schema
-- This is the single source of truth for all Procore feature implementation tracking

-- =============================================================================
-- PROCORE FEATURES (Top-level modules like Budget, Commitments, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS procore_features (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,                          -- "Budget", "Commitments", etc.
    slug TEXT NOT NULL UNIQUE,                   -- "budget", "commitments"
    description TEXT,
    procore_tool_url TEXT,                       -- Base URL pattern in Procore
    priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT CHECK(status IN ('not_started', 'in_progress', 'needs_review', 'complete')) DEFAULT 'not_started',
    match_score REAL,                            -- 0.0 to 100.0
    linear_project_id TEXT,                      -- Link to Linear project
    linear_issue_id TEXT,                        -- Link to Linear issue
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PROCORE PAGES (Individual screens/views within a feature)
-- =============================================================================
CREATE TABLE IF NOT EXISTS procore_pages (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES procore_features(id),
    name TEXT NOT NULL,                          -- Human-readable: "Budget Main View"
    slug TEXT NOT NULL,                          -- Folder name: "budget-main-view"
    page_type TEXT CHECK(page_type IN ('list', 'detail', 'form', 'modal', 'tab', 'dashboard', 'settings', 'report', 'other')),

    -- Procore Reference
    procore_url TEXT,                            -- Full Procore URL
    screenshot_path TEXT,                        -- Path to screenshot.png
    dom_path TEXT,                               -- Path to dom.html
    metadata_path TEXT,                          -- Path to metadata.json

    -- Implementation Reference
    alleato_route TEXT,                          -- Our Next.js route: "/[projectId]/budget"
    alleato_url TEXT,                            -- Full URL in our app

    -- Status
    status TEXT CHECK(status IN ('not_started', 'in_progress', 'needs_review', 'complete', 'blocked')) DEFAULT 'not_started',
    implementation_notes TEXT,

    -- Metadata extracted from crawl
    button_count INTEGER,
    form_field_count INTEGER,
    table_column_count INTEGER,

    -- Tracking
    linear_issue_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PAGE COMPONENTS (Buttons, forms, tables found on each page)
-- =============================================================================
CREATE TABLE IF NOT EXISTS page_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id TEXT NOT NULL REFERENCES procore_pages(id),
    component_type TEXT CHECK(component_type IN ('button', 'form_field', 'table_column', 'dropdown', 'tab', 'link', 'modal_trigger')),
    name TEXT NOT NULL,                          -- "Create Contract" button, "Title" field
    procore_label TEXT,                          -- Exact label in Procore
    data_type TEXT,                              -- For form fields: text, number, date, select, etc.
    is_required BOOLEAN,
    is_calculated BOOLEAN DEFAULT FALSE,         -- Calculated field vs stored
    calculation_formula TEXT,                    -- If calculated, the formula

    -- Implementation mapping
    supabase_table TEXT,                         -- Which table stores this
    supabase_column TEXT,                        -- Which column
    implemented BOOLEAN DEFAULT FALSE,
    implementation_notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SUPABASE TABLES (Our actual database schema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS supabase_tables (
    id TEXT PRIMARY KEY,                         -- Table name
    table_type TEXT CHECK(table_type IN ('table', 'view', 'function', 'materialized_view')),
    description TEXT,
    row_count INTEGER,                           -- Approximate row count

    -- Feature mapping
    primary_feature_id TEXT REFERENCES procore_features(id),

    -- Schema info
    column_count INTEGER,
    has_rls BOOLEAN,

    -- Status
    needs_migration BOOLEAN DEFAULT FALSE,
    migration_notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SUPABASE COLUMNS (Detailed column info)
-- =============================================================================
CREATE TABLE IF NOT EXISTS supabase_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id TEXT NOT NULL REFERENCES supabase_tables(id),
    column_name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    is_nullable BOOLEAN,
    is_primary_key BOOLEAN DEFAULT FALSE,
    is_foreign_key BOOLEAN DEFAULT FALSE,
    references_table TEXT,                       -- If FK, which table
    references_column TEXT,                      -- If FK, which column
    default_value TEXT,
    description TEXT,

    -- Procore mapping
    procore_equivalent TEXT,                     -- What Procore calls this field
    procore_page_id TEXT REFERENCES procore_pages(id),

    UNIQUE(table_id, column_name)
);

-- =============================================================================
-- FEATURE TO TABLE MAPPING (Which tables support which features)
-- =============================================================================
CREATE TABLE IF NOT EXISTS feature_table_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_id TEXT NOT NULL REFERENCES procore_features(id),
    table_id TEXT NOT NULL REFERENCES supabase_tables(id),
    relationship_type TEXT CHECK(relationship_type IN ('primary', 'supporting', 'lookup', 'junction')),
    notes TEXT,

    UNIQUE(feature_id, table_id)
);

-- =============================================================================
-- SCHEMA GAPS (Differences between Procore and our implementation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS schema_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_id TEXT NOT NULL REFERENCES procore_features(id),
    gap_type TEXT CHECK(gap_type IN ('missing_table', 'missing_column', 'wrong_type', 'missing_calculation', 'missing_relationship', 'wrong_relationship')),
    severity TEXT CHECK(severity IN ('blocker', 'major', 'minor', 'enhancement')),

    procore_element TEXT,                        -- What Procore has
    our_element TEXT,                            -- What we have (or null if missing)

    description TEXT NOT NULL,
    suggested_fix TEXT,

    -- Status
    status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'wont_fix')) DEFAULT 'open',
    linear_issue_id TEXT,
    resolved_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_pages_feature ON procore_pages(feature_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON procore_pages(status);
CREATE INDEX IF NOT EXISTS idx_components_page ON page_components(page_id);
CREATE INDEX IF NOT EXISTS idx_columns_table ON supabase_columns(table_id);
CREATE INDEX IF NOT EXISTS idx_gaps_feature ON schema_gaps(feature_id);
CREATE INDEX IF NOT EXISTS idx_gaps_status ON schema_gaps(status);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Feature overview with stats
CREATE VIEW IF NOT EXISTS v_feature_overview AS
SELECT
    f.id,
    f.name,
    f.slug,
    f.priority,
    f.status,
    f.match_score,
    COUNT(DISTINCT p.id) as page_count,
    COUNT(DISTINCT CASE WHEN p.status = 'complete' THEN p.id END) as pages_complete,
    COUNT(DISTINCT t.table_id) as table_count,
    COUNT(DISTINCT g.id) as open_gaps
FROM procore_features f
LEFT JOIN procore_pages p ON p.feature_id = f.id
LEFT JOIN feature_table_mapping t ON t.feature_id = f.id
LEFT JOIN schema_gaps g ON g.feature_id = f.id AND g.status = 'open'
GROUP BY f.id;

-- Pages needing work
CREATE VIEW IF NOT EXISTS v_pages_needing_work AS
SELECT
    p.*,
    f.name as feature_name,
    f.priority as feature_priority
FROM procore_pages p
JOIN procore_features f ON f.id = p.feature_id
WHERE p.status != 'complete'
ORDER BY
    CASE f.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    p.name;

-- Schema comparison summary
CREATE VIEW IF NOT EXISTS v_schema_comparison AS
SELECT
    f.name as feature,
    f.slug,
    st.id as our_table,
    st.column_count as our_columns,
    COUNT(DISTINCT pc.id) as procore_components,
    COUNT(DISTINCT CASE WHEN pc.implemented THEN pc.id END) as implemented_components,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN pc.implemented THEN pc.id END) / NULLIF(COUNT(DISTINCT pc.id), 0), 1) as implementation_percent
FROM procore_features f
LEFT JOIN feature_table_mapping ftm ON ftm.feature_id = f.id
LEFT JOIN supabase_tables st ON st.id = ftm.table_id
LEFT JOIN procore_pages pp ON pp.feature_id = f.id
LEFT JOIN page_components pc ON pc.page_id = pp.id
GROUP BY f.id, st.id;
