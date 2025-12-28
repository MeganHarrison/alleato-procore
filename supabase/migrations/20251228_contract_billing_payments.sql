-- Migration: Contract Billing & Payments Schema
-- Created: 2025-12-28
-- Description: Creates contract billing periods and payment tracking with retention support

-- Create contract_billing_periods table
CREATE TABLE IF NOT EXISTS contract_billing_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  period_number INTEGER NOT NULL,
  billing_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  work_completed DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (work_completed >= 0),
  stored_materials DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (stored_materials >= 0),
  current_payment_due DECIMAL(15,2) GENERATED ALWAYS AS (work_completed + stored_materials) STORED,
  retention_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (retention_percentage >= 0 AND retention_percentage <= 100),
  retention_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (retention_amount >= 0),
  net_payment_due DECIMAL(15,2) GENERATED ALWAYS AS (work_completed + stored_materials - retention_amount) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, period_number),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date),
  CONSTRAINT valid_billing_date CHECK (billing_date >= start_date)
);

-- Create contract_payments table
CREATE TABLE IF NOT EXISTS contract_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  billing_period_id UUID REFERENCES contract_billing_periods(id) ON DELETE SET NULL,
  payment_number TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_type TEXT NOT NULL DEFAULT 'progress' CHECK (payment_type IN ('progress', 'retention', 'final', 'advance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  check_number TEXT,
  reference_number TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, payment_number),
  CONSTRAINT valid_approval_date CHECK (
    (status IN ('approved', 'paid') AND approved_date IS NOT NULL AND approved_by IS NOT NULL) OR
    (status IN ('pending', 'cancelled'))
  ),
  CONSTRAINT valid_paid_date CHECK (
    (status = 'paid' AND paid_date IS NOT NULL) OR
    (status IN ('pending', 'approved', 'cancelled'))
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_periods_contract ON contract_billing_periods(contract_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_status ON contract_billing_periods(status);
CREATE INDEX IF NOT EXISTS idx_billing_periods_billing_date ON contract_billing_periods(billing_date);
CREATE INDEX IF NOT EXISTS idx_billing_periods_created_at ON contract_billing_periods(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_contract ON contract_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_billing_period ON contract_payments(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON contract_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON contract_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_approved_by ON contract_payments(approved_by);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON contract_payments(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_billing_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_periods_updated_at
  BEFORE UPDATE ON contract_billing_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_periods_updated_at();

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON contract_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Enable Row Level Security
ALTER TABLE contract_billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_billing_periods
CREATE POLICY "Users can view billing periods in their projects"
  ON contract_billing_periods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_billing_periods.contract_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create billing periods"
  ON contract_billing_periods
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_billing_periods.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Editors can update billing periods"
  ON contract_billing_periods
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_billing_periods.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_billing_periods.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Admins can delete billing periods"
  ON contract_billing_periods
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_billing_periods.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- RLS Policies for contract_payments
CREATE POLICY "Users can view payments in their projects"
  ON contract_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_payments.contract_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create payments"
  ON contract_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_payments.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Editors can update payments"
  ON contract_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_payments.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_payments.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('editor', 'admin', 'owner')
    )
  );

CREATE POLICY "Admins can delete payments"
  ON contract_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prime_contracts
      JOIN project_members ON project_members.project_id = prime_contracts.project_id
      WHERE prime_contracts.id = contract_payments.contract_id
      AND project_members.user_id = auth.uid()
      AND project_members.access IN ('admin', 'owner')
    )
  );

-- Add comments to tables
COMMENT ON TABLE contract_billing_periods IS 'Billing periods for prime contracts with retention tracking';
COMMENT ON COLUMN contract_billing_periods.period_number IS 'Billing period number within the contract (must be unique per contract)';
COMMENT ON COLUMN contract_billing_periods.current_payment_due IS 'Auto-calculated: work_completed + stored_materials';
COMMENT ON COLUMN contract_billing_periods.net_payment_due IS 'Auto-calculated: current_payment_due - retention_amount';
COMMENT ON COLUMN contract_billing_periods.retention_percentage IS 'Percentage of payment held as retention (0-100)';
COMMENT ON COLUMN contract_billing_periods.status IS 'Billing period status: draft, submitted, approved, paid';

COMMENT ON TABLE contract_payments IS 'Payment records for prime contracts with approval workflow';
COMMENT ON COLUMN contract_payments.payment_number IS 'Payment number within the contract (must be unique per contract)';
COMMENT ON COLUMN contract_payments.payment_type IS 'Type of payment: progress, retention, final, advance';
COMMENT ON COLUMN contract_payments.status IS 'Payment status: pending, approved, paid, cancelled';
COMMENT ON COLUMN contract_payments.billing_period_id IS 'Optional reference to billing period (can be null for standalone payments)';
