-- Change Events Module Migration
-- Created: 2026-01-08
-- Purpose: Complete schema for change events management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MAIN CHANGE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS change_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reason VARCHAR(100),
    scope VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    origin VARCHAR(100),
    expecting_revenue BOOLEAN NOT NULL DEFAULT true,
    line_item_revenue_source VARCHAR(100),
    prime_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT change_events_number_project_unique UNIQUE (project_id, number),
    CONSTRAINT change_events_type_check CHECK (type IN (
        'Owner Change',
        'Design Change',
        'Allowance',
        'Scope Gap',
        'Unforeseen Condition',
        'Value Engineering',
        'Owner Requested',
        'Constructability Issue'
    )),
    CONSTRAINT change_events_scope_check CHECK (scope IN ('TBD', 'In Scope', 'Out of Scope', 'Allowance')),
    CONSTRAINT change_events_status_check CHECK (status IN (
        'Open',
        'Pending Approval',
        'Approved',
        'Rejected',
        'Closed',
        'Converted'
    ))
);

-- Indexes for change_events
CREATE INDEX idx_change_events_project_id ON change_events(project_id);
CREATE INDEX idx_change_events_number ON change_events(project_id, number);
CREATE INDEX idx_change_events_status ON change_events(status);
CREATE INDEX idx_change_events_type ON change_events(type);
CREATE INDEX idx_change_events_created_at ON change_events(created_at DESC);
CREATE INDEX idx_change_events_deleted_at ON change_events(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- 2. CHANGE EVENT LINE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
    budget_code_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL,
    description TEXT,
    vendor_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    unit_of_measure VARCHAR(50),
    quantity DECIMAL(15,4),
    unit_cost DECIMAL(15,2),
    revenue_rom DECIMAL(15,2),
    cost_rom DECIMAL(15,2),
    non_committed_cost DECIMAL(15,2),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for change_event_line_items
CREATE INDEX idx_ce_line_items_change_event ON change_event_line_items(change_event_id);
CREATE INDEX idx_ce_line_items_budget_code ON change_event_line_items(budget_code_id);
CREATE INDEX idx_ce_line_items_vendor ON change_event_line_items(vendor_id);
CREATE INDEX idx_ce_line_items_contract ON change_event_line_items(contract_id);
CREATE INDEX idx_ce_line_items_sort ON change_event_line_items(change_event_id, sort_order);

-- =====================================================
-- 3. CHANGE EVENT ATTACHMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for change_event_attachments
CREATE INDEX idx_ce_attachments_change_event ON change_event_attachments(change_event_id);
CREATE INDEX idx_ce_attachments_uploaded_at ON change_event_attachments(uploaded_at DESC);

-- =====================================================
-- 4. CHANGE EVENT HISTORY (AUDIT TRAIL)
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_type VARCHAR(50) NOT NULL,

    CONSTRAINT change_event_history_type_check CHECK (change_type IN (
        'create',
        'update',
        'delete',
        'status_change'
    ))
);

-- Indexes for change_event_history
CREATE INDEX idx_ce_history_change_event ON change_event_history(change_event_id);
CREATE INDEX idx_ce_history_changed_at ON change_event_history(changed_at DESC);
CREATE INDEX idx_ce_history_changed_by ON change_event_history(changed_by);

-- =====================================================
-- 5. CHANGE EVENT APPROVALS
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    comments TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT change_event_approvals_status_check CHECK (approval_status IN (
        'Pending',
        'Approved',
        'Rejected'
    ))
);

-- Indexes for change_event_approvals
CREATE INDEX idx_ce_approvals_change_event ON change_event_approvals(change_event_id);
CREATE INDEX idx_ce_approvals_approver ON change_event_approvals(approver_id);
CREATE INDEX idx_ce_approvals_status ON change_event_approvals(approval_status);

