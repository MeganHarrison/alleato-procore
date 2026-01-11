-- =============================================================================
-- FIX DIRECT COSTS SCHEMA
-- =============================================================================
-- This migration fixes the direct_costs table schema conflict
-- The existing table uses a different structure - we need to replace it
--
-- WARNING: This will drop the existing direct_costs table and all data in it
-- Backup any important data before running this migration

-- Drop existing table and recreate with correct schema
DROP TABLE IF EXISTS direct_costs CASCADE;

-- Drop the direct_cost_line_items table (will be recreated)
DROP TABLE IF EXISTS direct_cost_line_items CASCADE;

-- Recreate direct_costs with correct schema
CREATE TABLE direct_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('Expense', 'Invoice', 'Subcontractor Invoice')),
  date DATE NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  employee_id BIGINT REFERENCES employees(id),
  invoice_number VARCHAR(255),
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Approved', 'Rejected', 'Paid')) DEFAULT 'Draft',
  description TEXT,
  terms VARCHAR(255),
  received_date DATE,
  paid_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  updated_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_direct_costs_project_date ON direct_costs (project_id, date);
CREATE INDEX idx_direct_costs_status ON direct_costs (status);
CREATE INDEX idx_direct_costs_vendor ON direct_costs (vendor_id);
CREATE INDEX idx_direct_costs_cost_type ON direct_costs (cost_type);
CREATE INDEX idx_direct_costs_not_deleted ON direct_costs (is_deleted) WHERE is_deleted = false;

-- Recreate direct_cost_line_items
CREATE TABLE direct_cost_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_cost_id UUID NOT NULL REFERENCES direct_costs(id) ON DELETE CASCADE,
  budget_code_id UUID NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  uom VARCHAR(50) DEFAULT 'LOT',
  unit_cost DECIMAL(15,2) NOT NULL,
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  line_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for line items
CREATE INDEX idx_direct_cost_line_items_direct_cost ON direct_cost_line_items (direct_cost_id);
CREATE INDEX idx_direct_cost_line_items_budget_code ON direct_cost_line_items (budget_code_id);
CREATE UNIQUE INDEX idx_direct_cost_line_items_unique_order ON direct_cost_line_items (direct_cost_id, line_order);

-- Enable RLS
ALTER TABLE direct_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_cost_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view direct costs from their projects"
  ON direct_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = direct_costs.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create direct costs in their projects"
  ON direct_costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = direct_costs.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update direct costs in their projects"
  ON direct_costs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = direct_costs.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Line items inherit direct cost permissions
CREATE POLICY "Users can view line items from accessible direct costs"
  ON direct_cost_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM direct_costs dc
      JOIN project_members pm ON pm.project_id = dc.project_id
      WHERE dc.id = direct_cost_line_items.direct_cost_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify line items from accessible direct costs"
  ON direct_cost_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM direct_costs dc
      JOIN project_members pm ON pm.project_id = dc.project_id
      WHERE dc.id = direct_cost_line_items.direct_cost_id
      AND pm.user_id = auth.uid()
    )
  );

-- Recreate views
CREATE OR REPLACE VIEW direct_costs_with_details AS
SELECT
  dc.*,
  v.name as vendor_name,
  v.contact_email as vendor_email,
  e.first_name || ' ' || e.last_name as employee_name,
  p.name as project_name,
  COUNT(dcli.id) as line_item_count,
  COALESCE(SUM(dcli.line_total), 0) as calculated_total
FROM direct_costs dc
LEFT JOIN vendors v ON v.id = dc.vendor_id
LEFT JOIN employees e ON e.id = dc.employee_id
LEFT JOIN projects p ON p.id = dc.project_id
LEFT JOIN direct_cost_line_items dcli ON dcli.direct_cost_id = dc.id
WHERE dc.is_deleted = false
GROUP BY dc.id, v.name, v.contact_email,
         e.first_name, e.last_name, p.name;

-- NOTE: budget_costs_summary_by_cost_code view commented out
-- The budget_codes table doesn't exist in this schema
-- Using budget_lines table instead would require refactoring
-- Will be added in a future migration if needed

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_direct_costs_updated_at
  BEFORE UPDATE ON direct_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_cost_line_items_updated_at
  BEFORE UPDATE ON direct_cost_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE direct_costs IS 'Main table for tracking direct project costs including expenses, invoices, and subcontractor invoices';
COMMENT ON TABLE direct_cost_line_items IS 'Individual line items within each direct cost, linked to budget codes for proper cost tracking';
