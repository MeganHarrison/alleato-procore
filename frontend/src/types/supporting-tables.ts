/**
 * Supporting Tables Type Definitions
 * Generated from database schema
 */

export type DocumentType =
  | 'contract'
  | 'amendment'
  | 'insurance'
  | 'bond'
  | 'lien_waiver'
  | 'change_order'
  | 'invoice'
  | 'other';

// Vendors
export interface Vendor {
  id: string;
  company_id: string; // UUID
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorInput {
  company_id: string; // UUID
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateVendorInput {
  name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
  is_active?: boolean;
}

// Contract Documents
export interface ContractDocument {
  id: string;
  contract_id: string;
  document_name: string;
  document_type: DocumentType;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  version: number;
  is_current_version: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  contract_id: string;
  document_name: string;
  document_type: DocumentType;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
}

export interface UpdateDocumentInput {
  document_name?: string;
  document_type?: DocumentType;
  notes?: string;
  is_current_version?: boolean;
}

export interface DocumentWithUploader extends ContractDocument {
  uploader?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Contract Snapshots
export interface ContractSnapshot {
  id: string;
  contract_id: string;
  snapshot_date: string;
  snapshot_data: Record<string, unknown>; // Full contract state as JSONB
  created_by: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateSnapshotInput {
  contract_id: string;
  snapshot_data: Record<string, unknown>;
  reason?: string;
  notes?: string;
}

export interface SnapshotWithCreator extends ContractSnapshot {
  creator?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Contract Views
export interface ContractView {
  id: string;
  user_id: string;
  company_id: string; // UUID
  view_name: string;
  description: string | null;
  filters: Record<string, unknown> | null;
  columns: Record<string, unknown> | null;
  sort_order: Record<string, unknown> | null;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateViewInput {
  company_id: string; // UUID
  view_name: string;
  description?: string;
  filters?: Record<string, unknown>;
  columns?: Record<string, unknown>;
  sort_order?: Record<string, unknown>;
  is_default?: boolean;
  is_shared?: boolean;
}

export interface UpdateViewInput {
  view_name?: string;
  description?: string;
  filters?: Record<string, unknown>;
  columns?: Record<string, unknown>;
  sort_order?: Record<string, unknown>;
  is_default?: boolean;
  is_shared?: boolean;
}

export interface ViewWithOwner extends ContractView {
  owner?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Utility types
export interface VendorSummary {
  vendor_id: string;
  vendor_name: string;
  total_contracts: number;
  active_contracts: number;
  total_contract_value: number;
  last_contract_date: string | null;
}

export interface DocumentSummary {
  contract_id: string;
  total_documents: number;
  document_types: Record<DocumentType, number>;
  total_file_size: number;
  latest_upload_date: string | null;
}
