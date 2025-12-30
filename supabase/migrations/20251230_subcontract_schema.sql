-- Migration: Subcontract/Commitment Schema
-- Created: 2025-12-30
-- Description: Complete schema for subcontract commitments form

-- ============================================================================
-- MAIN SUBCONTRACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subcontracts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- General Information
  contract_number TEXT NOT NULL,
  contract_company_id UUID REFERENCES public.companies(id),
  title TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Pending', 'Approved', 'Executed', 'Closed', 'Void')),
  executed BOOLEAN NOT NULL DEFAULT false,
  default_retainage_percent NUMERIC(5,2) CHECK (default_retainage_percent >= 0 AND default_retainage_percent <= 100),
  description TEXT, -- Rich text content

  -- Scope
  inclusions TEXT, -- Rich text content
  exclusions TEXT, -- Rich text content

  -- Contract Dates
  start_date TEXT, -- Stored as mm/dd/yyyy string
  estimated_completion_date TEXT,
  actual_completion_date TEXT,
  contract_date TEXT,
  signed_contract_received_date TEXT,
  issued_on_date TEXT,

  -- Privacy
  is_private BOOLEAN DEFAULT true,
  non_admin_user_ids UUID[] DEFAULT '{}',
  allow_non_admin_view_sov_items BOOLEAN DEFAULT false,

  -- Invoice Contacts (conditional on contract_company_id)
  invoice_contact_ids UUID[] DEFAULT '{}',

  -- Relationships
  project_id INTEGER NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT contract_number_project_unique UNIQUE (contract_number, project_id)
);

-- ============================================================================
-- SCHEDULE OF VALUES (SOV) LINE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subcontract_sov_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  subcontract_id UUID NOT NULL REFERENCES public.subcontracts(id) ON DELETE CASCADE,

  -- Line Item Fields (from DOM spec)
  line_number INTEGER, -- Row number (#)
  change_event_line_item TEXT, -- Optional reference to change event
  budget_code TEXT, -- Link to budget/cost codes
  description TEXT,

  -- Financial Fields
  amount NUMERIC(15,2) DEFAULT 0 CHECK (amount >= 0),
  billed_to_date NUMERIC(15,2) DEFAULT 0 CHECK (billed_to_date >= 0),
  -- amount_remaining is computed: amount - billed_to_date

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ordering
  sort_order INTEGER,

  -- Constraints
  CONSTRAINT sov_line_number_unique UNIQUE (subcontract_id, line_number)
);

-- ============================================================================
-- ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subcontract_attachments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  subcontract_id UUID NOT NULL REFERENCES public.subcontracts(id) ON DELETE CASCADE,

  -- File Info
  file_name TEXT NOT NULL,
  file_size BIGINT, -- in bytes
  file_type TEXT, -- MIME type
  storage_path TEXT NOT NULL, -- Path in Supabase Storage

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Subcontracts indexes
CREATE INDEX IF NOT EXISTS idx_subcontracts_project_id ON public.subcontracts(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_company_id ON public.subcontracts(contract_company_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_status ON public.subcontracts(status);
CREATE INDEX IF NOT EXISTS idx_subcontracts_contract_number ON public.subcontracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_subcontracts_created_at ON public.subcontracts(created_at DESC);

-- SOV items indexes
CREATE INDEX IF NOT EXISTS idx_sov_items_subcontract_id ON public.subcontract_sov_items(subcontract_id);
CREATE INDEX IF NOT EXISTS idx_sov_items_budget_code ON public.subcontract_sov_items(budget_code);
CREATE INDEX IF NOT EXISTS idx_sov_items_sort_order ON public.subcontract_sov_items(subcontract_id, sort_order);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_subcontract_id ON public.subcontract_attachments(subcontract_id);

-- ============================================================================
-- COMPUTED COLUMNS & VIEWS
-- ============================================================================

-- View with computed fields
CREATE OR REPLACE VIEW public.subcontracts_with_totals AS
SELECT
  s.*,
  -- Computed SOV totals
  COALESCE(sov_totals.total_amount, 0) as total_sov_amount,
  COALESCE(sov_totals.total_billed, 0) as total_billed_to_date,
  COALESCE(sov_totals.total_amount, 0) - COALESCE(sov_totals.total_billed, 0) as total_amount_remaining,
  COALESCE(sov_totals.line_item_count, 0) as sov_line_count,
  -- Attachment count
  COALESCE(att_count.count, 0) as attachment_count,
  -- Company info
  c.name as company_name,
  c.type as company_type
FROM
  public.subcontracts s
  LEFT JOIN (
    SELECT
      subcontract_id,
      SUM(amount) as total_amount,
      SUM(billed_to_date) as total_billed,
      COUNT(*) as line_item_count
    FROM public.subcontract_sov_items
    GROUP BY subcontract_id
  ) sov_totals ON s.id = sov_totals.subcontract_id
  LEFT JOIN (
    SELECT
      subcontract_id,
      COUNT(*) as count
    FROM public.subcontract_attachments
    GROUP BY subcontract_id
  ) att_count ON s.id = att_count.subcontract_id
  LEFT JOIN public.companies c ON s.contract_company_id = c.id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subcontracts_updated_at
  BEFORE UPDATE ON public.subcontracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sov_items_updated_at
  BEFORE UPDATE ON public.subcontract_sov_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate contract number if not provided
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    -- Get next number for this project
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '\d+') AS INTEGER)), 0) + 1
    INTO NEW.contract_number
    FROM public.subcontracts
    WHERE project_id = NEW.project_id
      AND contract_number ~ '^SC-\d+$';

    NEW.contract_number := 'SC-' || LPAD(NEW.contract_number::TEXT, 3, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_subcontract_number
  BEFORE INSERT ON public.subcontracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_number();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.subcontracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontract_sov_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontract_attachments ENABLE ROW LEVEL SECURITY;

-- Subcontracts policies
CREATE POLICY "Users can view subcontracts for their projects"
  ON public.subcontracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_users pu
      WHERE pu.project_id = subcontracts.project_id
        AND pu.user_id = auth.uid()
    )
    OR
    -- If private, check if user is in non_admin_user_ids
    (is_private = false)
    OR
    (is_private = true AND auth.uid() = ANY(non_admin_user_ids))
  );

