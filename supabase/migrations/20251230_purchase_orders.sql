-- Migration: Create purchase_orders table and update commitments infrastructure
-- Date: 2025-12-30

-- ============================================
-- 1. CREATE PURCHASE_ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- General Information
  contract_number TEXT NOT NULL,
  contract_company_id UUID REFERENCES companies(id),
  title TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  executed BOOLEAN NOT NULL DEFAULT FALSE,
  default_retainage_percent NUMERIC(5,2),
  assigned_to UUID REFERENCES auth.users(id),

  -- Billing & Shipping
  bill_to TEXT,  -- Rich text (HTML)
  payment_terms TEXT,
  ship_to TEXT,  -- Rich text (HTML)
  ship_via TEXT,

  -- Description
  description TEXT,

  -- Accounting
  accounting_method TEXT DEFAULT 'unit-quantity',  -- 'unit-quantity' or 'amount'

  -- Contract Dates
  contract_date DATE,
  delivery_date DATE,
  signed_po_received_date DATE,
  issued_on_date DATE,

  -- Privacy
  is_private BOOLEAN DEFAULT TRUE,
  non_admin_user_ids UUID[] DEFAULT '{}',
  allow_non_admin_view_sov_items BOOLEAN DEFAULT FALSE,

  -- Invoice Contacts
  invoice_contact_ids UUID[] DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(project_id, contract_number)
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_contract_company ON purchase_orders(contract_company_id);

-- ============================================
-- 2. CREATE PURCHASE_ORDER_SOV_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_sov_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  change_event_line_item TEXT,
  budget_code TEXT,
  description TEXT,
  quantity NUMERIC(14,4),
  uom TEXT,  -- Unit of Measure: EA, LF, SF, etc.
  unit_cost NUMERIC(14,4),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  billed_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_sov_items_purchase_order ON purchase_order_sov_items(purchase_order_id);

-- ============================================
-- 3. CREATE PURCHASE_ORDERS_WITH_TOTALS VIEW
-- ============================================
CREATE OR REPLACE VIEW purchase_orders_with_totals AS
SELECT
  po.*,
  COALESCE(sov.total_sov_amount, 0) as total_sov_amount,
  COALESCE(sov.total_billed_to_date, 0) as total_billed_to_date,
  COALESCE(sov.total_sov_amount, 0) - COALESCE(sov.total_billed_to_date, 0) as total_amount_remaining,
  COALESCE(sov.sov_line_count, 0) as sov_line_count,
  c.name as company_name,
  c.type as company_type
FROM purchase_orders po
LEFT JOIN (
  SELECT
    purchase_order_id,
    SUM(amount) as total_sov_amount,
    SUM(billed_to_date) as total_billed_to_date,
    COUNT(*) as sov_line_count
  FROM purchase_order_sov_items
  GROUP BY purchase_order_id
) sov ON sov.purchase_order_id = po.id
LEFT JOIN companies c ON c.id = po.contract_company_id;

-- ============================================
-- 4. CREATE UNIFIED COMMITMENTS VIEW
-- ============================================
-- This view combines subcontracts and purchase_orders for the commitments page
CREATE OR REPLACE VIEW commitments_unified AS
SELECT
  id,
  project_id,
  contract_number as number,
  contract_company_id,
  title,
  status,
  executed,
  'subcontract' as type,
  default_retainage_percent as retention_percentage,
  start_date,
  contract_date as executed_date,
  description,
  created_at,
  updated_at,
  -- Computed totals from subcontracts_with_totals
  (SELECT COALESCE(SUM(amount), 0) FROM subcontract_sov_items WHERE subcontract_id = s.id) as original_amount,
  0 as approved_change_orders,  -- TODO: compute from change orders table
  (SELECT COALESCE(SUM(amount), 0) FROM subcontract_sov_items WHERE subcontract_id = s.id) as revised_contract_amount,
  (SELECT COALESCE(SUM(billed_to_date), 0) FROM subcontract_sov_items WHERE subcontract_id = s.id) as billed_to_date,
  (SELECT COALESCE(SUM(amount - billed_to_date), 0) FROM subcontract_sov_items WHERE subcontract_id = s.id) as balance_to_finish
