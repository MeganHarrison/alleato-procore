-- Migration: Prime Contracts Core Schema
-- Created: 2025-12-27
-- Description: Creates core prime_contracts table with all required fields, indexes, and RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prime_contracts table
CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  vendor_id UUID, -- No FK constraint yet - vendors table will be created in Task 1.3
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'on_hold')),
  original_contract_value DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (original_contract_value >= 0),
  revised_contract_value DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (revised_contract_value >= 0),
  start_date DATE,
  end_date DATE,
  retention_percentage DECIMAL(5,2) DEFAULT 0 CHECK (retention_percentage >= 0 AND retention_percentage <= 100),
  payment_terms TEXT,
  billing_schedule TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, contract_number),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prime_contracts_project ON prime_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_vendor ON prime_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_status ON prime_contracts(status);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_number ON prime_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_created_by ON prime_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_created_at ON prime_contracts(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_prime_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prime_contracts_updated_at
  BEFORE UPDATE ON prime_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_prime_contracts_updated_at();

-- Enable Row Level Security
ALTER TABLE prime_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view contracts in projects they have access to
CREATE POLICY "Users can view contracts in their projects"
  ON prime_contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = prime_contracts.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Users with editor access can create contracts
CREATE POLICY "Editors can create contracts"
  ON prime_contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = prime_contracts.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- RLS Policy: Users with editor access can update contracts
CREATE POLICY "Editors can update contracts"
  ON prime_contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = prime_contracts.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = prime_contracts.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

-- RLS Policy: Only admins can delete contracts
CREATE POLICY "Admins can delete contracts"
  ON prime_contracts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = prime_contracts.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- Add comment to table
COMMENT ON TABLE prime_contracts IS 'Prime contracts for construction projects';
COMMENT ON COLUMN prime_contracts.status IS 'Contract status: draft, active, completed, cancelled, on_hold';
COMMENT ON COLUMN prime_contracts.original_contract_value IS 'Original contract value before any change orders';
COMMENT ON COLUMN prime_contracts.revised_contract_value IS 'Current contract value including approved change orders';
COMMENT ON COLUMN prime_contracts.retention_percentage IS 'Percentage of each payment withheld as retention (0-100)';
COMMENT ON COLUMN prime_contracts.vendor_id IS 'Reference to vendor/company - FK constraint will be added in Task 1.3 after vendors table is created';
