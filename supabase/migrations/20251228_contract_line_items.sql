-- Migration: Contract Line Items Schema
-- Created: 2025-12-28
-- Description: Creates contract_line_items table with auto-calculating total_cost and RLS policies

-- Create contract_line_items table
CREATE TABLE IF NOT EXISTS contract_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  cost_code_id BIGINT, -- No FK constraint yet - cost_codes table structure needs verification
  quantity DECIMAL(15,4) DEFAULT 0 CHECK (quantity >= 0),
  unit_of_measure TEXT,
  unit_cost DECIMAL(15,2) DEFAULT 0 CHECK (unit_cost >= 0),
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, line_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_line_items_contract ON contract_line_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_line_items_cost_code ON contract_line_items(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_contract_line_items_created_at ON contract_line_items(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_contract_line_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_line_items_updated_at
  BEFORE UPDATE ON contract_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_line_items_updated_at();

-- Enable Row Level Security
ALTER TABLE contract_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view line items for contracts in their projects
CREATE POLICY "Users can view line items in their projects"
  ON contract_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_line_items.contract_id
      AND project_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Editors can create line items
CREATE POLICY "Editors can create line items"
  ON contract_line_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_line_items.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- RLS Policy: Editors can update line items
CREATE POLICY "Editors can update line items"
  ON contract_line_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_line_items.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_line_items.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- RLS Policy: Admins can delete line items
CREATE POLICY "Admins can delete line items"
  ON contract_line_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_line_items.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- Add comments to table
COMMENT ON TABLE contract_line_items IS 'Line items for prime contracts with auto-calculated totals';
COMMENT ON COLUMN contract_line_items.line_number IS 'Line number within the contract (must be unique per contract)';
COMMENT ON COLUMN contract_line_items.total_cost IS 'Auto-calculated as quantity * unit_cost';
COMMENT ON COLUMN contract_line_items.cost_code_id IS 'Reference to cost code - FK constraint will be added after cost_codes table structure is verified';
