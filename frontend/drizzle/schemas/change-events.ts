import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, boolean, timestamp, numeric, integer, bigint, index, unique, date } from "drizzle-orm/pg-core";
import { projects } from "../schema";
import { contracts } from "../schema";
import { users } from "../schema";
import { budgetLines } from "../schema";
import { companies } from "../schema";

// =====================================================
// CHANGE EVENTS MODULE
// Created: 2026-01-08
// =====================================================

export const changeEvents = pgTable("change_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
	number: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	reason: varchar({ length: 100 }),
	scope: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('Open').notNull(),
	origin: varchar({ length: 100 }),
	expectingRevenue: boolean("expecting_revenue").default(true).notNull(),
	lineItemRevenueSource: varchar("line_item_revenue_source", { length: 100 }),
	primeContractId: uuid("prime_contract_id").references(() => contracts.id, { onDelete: "set null" }),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "set null" }),
	updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("change_events_number_project_unique").on(table.projectId, table.number),
	index("idx_change_events_project_id").using("btree", table.projectId.asc().nullsLast()),
	index("idx_change_events_status").using("btree", table.status.asc().nullsLast()),
	index("idx_change_events_type").using("btree", table.type.asc().nullsLast()),
	index("idx_change_events_created_at").using("btree", table.createdAt.desc().nullsLast()),
]);

export const changeEventLineItems = pgTable("change_event_line_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	changeEventId: uuid("change_event_id").notNull().references(() => changeEvents.id, { onDelete: "cascade" }),
	budgetCodeId: uuid("budget_code_id").references(() => budgetLines.id, { onDelete: "set null" }),
	description: text(),
	vendorId: uuid("vendor_id").references(() => companies.id, { onDelete: "set null" }),
	contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
	unitOfMeasure: varchar("unit_of_measure", { length: 50 }),
	quantity: numeric({ precision: 15, scale: 4 }),
	unitCost: numeric("unit_cost", { precision: 15, scale: 2 }),
	revenueRom: numeric("revenue_rom", { precision: 15, scale: 2 }),
	costRom: numeric("cost_rom", { precision: 15, scale: 2 }),
	nonCommittedCost: numeric("non_committed_cost", { precision: 15, scale: 2 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ce_line_items_change_event").using("btree", table.changeEventId.asc().nullsLast()),
	index("idx_ce_line_items_budget_code").using("btree", table.budgetCodeId.asc().nullsLast()),
	index("idx_ce_line_items_vendor").using("btree", table.vendorId.asc().nullsLast()),
	index("idx_ce_line_items_contract").using("btree", table.contractId.asc().nullsLast()),
]);

export const changeEventAttachments = pgTable("change_event_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	changeEventId: uuid("change_event_id").notNull().references(() => changeEvents.id, { onDelete: "cascade" }),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	filePath: text("file_path").notNull(),
	fileSize: bigint("file_size", { mode: "number" }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "set null" }),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ce_attachments_change_event").using("btree", table.changeEventId.asc().nullsLast()),
]);

export const changeEventHistory = pgTable("change_event_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	changeEventId: uuid("change_event_id").notNull().references(() => changeEvents.id, { onDelete: "cascade" }),
	fieldName: varchar("field_name", { length: 100 }).notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	changedBy: uuid("changed_by").notNull().references(() => users.id, { onDelete: "set null" }),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	changeType: varchar("change_type", { length: 50 }).notNull(),
}, (table) => [
	index("idx_ce_history_change_event").using("btree", table.changeEventId.asc().nullsLast()),
	index("idx_ce_history_changed_at").using("btree", table.changedAt.desc().nullsLast()),
]);

export const changeEventApprovals = pgTable("change_event_approvals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	changeEventId: uuid("change_event_id").notNull().references(() => changeEvents.id, { onDelete: "cascade" }),
	approverId: uuid("approver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	approvalStatus: varchar("approval_status", { length: 50 }).default('Pending').notNull(),
	comments: text(),
	respondedAt: timestamp("responded_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ce_approvals_change_event").using("btree", table.changeEventId.asc().nullsLast()),
	index("idx_ce_approvals_status").using("btree", table.approvalStatus.asc().nullsLast()),
]);