FROM subcontracts s

UNION ALL

SELECT
  id,
  project_id,
  contract_number as number,
  contract_company_id,
  title,
  status,
  executed,
  'purchase_order' as type,
  default_retainage_percent as retention_percentage,
  NULL as start_date,
  contract_date as executed_date,
  description,
  created_at,
  updated_at,
  -- Computed totals from purchase_order_sov_items
  (SELECT COALESCE(SUM(amount), 0) FROM purchase_order_sov_items WHERE purchase_order_id = po.id) as original_amount,
  0 as approved_change_orders,
  (SELECT COALESCE(SUM(amount), 0) FROM purchase_order_sov_items WHERE purchase_order_id = po.id) as revised_contract_amount,
  (SELECT COALESCE(SUM(billed_to_date), 0) FROM purchase_order_sov_items WHERE purchase_order_id = po.id) as billed_to_date,
  (SELECT COALESCE(SUM(amount - billed_to_date), 0) FROM purchase_order_sov_items WHERE purchase_order_id = po.id) as balance_to_finish
FROM purchase_orders po;

-- ============================================
-- 5. RLS POLICIES FOR PURCHASE_ORDERS
-- ============================================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_sov_items ENABLE ROW LEVEL SECURITY;

-- Purchase Orders: Users can view if they're a member of the project
CREATE POLICY "Users can view purchase orders in their projects" ON purchase_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = purchase_orders.project_id
        AND project_users.user_id = auth.uid()
    )
  );

-- Purchase Orders: Users with editor/admin can insert
CREATE POLICY "Editors can create purchase orders" ON purchase_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = purchase_orders.project_id
        AND project_users.user_id = auth.uid()
        AND project_users.role IN ('admin', 'project_manager', 'editor')
    )
  );

-- Purchase Orders: Users with editor/admin can update
CREATE POLICY "Editors can update purchase orders" ON purchase_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = purchase_orders.project_id
        AND project_users.user_id = auth.uid()
        AND project_users.role IN ('admin', 'project_manager', 'editor')
    )
  );

-- Purchase Orders: Admins can delete
CREATE POLICY "Admins can delete purchase orders" ON purchase_orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = purchase_orders.project_id
        AND project_users.user_id = auth.uid()
        AND project_users.role IN ('admin', 'project_manager')
    )
  );

-- SOV Items: Inherit permissions from parent purchase order
CREATE POLICY "Users can view PO SOV items in their projects" ON purchase_order_sov_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      JOIN project_users pu ON pu.project_id = po.project_id
      WHERE po.id = purchase_order_sov_items.purchase_order_id
        AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage PO SOV items" ON purchase_order_sov_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      JOIN project_users pu ON pu.project_id = po.project_id
      WHERE po.id = purchase_order_sov_items.purchase_order_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('admin', 'project_manager', 'editor')
    )
  );

-- ============================================
-- 6. AUTO-GENERATE CONTRACT NUMBER TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION generate_po_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT := 'PO-';
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    SELECT COALESCE(MAX(
      CASE
        WHEN contract_number ~ '^PO-[0-9]+$'
        THEN CAST(SUBSTRING(contract_number FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM purchase_orders
    WHERE project_id = NEW.project_id;

    NEW.contract_number := prefix || LPAD(next_num::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_po_contract_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_po_contract_number();

-- ============================================
-- 7. DROP OLD COMMITMENTS TABLE (if empty)
-- ============================================
-- Only drop if the table is empty to prevent data loss
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM commitments;
  IF row_count = 0 THEN
    -- Drop dependent objects first
    DROP TABLE IF EXISTS commitment_change_orders CASCADE;
    DROP TABLE IF EXISTS commitment_changes CASCADE;
    DROP TABLE IF EXISTS commitment_lines CASCADE;
    DROP TABLE IF EXISTS commitments CASCADE;
    RAISE NOTICE 'Dropped empty commitments table and related tables';
  ELSE
    RAISE NOTICE 'Commitments table has % rows - not dropping', row_count;
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
