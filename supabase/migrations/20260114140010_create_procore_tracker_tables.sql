-- Migration: Create Procore Feature Tracker Tables
-- Purpose: Track Procore features, pages, and screenshots for implementation reference

-- =============================================================================
-- UPDATE procore_features with additional tracking fields
-- =============================================================================
ALTER TABLE procore_features
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS procore_tool_url TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'needs_review', 'complete')),
  ADD COLUMN IF NOT EXISTS match_score NUMERIC,
  ADD COLUMN IF NOT EXISTS linear_project_id TEXT,
  ADD COLUMN IF NOT EXISTS linear_issue_id TEXT,
  ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================================================
-- CREATE procore_pages table
-- =============================================================================
CREATE TABLE IF NOT EXISTS procore_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES procore_features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  page_type TEXT CHECK(page_type IN ('list', 'detail', 'form', 'modal', 'tab', 'dashboard', 'settings', 'report', 'other')),

  -- Procore Reference
  procore_url TEXT,
  screenshot_path TEXT,
  dom_path TEXT,
  metadata_path TEXT,

  -- Implementation Reference
  alleato_route TEXT,
  alleato_url TEXT,

  -- Status
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'needs_review', 'complete', 'blocked')),
  implementation_notes TEXT,

  -- Metadata from crawl
  button_count INTEGER,
  form_field_count INTEGER,
  table_column_count INTEGER,

  -- Tracking
  linear_issue_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(feature_id, slug)
);

-- =============================================================================
-- CREATE procore_screenshots table for storing actual screenshot data
-- =============================================================================
CREATE TABLE IF NOT EXISTS procore_page_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES procore_pages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_procore_pages_feature ON procore_pages(feature_id);
CREATE INDEX IF NOT EXISTS idx_procore_pages_status ON procore_pages(status);
CREATE INDEX IF NOT EXISTS idx_procore_pages_type ON procore_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_procore_screenshots_page ON procore_page_screenshots(page_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE procore_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE procore_page_screenshots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all pages and screenshots
CREATE POLICY "procore_pages_select_policy" ON procore_pages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "procore_pages_insert_policy" ON procore_pages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "procore_pages_update_policy" ON procore_pages
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "procore_pages_delete_policy" ON procore_pages
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "procore_screenshots_select_policy" ON procore_page_screenshots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "procore_screenshots_insert_policy" ON procore_page_screenshots
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- UPDATE TRIGGER for updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_procore_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER procore_pages_updated_at_trigger
  BEFORE UPDATE ON procore_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_procore_pages_updated_at();

-- Also add RLS to procore_features if not already present
ALTER TABLE procore_features ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'procore_features' AND policyname = 'procore_features_select_policy'
  ) THEN
    CREATE POLICY "procore_features_select_policy" ON procore_features
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'procore_features' AND policyname = 'procore_features_update_policy'
  ) THEN
    CREATE POLICY "procore_features_update_policy" ON procore_features
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
