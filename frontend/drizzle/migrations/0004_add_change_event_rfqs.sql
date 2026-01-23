-- =====================================================
-- Migration 0004: Change Event RFQ Data Structures
-- Created: 2026-01-15
-- Purpose: Add database support for RFQ creation/response flows
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CHANGE EVENT RFQS
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
    rfq_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    assigned_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    assigned_contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
    include_attachments BOOLEAN NOT NULL DEFAULT true,
    due_date DATE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    sent_at TIMESTAMPTZ,
    response_received_at TIMESTAMPTZ,
    estimated_total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT change_event_rfqs_unique_number UNIQUE (project_id, rfq_number),
    CONSTRAINT change_event_rfqs_status_check CHECK (status IN (
        'Draft',
        'Sent',
        'Awaiting Response',
        'Response Received',
        'Closed',
        'Cancelled'
    ))
);

CREATE INDEX IF NOT EXISTS idx_change_event_rfqs_project
    ON change_event_rfqs(project_id);
CREATE INDEX IF NOT EXISTS idx_change_event_rfqs_change_event
    ON change_event_rfqs(change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_event_rfqs_status
    ON change_event_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_change_event_rfqs_due_date
    ON change_event_rfqs(due_date);

-- =====================================================
-- 2. CHANGE EVENT RFQ RESPONSES
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_rfq_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES change_event_rfqs(id) ON DELETE CASCADE,
    line_item_id UUID REFERENCES change_event_line_items(id) ON DELETE SET NULL,
    responder_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    responder_contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    extended_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT change_event_rfq_responses_status_check CHECK (status IN (
        'Draft',
        'Submitted',
        'Accepted',
        'Rejected'
    )),
    CONSTRAINT change_event_rfq_responses_unique_submission
        UNIQUE (rfq_id, line_item_id, responder_company_id, responder_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_change_event_rfq_responses_rfq
    ON change_event_rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_change_event_rfq_responses_status
    ON change_event_rfq_responses(status);

-- =====================================================
-- 3. CHANGE EVENT RFQ ATTACHMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS change_event_rfq_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES change_event_rfqs(id) ON DELETE CASCADE,
    rfq_response_id UUID REFERENCES change_event_rfq_responses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT change_event_rfq_attachments_parent_check
        CHECK (rfq_id IS NOT NULL OR rfq_response_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_change_event_rfq_attachments_rfq
    ON change_event_rfq_attachments(rfq_id);
CREATE INDEX IF NOT EXISTS idx_change_event_rfq_attachments_response
    ON change_event_rfq_attachments(rfq_response_id);

-- =====================================================
-- 4. UPDATED SUMMARY VIEW WITH RFQ COUNTS
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS change_events_summary;

CREATE MATERIALIZED VIEW change_events_summary AS
SELECT
    ce.id,
    ce.project_id,
    ce.number,
    ce.title,
    ce.type,
    ce.status,
    ce.origin,
    ce.expecting_revenue,
    COALESCE(SUM(cel.revenue_rom), 0) AS total_revenue_rom,
    COALESCE(SUM(cel.cost_rom), 0) AS total_cost_rom,
    COALESCE(SUM(cel.non_committed_cost), 0) AS total_non_committed_cost,
    COUNT(DISTINCT cel.id) AS line_item_count,
    COUNT(DISTINCT cea.id) AS attachment_count,
    COUNT(DISTINCT cer.id) AS rfq_count,
    COALESCE(SUM(cer.estimated_total_amount), 0) AS total_rfq_amount,
    ce.created_at,
    ce.created_by
FROM change_events ce
LEFT JOIN change_event_line_items cel ON ce.id = cel.change_event_id
LEFT JOIN change_event_attachments cea ON ce.id = cea.change_event_id
LEFT JOIN change_event_rfqs cer ON ce.id = cer.change_event_id
WHERE ce.deleted_at IS NULL
GROUP BY ce.id;

CREATE INDEX IF NOT EXISTS idx_change_events_summary_project
    ON change_events_summary(project_id);
CREATE INDEX IF NOT EXISTS idx_change_events_summary_status
    ON change_events_summary(status);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================
CREATE TRIGGER change_event_rfqs_updated_at
    BEFORE UPDATE ON change_event_rfqs
    FOR EACH ROW
    EXECUTE FUNCTION update_change_events_updated_at();

CREATE TRIGGER change_event_rfq_responses_updated_at
    BEFORE UPDATE ON change_event_rfq_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_change_events_updated_at();

CREATE TRIGGER refresh_summary_on_rfqs
    AFTER INSERT OR UPDATE OR DELETE ON change_event_rfqs
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_change_events_summary();

CREATE TRIGGER refresh_summary_on_rfq_responses
    AFTER INSERT OR UPDATE OR DELETE ON change_event_rfq_responses
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_change_events_summary();

COMMENT ON TABLE change_event_rfqs IS 'RFQs generated from change events for subcontractor pricing';
COMMENT ON TABLE change_event_rfq_responses IS 'Collaborator responses to change event RFQs';
COMMENT ON TABLE change_event_rfq_attachments IS 'Supporting documents uploaded for RFQs or responses';

COMMENT ON COLUMN change_event_rfqs.estimated_total_amount IS 'Estimated total amount of the RFQ request';
COMMENT ON COLUMN change_event_rfq_responses.extended_amount IS 'Unit price * line item quantity snapshot';
