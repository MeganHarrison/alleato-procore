-- Migration: Budget Details Extended System
-- Created: 2025-12-28
-- Description: Extends budget system with commitments, direct costs, and change event line items

-- =====================================================
-- STEP 1: Create commitments table (subcontracts/POs)
-- =====================================================

CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  commitment_number TEXT NOT NULL,
  commitment_type TEXT NOT NULL CHECK (commitment_type IN ('subcontract', 'purchase_order')),
  vendor_id UUID REFERENCES vendors(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'out_for_signature',
    'processing',
    'submitted',
    'partially_received',
    'received',
    'approved',
    'complete'
  )),
  executed_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, commitment_number)
);

-- =====================================================
-- STEP 2: Create commitment_lines table
-- =====================================================

CREATE TABLE IF NOT EXISTS commitment_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL,
  cost_code_id TEXT REFERENCES cost_codes(id),
  cost_type_id UUID REFERENCES cost_code_types(id),
  description TEXT,
  quantity DECIMAL(15,4),
  unit_of_measure TEXT,
  unit_cost DECIMAL(15,4),
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Create commitment_change_orders table
-- =====================================================

CREATE TABLE IF NOT EXISTS commitment_change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  change_order_number TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pending_approval',
    'pending_review',
    'approved',
    'rejected'
  )),
  requested_by UUID REFERENCES auth.users(id),
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_date DATE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(commitment_id, change_order_number)
);

-- =====================================================
-- STEP 4: Create commitment_change_order_lines table
-- =====================================================

CREATE TABLE IF NOT EXISTS commitment_change_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_change_order_id UUID NOT NULL REFERENCES commitment_change_orders(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL,
  cost_code_id TEXT REFERENCES cost_codes(id),
  cost_type_id UUID REFERENCES cost_code_types(id),
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 5: Create change_event_line_items table
-- (change_events table already exists with bigint ID)
-- =====================================================

CREATE TABLE IF NOT EXISTS change_event_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_event_id BIGINT NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL,
  cost_code_id TEXT REFERENCES cost_codes(id),
  cost_type_id UUID REFERENCES cost_code_types(id),
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 6: Create direct_costs table
-- =====================================================

CREATE TABLE IF NOT EXISTS direct_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL,
  cost_code_id TEXT REFERENCES cost_codes(id),
  cost_type_id UUID REFERENCES cost_code_types(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'revise_and_resubmit',
    'approved'
  )),
  incurred_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_id UUID REFERENCES vendors(id),
  invoice_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 7: Create indexes for performance
-- =====================================================

-- Commitments indexes
CREATE INDEX IF NOT EXISTS idx_commitments_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_vendor ON commitments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitment_lines_commitment ON commitment_lines(commitment_id);
CREATE INDEX IF NOT EXISTS idx_commitment_lines_budget_line ON commitment_lines(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_commitment_lines_cost_code ON commitment_lines(cost_code_id);

-- Commitment change orders indexes
CREATE INDEX IF NOT EXISTS idx_commitment_cos_commitment ON commitment_change_orders(commitment_id);
CREATE INDEX IF NOT EXISTS idx_commitment_cos_status ON commitment_change_orders(status);
CREATE INDEX IF NOT EXISTS idx_commitment_co_lines_co ON commitment_change_order_lines(commitment_change_order_id);
CREATE INDEX IF NOT EXISTS idx_commitment_co_lines_budget_line ON commitment_change_order_lines(budget_line_id);

-- Change event line items indexes
CREATE INDEX IF NOT EXISTS idx_change_event_lines_event ON change_event_line_items(change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_event_lines_budget_line ON change_event_line_items(budget_line_id);

-- Direct costs indexes
CREATE INDEX IF NOT EXISTS idx_direct_costs_project ON direct_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_direct_costs_budget_line ON direct_costs(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_direct_costs_status ON direct_costs(status);
CREATE INDEX IF NOT EXISTS idx_direct_costs_cost_code ON direct_costs(cost_code_id);

-- =====================================================
-- STEP 8: Create updated_at triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_budget_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commitments_updated_at
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_details_updated_at();

CREATE TRIGGER commitment_lines_updated_at
  BEFORE UPDATE ON commitment_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_details_updated_at();

CREATE TRIGGER commitment_change_orders_updated_at
  BEFORE UPDATE ON commitment_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_details_updated_at();

CREATE TRIGGER commitment_change_order_lines_updated_at
  BEFORE UPDATE ON commitment_change_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_details_updated_at();

CREATE TRIGGER change_event_line_items_updated_at
  BEFORE UPDATE ON change_event_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_details_updated_at();

CREATE TRIGGER direct_costs_updated_at
  BEFORE UPDATE ON direct_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_details_updated_at();

-- =====================================================
-- STEP 9: Enable Row Level Security
-- =====================================================

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_change_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_event_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_costs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 10: Create RLS Policies
-- =====================================================

-- Commitments policies
CREATE POLICY "Users can view commitments in their projects"
  ON commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = commitments.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create commitments"
  ON commitments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = commitments.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Editors can update commitments"
  ON commitments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = commitments.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- Commitment change orders policies
CREATE POLICY "Users can view commitment change orders"
  ON commitment_change_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM commitments c
      JOIN project_members pm ON pm.project_id = c.project_id
      WHERE c.id = commitment_change_orders.commitment_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create commitment change orders"
  ON commitment_change_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM commitments c
      JOIN project_members pm ON pm.project_id = c.project_id
      WHERE c.id = commitment_change_orders.commitment_id
      AND pm.user_id = auth.uid()
      AND pm.access IN ('editor', 'admin', 'owner')
    )
  );

-- Change event line items policies
CREATE POLICY "Users can view change event line items"
  ON change_event_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM change_events ce
      JOIN project_members pm ON pm.project_id = ce.project_id
      WHERE ce.id = change_event_line_items.change_event_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create change event line items"
  ON change_event_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM change_events ce
      JOIN project_members pm ON pm.project_id = ce.project_id
      WHERE ce.id = change_event_line_items.change_event_id
      AND pm.user_id = auth.uid()
      AND pm.access IN ('editor', 'admin', 'owner')
    )
  );

-- Direct Costs policies
CREATE POLICY "Users can view direct costs in their projects"
  ON direct_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = direct_costs.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create direct costs"
  ON direct_costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = direct_costs.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- Generic policies for line tables (authenticated users can view)
CREATE POLICY "Users can view commitment lines"
  ON commitment_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view commitment change order lines"
  ON commitment_change_order_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- STEP 11: Add table comments
-- =====================================================

COMMENT ON TABLE commitments IS 'Subcontracts and purchase orders';
COMMENT ON TABLE commitment_lines IS 'Line items for commitments';
COMMENT ON TABLE commitment_change_orders IS 'Change orders for commitments';
COMMENT ON TABLE commitment_change_order_lines IS 'Line items for commitment change orders';
COMMENT ON TABLE change_event_line_items IS 'Line items for change events linked to budget lines';
COMMENT ON TABLE direct_costs IS 'Direct costs not associated with commitments';
