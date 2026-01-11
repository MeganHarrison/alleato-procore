-- Fix materialized view refresh trigger
-- Remove CONCURRENTLY since we don't have a unique index

DROP TRIGGER IF EXISTS refresh_summary_on_change_event ON change_events;
DROP TRIGGER IF EXISTS refresh_summary_on_line_item ON change_event_line_items;
DROP FUNCTION IF EXISTS refresh_change_events_summary();

CREATE OR REPLACE FUNCTION refresh_change_events_summary()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW change_events_summary;
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