CREATE POLICY "Users can create subcontracts for their projects"
  ON public.subcontracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_users pu
      WHERE pu.project_id = subcontracts.project_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'project_manager', 'editor')
    )
  );

CREATE POLICY "Users can update subcontracts for their projects"
  ON public.subcontracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_users pu
      WHERE pu.project_id = subcontracts.project_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'project_manager', 'editor')
    )
  );

CREATE POLICY "Users can delete subcontracts for their projects"
  ON public.subcontracts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_users pu
      WHERE pu.project_id = subcontracts.project_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'project_manager')
    )
  );

-- SOV items policies (inherit from parent subcontract)
CREATE POLICY "Users can view SOV items"
  ON public.subcontract_sov_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subcontracts s
      INNER JOIN public.project_users pu ON pu.project_id = s.project_id
      WHERE s.id = subcontract_sov_items.subcontract_id
        AND pu.user_id = auth.uid()
        AND (
          s.is_private = false
          OR auth.uid() = ANY(s.non_admin_user_ids)
          OR (s.allow_non_admin_view_sov_items = true AND auth.uid() = ANY(s.non_admin_user_ids))
        )
    )
  );

CREATE POLICY "Users can manage SOV items"
  ON public.subcontract_sov_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subcontracts s
      INNER JOIN public.project_users pu ON pu.project_id = s.project_id
      WHERE s.id = subcontract_sov_items.subcontract_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'project_manager', 'editor')
    )
  );

-- Attachments policies (inherit from parent subcontract)
CREATE POLICY "Users can view attachments"
  ON public.subcontract_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subcontracts s
      INNER JOIN public.project_users pu ON pu.project_id = s.project_id
      WHERE s.id = subcontract_attachments.subcontract_id
        AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage attachments"
  ON public.subcontract_attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subcontracts s
      INNER JOIN public.project_users pu ON pu.project_id = s.project_id
      WHERE s.id = subcontract_attachments.subcontract_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'project_manager', 'editor')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.subcontracts IS 'Subcontract commitments/contracts table matching Procore DOM specification';
COMMENT ON TABLE public.subcontract_sov_items IS 'Schedule of Values (SOV) line items for subcontracts';
COMMENT ON TABLE public.subcontract_attachments IS 'File attachments for subcontracts';

COMMENT ON COLUMN public.subcontracts.contract_number IS 'Unique contract identifier per project (e.g., SC-002)';
COMMENT ON COLUMN public.subcontracts.status IS 'Contract lifecycle state: Draft, Sent, Pending, Approved, Executed, Closed, Void';
COMMENT ON COLUMN public.subcontracts.executed IS 'Indicates if contract has been executed (signed)';
COMMENT ON COLUMN public.subcontracts.default_retainage_percent IS 'Default retainage percentage (0-100) applied to invoices';
COMMENT ON COLUMN public.subcontracts.is_private IS 'If true, only project admins and specified users can access';
COMMENT ON COLUMN public.subcontracts.allow_non_admin_view_sov_items IS 'If true, non-admin users can view SOV line items';

COMMENT ON COLUMN public.subcontract_sov_items.line_number IS 'Display order number for SOV line item';
COMMENT ON COLUMN public.subcontract_sov_items.budget_code IS 'Reference to budget/cost code';
COMMENT ON COLUMN public.subcontract_sov_items.amount IS 'Total line item amount';
COMMENT ON COLUMN public.subcontract_sov_items.billed_to_date IS 'Amount billed so far (from invoices)';

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO public.subcontracts (
  project_id,
  contract_number,
  title,
  status,
  executed,
  default_retainage_percent,
  description,
  inclusions,
  exclusions,
  is_private
) VALUES (
  67, -- Replace with actual project_id
  'SC-001',
  'Electrical Installation - Phase 1',
  'Draft',
  false,
  10.00,
  '<p>Complete electrical installation for main building</p>',
  '<p>All labor and materials for electrical rough-in and finish work</p>',
  '<p>Does not include specialty lighting fixtures</p>',
  true
);
*/