export const changeEventRfqs = pgTable("change_event_rfqs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: bigint("project_id", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
	changeEventId: uuid("change_event_id").notNull().references(() => changeEvents.id, { onDelete: "cascade" }),
	rfqNumber: varchar("rfq_number", { length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('Draft').notNull(),
	assignedCompanyId: uuid("assigned_company_id").references(() => companies.id, { onDelete: "set null" }),
	assignedContactId: uuid("assigned_contact_id").references(() => users.id, { onDelete: "set null" }),
	includeAttachments: boolean("include_attachments").default(true).notNull(),
	dueDate: date("due_date", { mode: "string" }).notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	responseReceivedAt: timestamp("response_received_at", { withTimezone: true, mode: 'string' }),
	estimatedTotalAmount: numeric("estimated_total_amount", { precision: 15, scale: 2 }).default(sql`0`).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "set null" }),
	updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
	unique("change_event_rfqs_number_project_unique").on(table.projectId, table.rfqNumber),
	index("idx_ce_rfqs_project").using("btree", table.projectId.asc().nullsLast()),
	index("idx_ce_rfqs_change_event").using("btree", table.changeEventId.asc().nullsLast()),
	index("idx_ce_rfqs_status").using("btree", table.status.asc().nullsLast()),
]);

export const changeEventRfqResponses = pgTable("change_event_rfq_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	rfqId: uuid("rfq_id").notNull().references(() => changeEventRfqs.id, { onDelete: "cascade" }),
	lineItemId: uuid("line_item_id").references(() => changeEventLineItems.id, { onDelete: "set null" }),
	responderCompanyId: uuid("responder_company_id").references(() => companies.id, { onDelete: "set null" }),
	responderContactId: uuid("responder_contact_id").references(() => users.id, { onDelete: "set null" }),
	unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default(sql`0`).notNull(),
	extendedAmount: numeric("extended_amount", { precision: 15, scale: 2 }).default(sql`0`).notNull(),
	notes: text(),
	status: varchar({ length: 50 }).default('Draft').notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
	updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
	unique("change_event_rfq_responses_unique").on(
		table.rfqId,
		table.lineItemId,
		table.responderCompanyId,
		table.responderContactId,
	),
	index("idx_ce_rfq_responses_rfq").using("btree", table.rfqId.asc().nullsLast()),
	index("idx_ce_rfq_responses_status").using("btree", table.status.asc().nullsLast()),
]);

export const changeEventRfqAttachments = pgTable("change_event_rfq_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	rfqId: uuid("rfq_id").references(() => changeEventRfqs.id, { onDelete: "cascade" }),
	rfqResponseId: uuid("rfq_response_id").references(() => changeEventRfqResponses.id, { onDelete: "cascade" }),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	filePath: text("file_path").notNull(),
	fileSize: bigint("file_size", { mode: "number" }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "set null" }),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ce_rfq_attachments_rfq").using("btree", table.rfqId.asc().nullsLast()),
	index("idx_ce_rfq_attachments_response").using("btree", table.rfqResponseId.asc().nullsLast()),
]);

// TypeScript types
export type ChangeEvent = typeof changeEvents.$inferSelect;
export type NewChangeEvent = typeof changeEvents.$inferInsert;
export type ChangeEventLineItem = typeof changeEventLineItems.$inferSelect;
export type NewChangeEventLineItem = typeof changeEventLineItems.$inferInsert;
export type ChangeEventAttachment = typeof changeEventAttachments.$inferSelect;
export type NewChangeEventAttachment = typeof changeEventAttachments.$inferInsert;
export type ChangeEventHistoryEntry = typeof changeEventHistory.$inferSelect;
export type ChangeEventApproval = typeof changeEventApprovals.$inferSelect;
export type ChangeEventRfq = typeof changeEventRfqs.$inferSelect;
export type NewChangeEventRfq = typeof changeEventRfqs.$inferInsert;
export type ChangeEventRfqResponse = typeof changeEventRfqResponses.$inferSelect;
export type NewChangeEventRfqResponse = typeof changeEventRfqResponses.$inferInsert;
export type ChangeEventRfqAttachment = typeof changeEventRfqAttachments.$inferSelect;
export type NewChangeEventRfqAttachment = typeof changeEventRfqAttachments.$inferInsert;
