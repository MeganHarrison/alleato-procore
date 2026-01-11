import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

// ============================================================================
// SUBCONTRACTS TABLE
// ============================================================================

export const subcontracts = pgTable("subcontracts", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // General Information
  contractNumber: text("contract_number").notNull(),
  contractCompanyId: uuid("contract_company_id"),
  title: text("title"),
  status: text("status").notNull().default("Draft"),
  executed: boolean("executed").notNull().default(false),
  defaultRetainagePercent: numeric("default_retainage_percent", {
    precision: 5,
    scale: 2,
  }),
  description: text("description"),

  // Scope
  inclusions: text("inclusions"),
  exclusions: text("exclusions"),

  // Contract Dates (stored as mm/dd/yyyy strings)
  startDate: text("start_date"),
  estimatedCompletionDate: text("estimated_completion_date"),
  actualCompletionDate: text("actual_completion_date"),
  contractDate: text("contract_date"),
  signedContractReceivedDate: text("signed_contract_received_date"),
  issuedOnDate: text("issued_on_date"),

  // Privacy
  isPrivate: boolean("is_private").default(true),
  nonAdminUserIds: uuid("non_admin_user_ids").array().default([]),
  allowNonAdminViewSovItems: boolean("allow_non_admin_view_sov_items").default(
    false,
  ),

  // Invoice Contacts
  invoiceContactIds: uuid("invoice_contact_ids").array().default([]),

  // Relationships
  projectId: integer("project_id").notNull(),
  createdBy: uuid("created_by"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// SCHEDULE OF VALUES (SOV) LINE ITEMS
// ============================================================================

export const subcontractSovItems = pgTable("subcontract_sov_items", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign Key
  subcontractId: uuid("subcontract_id").notNull(),

  // Line Item Fields
  lineNumber: integer("line_number"),
  changeEventLineItem: text("change_event_line_item"),
  budgetCode: text("budget_code"),
  description: text("description"),

  // Financial Fields
  amount: numeric("amount", { precision: 15, scale: 2 }).default("0"),
  billedToDate: numeric("billed_to_date", { precision: 15, scale: 2 }).default(
    "0",
  ),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Ordering
  sortOrder: integer("sort_order"),
});

// ============================================================================
// ATTACHMENTS
// ============================================================================

export const subcontractAttachments = pgTable("subcontract_attachments", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign Key
  subcontractId: uuid("subcontract_id").notNull(),

  // File Info
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  storagePath: text("storage_path").notNull(),

  // Metadata
  uploadedBy: uuid("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// ============================================================================
// COMPANIES TABLE (for reference)
// ============================================================================

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),

  address: text("address"),
  city: text("city"),
  state: text("state"),

  notes: text("notes"),
  title: text("title"),

  currencyCode: text("currency_code"),
  currencySymbol: text("currency_symbol"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// LEGACY CONTRACTS TABLE (keeping for backwards compatibility)
// ============================================================================

export const contracts = pgTable("contracts", {
  id: integer("id").primaryKey(),

  // Basic contract info
  contractNumber: text("contract_number"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status"),
  executed: boolean("executed"),

  // Financial
  originalContractAmount: numeric("original_contract_amount"),
  revisedContractAmount: numeric("revised_contract_amount"),
  defaultRetainage: numeric("default_retainage"),
  retentionPercentage: numeric("retention_percentage"),

  // Scope
  inclusions: text("inclusions"),
  exclusions: text("exclusions"),

  // Dates
  startDate: text("start_date"),
  estimatedCompletionDate: text("estimated_completion_date"),
  actualCompletionDate: text("actual_completion_date"),
  substantialCompletionDate: text("substantial_completion_date"),
  signedContractReceivedDate: text("signed_contract_received_date"),
  contractTerminationDate: text("contract_termination_date"),

  // Privacy
  private: boolean("private"),

  // Relationships
  projectId: integer("project_id").notNull(),
  clientId: integer("client_id").notNull(),
  contractorId: integer("contractor_id"),
  architectEngineerId: integer("architect_engineer_id"),
  ownerClientId: integer("owner_client_id"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),

  // Calculated fields (stored)
  approvedChangeOrders: numeric("approved_change_orders"),
  draftChangeOrders: numeric("draft_change_orders"),
  pendingChangeOrders: numeric("pending_change_orders"),
  invoicedAmount: numeric("invoiced_amount"),
  paymentsReceived: numeric("payments_received"),
  remainingBalance: numeric("remaining_balance"),
  percentPaid: numeric("percent_paid"),
  attachmentCount: integer("attachment_count"),

  // Other
  notes: text("notes"),
  erpStatus: text("erp_status"),
  applyVerticalMarkup: boolean("apply_vertical_markup"),
});

// Contract line items (SOV)
export const contractLineItems = pgTable("contract_line_items", {
  id: integer("id").primaryKey(),
  contractId: integer("contract_id").notNull(),

  lineNumber: integer("line_number"),
  changeEventLineItem: text("change_event_line_item"),
  budgetCode: text("budget_code"),
  description: text("description"),

  amount: numeric("amount"),
  billedToDate: numeric("billed_to_date"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Subcontracts
export type Subcontract = typeof subcontracts.$inferSelect;
export type NewSubcontract = typeof subcontracts.$inferInsert;

// SOV Items
export type SubcontractSovItem = typeof subcontractSovItems.$inferSelect;
export type NewSubcontractSovItem = typeof subcontractSovItems.$inferInsert;

// Attachments
export type SubcontractAttachment = typeof subcontractAttachments.$inferSelect;
export type NewSubcontractAttachment =
  typeof subcontractAttachments.$inferInsert;

// Companies
export type Company = typeof companies.$inferSelect;

// Legacy
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type ContractLineItem = typeof contractLineItems.$inferSelect;
export type NewContractLineItem = typeof contractLineItems.$inferInsert;
