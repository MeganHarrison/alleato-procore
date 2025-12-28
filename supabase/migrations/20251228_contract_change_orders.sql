-- Migration: Contract Change Orders Schema
-- Created: 2025-12-28
-- Description: Creates contract_change_orders table with status workflow and approval tracking

-- Create contract_change_orders table
CREATE TABLE IF NOT EXISTS contract_change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  change_order_number TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES auth.users(id),
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_date DATE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, change_order_number),
  CONSTRAINT valid_approval_date CHECK (
    (status = 'approved' AND approved_date IS NOT NULL AND approved_by IS NOT NULL) OR
    (status = 'rejected' AND approved_date IS NOT NULL AND approved_by IS NOT NULL AND rejection_reason IS NOT NULL) OR
    (status = 'pending')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_orders_contract ON contract_change_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON contract_change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_requested_by ON contract_change_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_change_orders_approved_by ON contract_change_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_change_orders_created_at ON contract_change_orders(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_change_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER change_orders_updated_at
  BEFORE UPDATE ON contract_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_change_orders_updated_at();

-- Enable Row Level Security
ALTER TABLE contract_change_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view change orders for contracts in their projects
CREATE POLICY "Users can view change orders in their projects"
  ON contract_change_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_change_orders.contract_id
      AND project_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Editors can create change orders
CREATE POLICY "Editors can create change orders"
  ON contract_change_orders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_change_orders.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- RLS Policy: Editors can update change orders
CREATE POLICY "Editors can update change orders"
  ON contract_change_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_change_orders.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_change_orders.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- RLS Policy: Admins can delete change orders
CREATE POLICY "Admins can delete change orders"
  ON contract_change_orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_change_orders.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- Add comments to table
COMMENT ON TABLE contract_change_orders IS 'Change orders for prime contracts with approval workflow';
COMMENT ON COLUMN contract_change_orders.change_order_number IS 'Change order number within the contract (must be unique per contract)';
COMMENT ON COLUMN contract_change_orders.status IS 'Change order status: pending, approved, rejected';
COMMENT ON COLUMN contract_change_orders.amount IS 'Change order amount (can be positive or negative)';
COMMENT ON COLUMN contract_change_orders.rejection_reason IS 'Required when status is rejected';
