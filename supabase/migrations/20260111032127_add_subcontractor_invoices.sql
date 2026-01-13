-- =============================================================================
-- ADD SUBCONTRACTOR INVOICES AND LINE ITEMS TABLES
-- =============================================================================
-- Description: Create subcontractor invoice tracking system for purchase orders,
--              subcontracts, and work orders with complete RLS policies
--
-- Affected Tables:
--   - subcontractor_invoices (new)
--   - subcontractor_invoice_line_items (new)
--
-- Related Tables:
--   - projects (foreign key)
--   - commitments_unified (view for commitment data)
--   - purchase_orders, subcontracts, work_orders (commitment sources)
--   - billing_periods (optional relationship)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: subcontractor_invoices
-- -----------------------------------------------------------------------------
-- Invoices received from subcontractors for commitments (PO, Subcontract, Work Order)
-- Tracks billing amounts, retention, approval status, and payment tracking

CREATE TABLE IF NOT EXISTS public.subcontractor_invoices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Project and Commitment References
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  commitment_id TEXT NOT NULL, -- Links to purchase_orders.id, subcontracts.id, or work_orders.id (UUID format)
  commitment_type VARCHAR(50) NOT NULL CHECK (commitment_type IN ('purchase_order', 'subcontract', 'work_order')),
  billing_period_id TEXT REFERENCES public.billing_periods(id) ON DELETE SET NULL,

  -- Invoice Identification
  invoice_number VARCHAR(100),
  invoice_date DATE,
  period_start DATE,
  period_end DATE,
  due_date DATE,

  -- Status and Workflow
  status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paid', 'voided')),

  -- Financial Amounts
  subtotal DECIMAL(15,2) DEFAULT 0 NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  retention_percent DECIMAL(5,2) DEFAULT 0 NOT NULL CHECK (retention_percent >= 0 AND retention_percent <= 100),
  retention_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  paid_to_date DECIMAL(15,2) DEFAULT 0 NOT NULL,
  balance_due DECIMAL(15,2) DEFAULT 0 NOT NULL,

  -- Additional Information
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment metadata

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT subcontractor_invoices_amounts_check CHECK (
    subtotal >= 0 AND
    tax_amount >= 0 AND
    retention_amount >= 0 AND
    total_amount >= 0 AND
    paid_to_date >= 0 AND
    balance_due >= 0
  ),
  CONSTRAINT subcontractor_invoices_dates_check CHECK (
    period_start IS NULL OR period_end IS NULL OR period_start <= period_end
  )
);

-- Table Comments
COMMENT ON TABLE public.subcontractor_invoices IS
  'Invoices received from subcontractors for purchase orders, subcontracts, and work orders. Tracks billing amounts, retention, approval status, and payment details.';

COMMENT ON COLUMN public.subcontractor_invoices.commitment_id IS
  'UUID reference to the commitment (purchase_order, subcontract, or work_order)';

COMMENT ON COLUMN public.subcontractor_invoices.commitment_type IS
  'Type of commitment: purchase_order, subcontract, or work_order';

COMMENT ON COLUMN public.subcontractor_invoices.retention_percent IS
  'Retention percentage withheld from payment (0-100)';

COMMENT ON COLUMN public.subcontractor_invoices.balance_due IS
  'Remaining balance after payments: total_amount - paid_to_date';

-- -----------------------------------------------------------------------------
-- TABLE: subcontractor_invoice_line_items
-- -----------------------------------------------------------------------------
-- Line items for subcontractor invoices with quantity and amount tracking

