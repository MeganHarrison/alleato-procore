/**
 * Contract Change Orders Type Definitions
 * Generated from database schema
 */

export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected';

export interface ContractChangeOrder {
  id: string;
  contract_id: string;
  change_order_number: string;
  description: string;
  amount: number;
  status: ChangeOrderStatus;
  requested_by: string | null;
  requested_date: string;
  approved_by: string | null;
  approved_date: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateChangeOrderInput {
  contract_id: string;
  change_order_number: string;
  description: string;
  amount: number;
  status?: ChangeOrderStatus;
  requested_date?: string;
}

export interface UpdateChangeOrderInput {
  change_order_number?: string;
  description?: string;
  amount?: number;
  status?: ChangeOrderStatus;
  approved_by?: string | null;
  approved_date?: string | null;
  rejection_reason?: string | null;
}

export interface ApproveChangeOrderInput {
  approved_by: string;
  approved_date: string;
}

export interface RejectChangeOrderInput {
  approved_by: string;
  approved_date: string;
  rejection_reason: string;
}

export interface ChangeOrderWithUsers extends ContractChangeOrder {
  requested_by_user?: {
    id: string;
    email: string;
    name?: string;
  };
  approved_by_user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface ChangeOrderSummary {
  contract_id: string;
  total_change_orders: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_approved_amount: number;
  total_pending_amount: number;
}
