/**
 * Contract Billing & Payments Type Definitions
 * Generated from database schema
 */

export type BillingPeriodStatus = 'draft' | 'submitted' | 'approved' | 'paid';
export type PaymentType = 'progress' | 'retention' | 'final' | 'advance';
export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface ContractBillingPeriod {
  id: string;
  contract_id: string;
  period_number: number;
  billing_date: string;
  start_date: string;
  end_date: string;
  work_completed: number;
  stored_materials: number;
  current_payment_due: number; // Auto-calculated: work_completed + stored_materials
  retention_percentage: number;
  retention_amount: number;
  net_payment_due: number; // Auto-calculated: current_payment_due - retention_amount
  status: BillingPeriodStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBillingPeriodInput {
  contract_id: string;
  period_number: number;
  billing_date: string;
  start_date: string;
  end_date: string;
  work_completed: number;
  stored_materials?: number;
  retention_percentage?: number;
  retention_amount?: number;
  status?: BillingPeriodStatus;
  notes?: string;
}

export interface UpdateBillingPeriodInput {
  billing_date?: string;
  start_date?: string;
  end_date?: string;
  work_completed?: number;
  stored_materials?: number;
  retention_percentage?: number;
  retention_amount?: number;
  status?: BillingPeriodStatus;
  notes?: string;
}

export interface ContractPayment {
  id: string;
  contract_id: string;
  billing_period_id: string | null;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  check_number: string | null;
  reference_number: string | null;
  approved_by: string | null;
  approved_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentInput {
  contract_id: string;
  billing_period_id?: string | null;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_type?: PaymentType;
  status?: PaymentStatus;
  check_number?: string;
  reference_number?: string;
  notes?: string;
}

export interface UpdatePaymentInput {
  payment_date?: string;
  amount?: number;
  payment_type?: PaymentType;
  status?: PaymentStatus;
  check_number?: string;
  reference_number?: string;
  approved_by?: string | null;
  approved_date?: string | null;
  paid_date?: string | null;
  notes?: string;
}

export interface ApprovePaymentInput {
  approved_by: string;
  approved_date: string;
}

export interface MarkPaymentPaidInput {
  paid_date: string;
  check_number?: string;
  reference_number?: string;
}

export interface BillingPeriodWithPayments extends ContractBillingPeriod {
  payments?: ContractPayment[];
  total_payments_received?: number;
}

export interface PaymentWithBillingPeriod extends ContractPayment {
  billing_period?: ContractBillingPeriod;
}

export interface ContractBillingSummary {
  contract_id: string;
  total_billing_periods: number;
  total_billed: number;
  total_retention_held: number;
  total_payments_received: number;
  outstanding_balance: number;
  draft_periods_count: number;
  submitted_periods_count: number;
  approved_periods_count: number;
  paid_periods_count: number;
  pending_payments_count: number;
  approved_payments_count: number;
  paid_payments_count: number;
  cancelled_payments_count: number;
}