CREATE TABLE IF NOT EXISTS public.subcontractor_invoice_line_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Invoice Reference
  invoice_id BIGINT NOT NULL REFERENCES public.subcontractor_invoices(id) ON DELETE CASCADE,

  -- Commitment Line Item Reference (optional - for detailed tracking)
  commitment_line_item_id TEXT, -- Reference to line items from commitments
  cost_code_id BIGINT, -- Optional reference to cost codes

  -- Line Item Details
  description TEXT NOT NULL,
  unit_of_measure VARCHAR(50),

  -- This Period (Current Invoice)
  this_period_quantity DECIMAL(15,4) DEFAULT 0 NOT NULL,
  this_period_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,

  -- Previous Periods (Cumulative Before This Invoice)
  previous_quantity DECIMAL(15,4) DEFAULT 0 NOT NULL,
  previous_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,

  -- Total to Date (Including This Invoice)
  total_quantity DECIMAL(15,4) GENERATED ALWAYS AS (previous_quantity + this_period_quantity) STORED,
  total_amount DECIMAL(15,2) GENERATED ALWAYS AS (previous_amount + this_period_amount) STORED,

  -- Budget Tracking
  scheduled_value DECIMAL(15,2), -- Original budgeted amount for this line item
  percent_complete DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN scheduled_value IS NULL OR scheduled_value = 0 THEN NULL
      ELSE LEAST(((previous_amount + this_period_amount) / scheduled_value * 100), 100)
    END
  ) STORED,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT subcontractor_invoice_line_items_amounts_check CHECK (
    this_period_quantity >= 0 AND
    this_period_amount >= 0 AND
    previous_quantity >= 0 AND
    previous_amount >= 0
  )
);

-- Table Comments
COMMENT ON TABLE public.subcontractor_invoice_line_items IS
  'Line items for subcontractor invoices tracking quantities and amounts per billing period';

COMMENT ON COLUMN public.subcontractor_invoice_line_items.total_quantity IS
  'Computed: previous_quantity + this_period_quantity';

COMMENT ON COLUMN public.subcontractor_invoice_line_items.total_amount IS
  'Computed: previous_amount + this_period_amount';

COMMENT ON COLUMN public.subcontractor_invoice_line_items.percent_complete IS
  'Computed: (total_amount / scheduled_value) * 100, capped at 100%';

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

-- Subcontractor Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_project_id
  ON public.subcontractor_invoices(project_id);

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_commitment
  ON public.subcontractor_invoices(commitment_id, commitment_type);

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_status
  ON public.subcontractor_invoices(status);

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_invoice_date
  ON public.subcontractor_invoices(invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_billing_period
  ON public.subcontractor_invoices(billing_period_id) WHERE billing_period_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_created_by
  ON public.subcontractor_invoices(created_by);

-- Composite index for common queries (project + status)
CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_project_status
  ON public.subcontractor_invoices(project_id, status);

-- Subcontractor Invoice Line Items Indexes
CREATE INDEX IF NOT EXISTS idx_subcontractor_invoice_line_items_invoice_id
  ON public.subcontractor_invoice_line_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoice_line_items_commitment_line
  ON public.subcontractor_invoice_line_items(commitment_line_item_id)
  WHERE commitment_line_item_id IS NOT NULL;

-- Index for RLS policy performance (matches project_members pattern)
CREATE INDEX IF NOT EXISTS idx_project_members_user_project_subcontractor_invoices
  ON public.project_members(user_id, project_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS on both tables
ALTER TABLE public.subcontractor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SUBCONTRACTOR INVOICES RLS POLICIES
-- =============================================================================

-- SELECT: Users can view invoices from their projects
CREATE POLICY "Users can view subcontractor invoices from their projects"
  ON public.subcontractor_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = subcontractor_invoices.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- INSERT: Users can create invoices for their projects
CREATE POLICY "Users can create subcontractor invoices for their projects"
  ON public.subcontractor_invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = subcontractor_invoices.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update invoices from their projects
CREATE POLICY "Users can update subcontractor invoices from their projects"
  ON public.subcontractor_invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = subcontractor_invoices.project_id
        AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = subcontractor_invoices.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete invoices from their projects (soft delete preferred in production)
CREATE POLICY "Users can delete subcontractor invoices from their projects"
  ON public.subcontractor_invoices FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = subcontractor_invoices.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Service Role Bypass (for admin operations)
CREATE POLICY "Service role can manage all subcontractor invoices"
  ON public.subcontractor_invoices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- SUBCONTRACTOR INVOICE LINE ITEMS RLS POLICIES
-- =============================================================================

-- SELECT: Users can view line items if they can view the parent invoice
CREATE POLICY "Users can view subcontractor invoice line items from their projects"
  ON public.subcontractor_invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.subcontractor_invoices si
      JOIN public.project_members pm ON pm.project_id = si.project_id
      WHERE si.id = subcontractor_invoice_line_items.invoice_id
        AND pm.user_id = auth.uid()
    )
  );

