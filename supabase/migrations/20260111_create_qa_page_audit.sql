-- QA Page Audit Table
-- Tracks design system compliance for all pages in the application

CREATE TABLE IF NOT EXISTS qa_page_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Page identification
  page_path TEXT NOT NULL UNIQUE,  -- e.g., "[projectId]/contracts/page.tsx"
  page_name TEXT NOT NULL,          -- e.g., "Contracts"
  page_type TEXT NOT NULL DEFAULT 'unknown',  -- project, table, global, auth, chat, admin, dev

  -- Auto-detected fields (updated by scanner)
  header_component TEXT,            -- e.g., "PageHeader", "ProjectPageHeader", "Custom h1", "NONE"
  auto_status TEXT NOT NULL DEFAULT 'pending',  -- PASS, FAIL, EXEMPT, PLACEHOLDER, pending

  -- Manual override fields (editable in UI)
  manual_status TEXT,               -- Override auto_status if set
  notes TEXT,                       -- Manual notes about the page
  priority INTEGER DEFAULT 3,       -- 1 = high, 2 = medium, 3 = low
  assigned_to TEXT,                 -- Who's responsible for fixing

  -- Tracking
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_qa_page_audit_path ON qa_page_audit(page_path);
CREATE INDEX IF NOT EXISTS idx_qa_page_audit_status ON qa_page_audit(auto_status);
CREATE INDEX IF NOT EXISTS idx_qa_page_audit_type ON qa_page_audit(page_type);

-- Function to get effective status (manual override or auto)
CREATE OR REPLACE FUNCTION qa_effective_status(page qa_page_audit)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(page.manual_status, page.auto_status);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_qa_page_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qa_page_audit_updated_at ON qa_page_audit;
CREATE TRIGGER qa_page_audit_updated_at
  BEFORE UPDATE ON qa_page_audit
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_page_audit_updated_at();

-- RLS Policies (allow authenticated users to read/write)
ALTER TABLE qa_page_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON qa_page_audit;
CREATE POLICY "Allow authenticated read" ON qa_page_audit
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON qa_page_audit;
CREATE POLICY "Allow authenticated insert" ON qa_page_audit
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON qa_page_audit;
CREATE POLICY "Allow authenticated update" ON qa_page_audit
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON qa_page_audit;
CREATE POLICY "Allow authenticated delete" ON qa_page_audit
  FOR DELETE TO authenticated USING (true);

-- Comment
COMMENT ON TABLE qa_page_audit IS 'Tracks design system compliance for all application pages';
