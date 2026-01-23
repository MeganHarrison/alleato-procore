-- Forecasting Database Migration
-- Creates forecasting_curves, budget_line_forecasts tables and updates budget_line_items
-- Based on SCHEMA-Budget.md requirements

-- Enable RLS on existing tables if not already enabled
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

-- Create forecasting_curves table
CREATE TABLE IF NOT EXISTS forecasting_curves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    curve_type TEXT NOT NULL CHECK (curve_type IN ('linear', 's_curve', 'custom')),
    curve_data JSONB, -- Stores curve parameters or data points
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for forecasting_curves
CREATE INDEX IF NOT EXISTS idx_forecasting_curves_type ON forecasting_curves(curve_type);
CREATE INDEX IF NOT EXISTS idx_forecasting_curves_system ON forecasting_curves(is_system);

-- Insert default system curves
INSERT INTO forecasting_curves (id, name, description, curve_type, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Linear Distribution', 'Uniform cost distribution over time', 'linear', true),
    ('00000000-0000-0000-0000-000000000002', 'Standard S-Curve', 'Traditional construction S-curve pattern', 's_curve', true)
ON CONFLICT (id) DO NOTHING;

-- Add forecasting columns to budget_line_items table
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS default_ftc_method TEXT DEFAULT 'manual' CHECK (default_ftc_method IN ('manual', 'automatic', 'lump_sum', 'monitored_resources')),
ADD COLUMN IF NOT EXISTS default_curve_id UUID REFERENCES forecasting_curves(id),
ADD COLUMN IF NOT EXISTS forecasting_enabled BOOLEAN DEFAULT true;

-- Create budget_line_forecasts table
CREATE TABLE IF NOT EXISTS budget_line_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_line_id UUID NOT NULL REFERENCES budget_line_items(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecasted_cost DECIMAL(15,2) NOT NULL,
    forecast_to_complete DECIMAL(15,2) NOT NULL,
    projected_final_cost DECIMAL(15,2) NOT NULL,
    variance_at_completion DECIMAL(15,2) NOT NULL,
    burn_rate DECIMAL(15,4),
    percent_complete DECIMAL(5,2) CHECK (percent_complete >= 0 AND percent_complete <= 100),
    ftc_method TEXT NOT NULL CHECK (ftc_method IN ('manual', 'automatic', 'lump_sum', 'monitored_resources')),
    curve_id UUID REFERENCES forecasting_curves(id),
    manual_override BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create unique constraint for one forecast per line per date
ALTER TABLE budget_line_forecasts
ADD CONSTRAINT IF NOT EXISTS uq_budget_line_forecast_date
UNIQUE (budget_line_id, forecast_date);

-- Create indexes for budget_line_forecasts
CREATE INDEX IF NOT EXISTS idx_budget_line_forecasts_line ON budget_line_forecasts(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_forecasts_date ON budget_line_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_budget_line_forecasts_method ON budget_line_forecasts(ftc_method);
CREATE INDEX IF NOT EXISTS idx_budget_line_forecasts_curve ON budget_line_forecasts(curve_id);

-- Create RLS policies for forecasting_curves
CREATE POLICY IF NOT EXISTS forecasting_curves_policy ON forecasting_curves FOR ALL
USING (is_system = true OR true); -- Allow access to system curves and all curves for now

-- Create RLS policies for budget_line_forecasts
CREATE POLICY IF NOT EXISTS budget_line_forecasts_policy ON budget_line_forecasts FOR ALL
USING (
    budget_line_id IN (
        SELECT bli.id
        FROM budget_line_items bli
        JOIN budget_codes bc ON bc.id = bli.budget_code_id
        WHERE bc.project_id IN (
            SELECT project_id
            FROM project_users
            WHERE user_id = auth.uid()
        )
    )
);

-- Enable RLS on new tables
ALTER TABLE forecasting_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_forecasts ENABLE ROW LEVEL SECURITY;

-- Create helper function to get latest forecast for a budget line
CREATE OR REPLACE FUNCTION get_latest_forecast(p_budget_line_id UUID)
RETURNS TABLE (
    forecast_to_complete DECIMAL(15,2),
    projected_final_cost DECIMAL(15,2),
    variance_at_completion DECIMAL(15,2),
    percent_complete DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        blf.forecast_to_complete,
        blf.projected_final_cost,
        blf.variance_at_completion,
        blf.percent_complete
    FROM budget_line_forecasts blf
    WHERE blf.budget_line_id = p_budget_line_id
    ORDER BY blf.forecast_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing budget views to include forecasting data
-- This would be done in a separate migration if the views already exist

COMMENT ON TABLE forecasting_curves IS 'Defines forecasting methodologies and curve patterns for budget predictions';
COMMENT ON TABLE budget_line_forecasts IS 'Stores forecast calculations for individual budget line items';
COMMENT ON COLUMN budget_line_items.default_ftc_method IS 'Default forecast-to-complete calculation method for this line item';
COMMENT ON COLUMN budget_line_items.default_curve_id IS 'Default forecasting curve to use for this line item';
COMMENT ON COLUMN budget_line_items.forecasting_enabled IS 'Whether forecasting is enabled for this budget line item';