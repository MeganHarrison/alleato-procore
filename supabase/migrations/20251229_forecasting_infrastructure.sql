-- Forecasting Infrastructure Migration
-- This migration creates the core tables and policies for budget forecasting features
-- Based on Procore's forecasting system with FTC (Forecast to Complete) methods

-- =============================================================================
-- TABLE: forecasting_curves
-- Stores forecasting curve definitions (Linear, S-Curve, Custom)
-- =============================================================================

CREATE TABLE IF NOT EXISTS forecasting_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  curve_type VARCHAR(50) NOT NULL CHECK (curve_type IN ('linear', 's_curve', 'custom')),
  description TEXT,

  -- Curve configuration (JSON structure depends on curve_type)
  -- For linear: { "rate": "uniform" }
  -- For s_curve: { "acceleration_phase": 0.2, "plateau_phase": 0.6, "deceleration_phase": 0.2 }
  -- For custom: { "points": [{"period": 1, "percentage": 0.1}, ...] }
  curve_config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT forecasting_curves_company_name_unique UNIQUE (company_id, name)
);

-- Index for performance
CREATE INDEX idx_forecasting_curves_company ON forecasting_curves(company_id);
CREATE INDEX idx_forecasting_curves_active ON forecasting_curves(company_id, is_active);

-- =============================================================================
-- TABLE: budget_line_forecasts
-- Stores forecast calculations for individual budget line items
-- =============================================================================

CREATE TABLE IF NOT EXISTS budget_line_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id UUID NOT NULL REFERENCES budget_lines(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- FTC (Forecast to Complete) Method
  -- manual: User enters forecast manually
  -- automatic: System calculates based on burn rate
  -- lump_sum: Remaining budget allocated to future periods
  -- monitored_resources: Based on resource tracking
  ftc_method VARCHAR(50) NOT NULL CHECK (ftc_method IN ('manual', 'automatic', 'lump_sum', 'monitored_resources')),

  -- Forecasting curve (optional - used with automatic method)
  curve_id UUID REFERENCES forecasting_curves(id) ON DELETE SET NULL,

  -- Forecast amounts
  forecasted_cost DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  forecast_to_complete DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  projected_final_cost DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  variance_at_completion DECIMAL(15, 2) NOT NULL DEFAULT 0.00,

  -- Burn rate calculations (for automatic FTC)
  actual_to_date DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  percent_complete DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  burn_rate DECIMAL(15, 2),

  -- Manual override values
  manual_forecast DECIMAL(15, 2),
  override_reason TEXT,

  -- Forecast period
  forecast_date DATE NOT NULL DEFAULT CURRENT_DATE,
  forecast_period VARCHAR(50), -- 'Q1 2025', 'Jan 2025', etc.

  -- Metadata
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT budget_line_forecasts_line_date_unique UNIQUE (budget_line_id, forecast_date)
);

-- Indexes for performance
CREATE INDEX idx_budget_line_forecasts_budget_line ON budget_line_forecasts(budget_line_id);
CREATE INDEX idx_budget_line_forecasts_project ON budget_line_forecasts(project_id);
CREATE INDEX idx_budget_line_forecasts_date ON budget_line_forecasts(forecast_date);
CREATE INDEX idx_budget_line_forecasts_method ON budget_line_forecasts(ftc_method);

-- =============================================================================
-- ENHANCE: budget_lines table
-- Add forecasting-related columns to existing budget_lines table
-- =============================================================================

-- Check if columns don't exist before adding them
DO $$
BEGIN
  -- Add default FTC method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_lines' AND column_name = 'default_ftc_method'
  ) THEN
    ALTER TABLE budget_lines
    ADD COLUMN default_ftc_method VARCHAR(50) DEFAULT 'automatic'
    CHECK (default_ftc_method IN ('manual', 'automatic', 'lump_sum', 'monitored_resources'));
  END IF;

  -- Add default forecasting curve reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_lines' AND column_name = 'default_curve_id'
  ) THEN
    ALTER TABLE budget_lines
    ADD COLUMN default_curve_id UUID REFERENCES forecasting_curves(id) ON DELETE SET NULL;
  END IF;

  -- Add forecasting enabled flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_lines' AND column_name = 'forecasting_enabled'
  ) THEN
    ALTER TABLE budget_lines
    ADD COLUMN forecasting_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- =============================================================================
-- RLS POLICIES: forecasting_curves
-- =============================================================================

ALTER TABLE forecasting_curves ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all forecasting curves
-- TODO: Refine when company_users or similar table is implemented
CREATE POLICY "Users can view forecasting curves"
  ON forecasting_curves
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create forecasting curves
CREATE POLICY "Users can create forecasting curves"
  ON forecasting_curves
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update forecasting curves
CREATE POLICY "Users can update forecasting curves"
  ON forecasting_curves
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete forecasting curves
CREATE POLICY "Users can delete forecasting curves"
  ON forecasting_curves
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- RLS POLICIES: budget_line_forecasts
-- =============================================================================

ALTER TABLE budget_line_forecasts ENABLE ROW LEVEL SECURITY;

-- Allow users to view forecasts for projects they have access to
CREATE POLICY budget_line_forecasts_select_policy
  ON budget_line_forecasts
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- Allow project members to create forecasts
CREATE POLICY budget_line_forecasts_insert_policy
  ON budget_line_forecasts
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- Allow project members to update forecasts (with lock check)
CREATE POLICY budget_line_forecasts_update_policy
  ON budget_line_forecasts
  FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = auth.uid()
    )
    AND (
      is_locked = false
      OR EXISTS (
        SELECT 1 FROM project_users pu
        WHERE pu.project_id = budget_line_forecasts.project_id
          AND pu.user_id = auth.uid()
          AND pu.role = 'admin'
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- Allow project members to delete forecasts
CREATE POLICY budget_line_forecasts_delete_policy
  ON budget_line_forecasts
  FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS: Updated timestamps
-- =============================================================================

-- Trigger for forecasting_curves
CREATE OR REPLACE FUNCTION update_forecasting_curves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_forecasting_curves_updated_at
  BEFORE UPDATE ON forecasting_curves
  FOR EACH ROW
  EXECUTE FUNCTION update_forecasting_curves_updated_at();

-- Trigger for budget_line_forecasts
CREATE OR REPLACE FUNCTION update_budget_line_forecasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_budget_line_forecasts_updated_at
  BEFORE UPDATE ON budget_line_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_line_forecasts_updated_at();

-- =============================================================================
-- COMMENTS: Documentation
-- =============================================================================

COMMENT ON TABLE forecasting_curves IS 'Stores forecasting curve definitions for budget forecasting (Linear, S-Curve, Custom)';
COMMENT ON TABLE budget_line_forecasts IS 'Stores forecast calculations for individual budget line items with FTC methods';
COMMENT ON COLUMN budget_line_forecasts.ftc_method IS 'Forecast to Complete method: manual, automatic, lump_sum, or monitored_resources';
COMMENT ON COLUMN budget_line_forecasts.projected_final_cost IS 'Actual to date + Forecast to complete';
COMMENT ON COLUMN budget_line_forecasts.variance_at_completion IS 'Original budget - Projected final cost';
