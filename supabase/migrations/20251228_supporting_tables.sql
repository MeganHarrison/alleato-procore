-- Migration: Supporting Tables for Prime Contracts
-- Created: 2025-12-28
-- Description: Creates vendors, contract_documents, contract_snapshots, and contract_views tables

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Create contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'amendment', 'insurance', 'bond', 'lien_waiver', 'change_order', 'invoice', 'other')),
  file_path TEXT NOT NULL, -- Path in Supabase storage
  file_size BIGINT, -- Size in bytes
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current_version BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contract_snapshots table
CREATE TABLE IF NOT EXISTS contract_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot_data JSONB NOT NULL, -- Full contract state at snapshot time
  created_by UUID REFERENCES auth.users(id),
  reason TEXT, -- Why snapshot was created (e.g., "Monthly Backup", "Before Change Order", "Annual Report")
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contract_views table (custom user views/filters)
CREATE TABLE IF NOT EXISTS contract_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  view_name TEXT NOT NULL,
  description TEXT,
  filters JSONB, -- Saved filter criteria
  columns JSONB, -- Visible columns configuration
  sort_order JSONB, -- Sort configuration
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false, -- If true, other company users can see this view
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, view_name)
);

-- Add FK constraint to prime_contracts.vendor_id now that vendors table exists
ALTER TABLE prime_contracts
  DROP CONSTRAINT IF EXISTS prime_contracts_vendor_id_fkey;

ALTER TABLE prime_contracts
  ADD CONSTRAINT prime_contracts_vendor_id_fkey
  FOREIGN KEY (vendor_id)
  REFERENCES vendors(id)
  ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_company ON vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at);

CREATE INDEX IF NOT EXISTS idx_contract_documents_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_type ON contract_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_contract_documents_uploaded_by ON contract_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_contract_documents_uploaded_at ON contract_documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_contract_documents_is_current ON contract_documents(is_current_version);

CREATE INDEX IF NOT EXISTS idx_contract_snapshots_contract ON contract_snapshots(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_snapshots_date ON contract_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_contract_snapshots_created_by ON contract_snapshots(created_by);

CREATE INDEX IF NOT EXISTS idx_contract_views_user ON contract_views(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_views_company ON contract_views(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_views_is_default ON contract_views(is_default);
CREATE INDEX IF NOT EXISTS idx_contract_views_is_shared ON contract_views(is_shared);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

CREATE OR REPLACE FUNCTION update_contract_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_documents_updated_at
  BEFORE UPDATE ON contract_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_documents_updated_at();

CREATE OR REPLACE FUNCTION update_contract_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_views_updated_at
  BEFORE UPDATE ON contract_views
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_views_updated_at();

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Users can view vendors in their company"
  ON vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vendors.company_id
      AND EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors can create vendors"
  ON vendors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vendors.company_id
      AND EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.user_id = auth.uid()
        AND project_members.access IN ('editor', 'admin', 'owner')
      )
    )
  );

CREATE POLICY "Editors can update vendors"
  ON vendors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vendors.company_id
      AND EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.user_id = auth.uid()
        AND project_members.access IN ('editor', 'admin', 'owner')
      )
    )
  );

CREATE POLICY "Admins can delete vendors"
  ON vendors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vendors.company_id
      AND EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.user_id = auth.uid()
        AND project_members.access IN ('admin', 'owner')
      )
    )
  );

-- RLS Policies for contract_documents
CREATE POLICY "Users can view documents in their projects"
  ON contract_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_documents.contract_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can upload documents"
  ON contract_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_documents.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Editors can update documents"
  ON contract_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_documents.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Admins can delete documents"
  ON contract_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_documents.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- RLS Policies for contract_snapshots
CREATE POLICY "Users can view snapshots in their projects"
  ON contract_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_snapshots.contract_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create snapshots"
  ON contract_snapshots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_snapshots.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Admins can delete snapshots"
  ON contract_snapshots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_snapshots.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- RLS Policies for contract_views
CREATE POLICY "Users can view their own views"
  ON contract_views
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shared views in their company"
  ON contract_views
  FOR SELECT
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = contract_views.company_id
      AND EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create their own views"
  ON contract_views
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own views"
  ON contract_views
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own views"
  ON contract_views
  FOR DELETE
  USING (user_id = auth.uid());

-- Add comments to tables
COMMENT ON TABLE vendors IS 'Vendor/contractor companies that can be linked to prime contracts';
COMMENT ON COLUMN vendors.company_id IS 'Company that owns this vendor relationship';
COMMENT ON COLUMN vendors.is_active IS 'Whether vendor is currently active for new contracts';

COMMENT ON TABLE contract_documents IS 'Document attachments for prime contracts stored in Supabase storage';
COMMENT ON COLUMN contract_documents.document_type IS 'Type of document: contract, amendment, insurance, bond, lien_waiver, change_order, invoice, other';
COMMENT ON COLUMN contract_documents.file_path IS 'Path to file in Supabase storage bucket';
COMMENT ON COLUMN contract_documents.version IS 'Document version number (increments with each upload of same document)';
COMMENT ON COLUMN contract_documents.is_current_version IS 'Whether this is the latest version of the document';

COMMENT ON TABLE contract_snapshots IS 'Point-in-time snapshots of contract state for historical tracking';
COMMENT ON COLUMN contract_snapshots.snapshot_data IS 'Complete contract data (JSONB) at the time of snapshot';
COMMENT ON COLUMN contract_snapshots.reason IS 'Reason for snapshot creation (e.g., Monthly Backup, Before Change Order)';

COMMENT ON TABLE contract_views IS 'Custom user-defined views for filtering and displaying contracts';
COMMENT ON COLUMN contract_views.filters IS 'JSONB filter criteria for the view';
COMMENT ON COLUMN contract_views.columns IS 'JSONB configuration of visible columns';
COMMENT ON COLUMN contract_views.sort_order IS 'JSONB sort configuration';
COMMENT ON COLUMN contract_views.is_default IS 'Whether this is the user''s default view';
COMMENT ON COLUMN contract_views.is_shared IS 'If true, other users in the company can see and use this view';