-- INSERT: Users can create line items for invoices in their projects
CREATE POLICY "Users can create subcontractor invoice line items for their projects"
  ON public.subcontractor_invoice_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.subcontractor_invoices si
      JOIN public.project_members pm ON pm.project_id = si.project_id
      WHERE si.id = subcontractor_invoice_line_items.invoice_id
        AND pm.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update line items from their projects
CREATE POLICY "Users can update subcontractor invoice line items from their projects"
  ON public.subcontractor_invoice_line_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.subcontractor_invoices si
      JOIN public.project_members pm ON pm.project_id = si.project_id
      WHERE si.id = subcontractor_invoice_line_items.invoice_id
        AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.subcontractor_invoices si
      JOIN public.project_members pm ON pm.project_id = si.project_id
      WHERE si.id = subcontractor_invoice_line_items.invoice_id
        AND pm.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete line items from their projects
CREATE POLICY "Users can delete subcontractor invoice line items from their projects"
  ON public.subcontractor_invoice_line_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.subcontractor_invoices si
      JOIN public.project_members pm ON pm.project_id = si.project_id
      WHERE si.id = subcontractor_invoice_line_items.invoice_id
        AND pm.user_id = auth.uid()
    )
  );

-- Service Role Bypass (for admin operations)
CREATE POLICY "Service role can manage all subcontractor invoice line items"
  ON public.subcontractor_invoice_line_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- RLS POLICY COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON POLICY "Users can view subcontractor invoices from their projects"
  ON public.subcontractor_invoices IS
  'Users can view subcontractor invoices for projects where they are members';

COMMENT ON POLICY "Users can create subcontractor invoices for their projects"
  ON public.subcontractor_invoices IS
  'Users can create subcontractor invoices for projects where they are members';

COMMENT ON POLICY "Users can update subcontractor invoices from their projects"
  ON public.subcontractor_invoices IS
  'Users can update subcontractor invoices for projects where they are members';

COMMENT ON POLICY "Users can delete subcontractor invoices from their projects"
  ON public.subcontractor_invoices IS
  'Users can delete subcontractor invoices for projects where they are members';

COMMENT ON POLICY "Service role can manage all subcontractor invoices"
  ON public.subcontractor_invoices IS
  'Service role (admin) can manage all subcontractor invoices without restrictions';

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------

-- Function to update updated_at timestamp (reuse existing if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subcontractor_invoices
CREATE TRIGGER update_subcontractor_invoices_updated_at
  BEFORE UPDATE ON public.subcontractor_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for subcontractor_invoice_line_items
CREATE TRIGGER update_subcontractor_invoice_line_items_updated_at
  BEFORE UPDATE ON public.subcontractor_invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created:
--   - subcontractor_invoices (with 8 indexes and 5 RLS policies)
--   - subcontractor_invoice_line_items (with 3 indexes and 5 RLS policies)
--
-- Next steps:
--   1. Run: npx supabase gen types typescript to regenerate types
--   2. Create API endpoints for CRUD operations
--   3. Build frontend components for invoice management
--   4. Test RLS policies with different user roles
-- =============================================================================
