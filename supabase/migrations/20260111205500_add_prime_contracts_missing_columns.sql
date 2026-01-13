-- Description: Add missing columns to prime_contracts table
-- Affects: prime_contracts table
-- Context: Adding client_id, execution dates, company references, completion dates, and scope fields

-- Add client_id column (references clients table)
ALTER TABLE public.prime_contracts
ADD COLUMN client_id bigint REFERENCES public.clients(id);

-- Add executed_at column (when contract was signed)
ALTER TABLE public.prime_contracts
ADD COLUMN executed_at timestamptz;

-- Add contractor_id column (references companies table)
ALTER TABLE public.prime_contracts
ADD COLUMN contractor_id uuid REFERENCES public.companies(id);

-- Add architect_engineer_id column (references companies table)
ALTER TABLE public.prime_contracts
ADD COLUMN architect_engineer_id uuid REFERENCES public.companies(id);

-- Add contract_company_id column (generic company reference)
ALTER TABLE public.prime_contracts
ADD COLUMN contract_company_id uuid;

-- Add substantial_completion_date column
ALTER TABLE public.prime_contracts
ADD COLUMN substantial_completion_date date;

-- Add actual_completion_date column
ALTER TABLE public.prime_contracts
ADD COLUMN actual_completion_date date;

-- Add signed_contract_received_date column
ALTER TABLE public.prime_contracts
ADD COLUMN signed_contract_received_date date;

-- Add contract_termination_date column
ALTER TABLE public.prime_contracts
ADD COLUMN contract_termination_date date;

-- Add is_private column with default false
ALTER TABLE public.prime_contracts
ADD COLUMN is_private boolean DEFAULT false NOT NULL;

-- Add inclusions column (scope inclusions)
ALTER TABLE public.prime_contracts
ADD COLUMN inclusions text;

-- Add exclusions column (scope exclusions)
ALTER TABLE public.prime_contracts
ADD COLUMN exclusions text;

-- Add comments for new columns
COMMENT ON COLUMN public.prime_contracts.client_id IS 'The owner/client entity paying the contractor';
COMMENT ON COLUMN public.prime_contracts.executed_at IS 'When the contract was executed/signed';
COMMENT ON COLUMN public.prime_contracts.contractor_id IS 'The contractor company performing the work';
COMMENT ON COLUMN public.prime_contracts.architect_engineer_id IS 'The architect or engineer company';
COMMENT ON COLUMN public.prime_contracts.contract_company_id IS 'Generic contract company reference';
COMMENT ON COLUMN public.prime_contracts.substantial_completion_date IS 'Substantial completion date';
COMMENT ON COLUMN public.prime_contracts.actual_completion_date IS 'Actual completion date';
COMMENT ON COLUMN public.prime_contracts.signed_contract_received_date IS 'Date signed contract was received';
COMMENT ON COLUMN public.prime_contracts.contract_termination_date IS 'Contract termination date if applicable';
COMMENT ON COLUMN public.prime_contracts.is_private IS 'Privacy flag for contract visibility';
COMMENT ON COLUMN public.prime_contracts.inclusions IS 'What is included in the contract scope';
COMMENT ON COLUMN public.prime_contracts.exclusions IS 'What is excluded from the contract scope';

-- Create indexes for foreign key columns to improve query performance
CREATE INDEX idx_prime_contracts_client_id ON public.prime_contracts(client_id);
CREATE INDEX idx_prime_contracts_contractor_id ON public.prime_contracts(contractor_id);
CREATE INDEX idx_prime_contracts_architect_engineer_id ON public.prime_contracts(architect_engineer_id);
CREATE INDEX idx_prime_contracts_contract_company_id ON public.prime_contracts(contract_company_id);

-- Create indexes for date columns often used in filtering/sorting
CREATE INDEX idx_prime_contracts_executed_at ON public.prime_contracts(executed_at);
CREATE INDEX idx_prime_contracts_substantial_completion_date ON public.prime_contracts(substantial_completion_date);
CREATE INDEX idx_prime_contracts_actual_completion_date ON public.prime_contracts(actual_completion_date);
