/**
 * Contract Line Items Type Definitions
 * Generated from database schema
 */

export interface ContractLineItem {
  id: string;
  contract_id: string;
  line_number: number;
  description: string;
  cost_code_id: number | null;
  quantity: number;
  unit_of_measure: string | null;
  unit_cost: number;
  total_cost: number; // Auto-calculated: quantity * unit_cost
  created_at: string;
  updated_at: string;
}

export interface CreateContractLineItemInput {
  contract_id: string;
  line_number: number;
  description: string;
  cost_code_id?: number;
  quantity?: number;
  unit_of_measure?: string;
  unit_cost?: number;
}

export interface UpdateContractLineItemInput {
  line_number?: number;
  description?: string;
  cost_code_id?: number | null;
  quantity?: number;
  unit_of_measure?: string | null;
  unit_cost?: number;
}

export interface ContractLineItemWithCostCode extends ContractLineItem {
  cost_code?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface ContractLineItemSummary {
  contract_id: string;
  total_line_items: number;
  total_quantity: number;
  total_cost: number;
}