-- =====================================================
-- 6. MATERIALIZED VIEW FOR SUMMARY
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS change_events_summary AS
SELECT
    ce.id,
    ce.project_id,
    ce.number,
    ce.title,
    ce.type,
    ce.status,
    ce.origin,
    ce.expecting_revenue,
    COALESCE(SUM(cel.revenue_rom), 0) as total_revenue_rom,
    COALESCE(SUM(cel.cost_rom), 0) as total_cost_rom,
    COALESCE(SUM(cel.non_committed_cost), 0) as total_non_committed_cost,
    COUNT(DISTINCT cel.id) as line_item_count,
    COUNT(DISTINCT cea.id) as attachment_count,
    ce.created_at,
    ce.created_by
FROM change_events ce
LEFT JOIN change_event_line_items cel ON ce.id = cel.change_event_id
LEFT JOIN change_event_attachments cea ON ce.id = cea.change_event_id
WHERE ce.deleted_at IS NULL
GROUP BY ce.id;

-- Index on materialized view
CREATE INDEX idx_change_events_summary_project ON change_events_summary(project_id);
CREATE INDEX idx_change_events_summary_status ON change_events_summary(status);

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_change_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER change_events_updated_at
    BEFORE UPDATE ON change_events
    FOR EACH ROW
    EXECUTE FUNCTION update_change_events_updated_at();

CREATE TRIGGER change_event_line_items_updated_at
    BEFORE UPDATE ON change_event_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_change_events_updated_at();

-- Audit trail trigger for change_events
CREATE OR REPLACE FUNCTION log_change_event_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO change_event_history (
            change_event_id,
            field_name,
            old_value,
            new_value,
            changed_by,
            change_type
        ) VALUES (
            NEW.id,
            'status',
            NULL,
            NEW.status,
            NEW.created_by,
            'create'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO change_event_history (
                change_event_id,
                field_name,
                old_value,
                new_value,
                changed_by,
                change_type
            ) VALUES (
                NEW.id,
                'status',
                OLD.status,
                NEW.status,
                NEW.updated_by,
                'status_change'
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_change_events_audit
    AFTER INSERT OR UPDATE ON change_events
    FOR EACH ROW
    EXECUTE FUNCTION log_change_event_changes();

-- Refresh materialized view on data changes
CREATE OR REPLACE FUNCTION refresh_change_events_summary()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY change_events_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_summary_on_change_event
    AFTER INSERT OR UPDATE OR DELETE ON change_events
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_change_events_summary();

CREATE TRIGGER refresh_summary_on_line_item
    AFTER INSERT OR UPDATE OR DELETE ON change_event_line_items
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_change_events_summary();

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Get next change event number for a project
CREATE OR REPLACE FUNCTION get_next_change_event_number(p_project_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(number AS INTEGER)), 0) + 1
    INTO next_num
    FROM change_events
    WHERE project_id = p_project_id
      AND deleted_at IS NULL
      AND number ~ '^[0-9]+$'; -- Only numeric numbers

    RETURN LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. COMMENTS
-- =====================================================
COMMENT ON TABLE change_events IS 'Tracks potential project changes before they become change orders';
COMMENT ON TABLE change_event_line_items IS 'Line item details for change events with cost/revenue estimates';
COMMENT ON TABLE change_event_attachments IS 'File attachments for change events';
COMMENT ON TABLE change_event_history IS 'Complete audit trail of all change event modifications';
COMMENT ON TABLE change_event_approvals IS 'Approval workflow state for change events';
COMMENT ON MATERIALIZED VIEW change_events_summary IS 'Aggregated view of change events with totals';

COMMENT ON COLUMN change_events.number IS 'Sequential number per project (001, 002, 003...)';
COMMENT ON COLUMN change_events.expecting_revenue IS 'Whether revenue is expected from this change';
COMMENT ON COLUMN change_events.line_item_revenue_source IS 'Method for calculating revenue (Match Cost, Manual, Percentage, Fixed)';
COMMENT ON COLUMN change_event_line_items.revenue_rom IS 'Revenue rough order of magnitude estimate';
COMMENT ON COLUMN change_event_line_items.cost_rom IS 'Cost rough order of magnitude estimate';
