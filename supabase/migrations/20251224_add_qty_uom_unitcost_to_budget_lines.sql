-- Add quantity, unit_of_measure, and unit_cost columns to budget_lines
-- Created: 2025-12-24
-- Purpose: Store detailed budget line information (qty × unit_cost = amount)

-- Add the missing columns that the track_budget_line_changes trigger expects
ALTER TABLE budget_lines
  ADD COLUMN quantity numeric(15,4),
  ADD COLUMN unit_of_measure text,
  ADD COLUMN unit_cost numeric(15,4);

-- Add helpful comment
COMMENT ON COLUMN budget_lines.quantity IS 'Quantity for this budget line (e.g., 100 SF, 50 hours)';
COMMENT ON COLUMN budget_lines.unit_of_measure IS 'Unit of measure (e.g., SF, LF, HR, EA, CY, TON)';
COMMENT ON COLUMN budget_lines.unit_cost IS 'Cost per unit (quantity × unit_cost should equal original_amount)';
