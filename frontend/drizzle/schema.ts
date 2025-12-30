import { pgTable, index, pgPolicy, check, uuid, text, integer, vector, timestamp, varchar, serial, jsonb, numeric, foreignKey, unique, bigint, boolean, bigserial, date, inet, uniqueIndex, real, doublePrecision, primaryKey, pgView, pgMaterializedView, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const billingPeriodStatus = pgEnum("billing_period_status", ['open', 'closed', 'approved'])
export const budgetStatus = pgEnum("budget_status", ['locked', 'unlocked'])
export const calculationMethod = pgEnum("calculation_method", ['unit_price', 'lump_sum', 'percentage'])
export const changeEventStatus = pgEnum("change_event_status", ['open', 'closed'])
export const changeOrderStatus = pgEnum("change_order_status", ['draft', 'pending', 'approved', 'void'])
export const commitmentType = pgEnum("commitment_type", ['subcontract', 'purchase_order', 'service_order'])
export const companyType = pgEnum("company_type", ['vendor', 'subcontractor', 'owner', 'architect', 'other'])
export const contractStatus = pgEnum("contract_status", ['draft', 'pending', 'executed', 'closed', 'terminated'])
export const contractType = pgEnum("contract_type", ['prime_contract', 'commitment'])
export const erpSyncStatus = pgEnum("erp_sync_status", ['pending', 'synced', 'failed', 'resyncing'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'pending', 'approved', 'paid', 'void'])
export const issueCategory = pgEnum("issue_category", ['Design', 'Submittal', 'Scheduling', 'Procurement', 'Installation', 'Safety', 'Change Order', 'Other'])
export const issueSeverity = pgEnum("issue_severity", ['Low', 'Medium', 'High', 'Critical'])
export const issueStatus = pgEnum("issue_status", ['Open', 'In Progress', 'Resolved', 'Pending Verification'])
export const projectStatus = pgEnum("project_status", ['active', 'inactive', 'complete'])
export const taskStatus = pgEnum("task_status", ['todo', 'doing', 'review', 'done'])

export const aiInsightsIdSeq1 = pgSequence("ai_insights_id_seq1", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const fmTextChunks = pgTable("fm_text_chunks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	docId: text("doc_id").default('FMDS0834').notNull(),
	docVersion: text("doc_version").default('2024-07').notNull(),
	pageNumber: integer("page_number"),
	clauseId: text("clause_id"),
	sectionPath: text("section_path").array(),
	contentType: text("content_type").default('text').notNull(),
	rawText: text("raw_text").notNull(),
	chunkSummary: text("chunk_summary"),
	chunkSize: integer("chunk_size").generatedAlwaysAs(sql`length(raw_text)`),
	searchKeywords: text("search_keywords").array(),
	topics: text().array(),
	extractedRequirements: text("extracted_requirements").array(),
	complianceType: text("compliance_type"),
	relatedFigures: integer("related_figures").array(),
	relatedTables: text("related_tables").array(),
	relatedSections: text("related_sections").array(),
	embedding: vector({ dimensions: 1536 }),
	costImpact: text("cost_impact"),
	savingsOpportunities: text("savings_opportunities").array(),
	complexityScore: integer("complexity_score"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_fm_text_chunks_clause").using("btree", table.clauseId.asc().nullsLast().op("text_ops")),
	index("idx_fm_text_chunks_embedding").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	index("idx_fm_text_chunks_keywords").using("gin", table.searchKeywords.asc().nullsLast().op("array_ops")),
	index("idx_fm_text_chunks_page").using("btree", table.pageNumber.asc().nullsLast().op("int4_ops")),
	index("idx_fm_text_chunks_requirements").using("gin", table.extractedRequirements.asc().nullsLast().op("array_ops")),
	index("idx_fm_text_chunks_topics").using("gin", table.topics.asc().nullsLast().op("array_ops")),
	pgPolicy("Users can read text chunks", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	check("fm_text_chunks_complexity_score_check", sql`(complexity_score >= 1) AND (complexity_score <= 10)`),
	check("fm_text_chunks_cost_impact_check", sql`cost_impact = ANY (ARRAY['HIGH'::text, 'MEDIUM'::text, 'LOW'::text])`),
]);

export const chats = pgTable("chats", {
	id: varchar().primaryKey().notNull(),
});

export const optimizationRules = pgTable("optimization_rules", {
	id: serial().primaryKey().notNull(),
	conditionFrom: jsonb("condition_from"),
	conditionTo: jsonb("condition_to"),
	costImpact: numeric("cost_impact"),
	description: text(),
	embedding: vector({ dimensions: 1536 }),
});

export const projectBudgetCodes = pgTable("project_budget_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	subJobId: uuid("sub_job_id"),
	costCodeId: text("cost_code_id").notNull(),
	costTypeId: uuid("cost_type_id").notNull(),
	description: text().notNull(),
	descriptionMode: text("description_mode").default('concatenated').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	subJobKey: uuid("sub_job_key").generatedAlwaysAs(sql`COALESCE(sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid)`),
}, (table) => [
	index("idx_project_budget_codes_active").using("btree", table.projectId.asc().nullsLast().op("int8_ops"), table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(is_active = true)`),
	index("idx_project_budget_codes_project_cost_code").using("btree", table.projectId.asc().nullsLast().op("int8_ops"), table.costCodeId.asc().nullsLast().op("text_ops")),
	index("idx_project_budget_codes_project_cost_type").using("btree", table.projectId.asc().nullsLast().op("uuid_ops"), table.costTypeId.asc().nullsLast().op("int8_ops")),
	index("idx_project_budget_codes_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "project_budget_codes_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "project_budget_codes_cost_type_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "project_budget_codes_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_budget_codes_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subJobId],
			foreignColumns: [subJobs.id],
			name: "project_budget_codes_sub_job_id_fkey"
		}).onDelete("set null"),
	unique("uq_project_budget_code").on(table.projectId, table.costCodeId, table.costTypeId, table.subJobKey),
	pgPolicy("project_budget_codes_insert", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(auth.uid() IS NOT NULL)`  }),
	pgPolicy("project_budget_codes_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("project_budget_codes_update", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("project_budget_codes_delete", { as: "permissive", for: "delete", to: ["public"] }),
	check("project_budget_codes_description_mode_check", sql`description_mode = ANY (ARRAY['concatenated'::text, 'custom'::text])`),
]);

export const memories = pgTable("memories", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	content: text(),
	metadata: jsonb(),
	embedding: vector({ dimensions: 1536 }),
});

export const billingPeriods = pgTable("billing_periods", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	periodNumber: integer("period_number").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	isClosed: boolean("is_closed").default(false),
	closedDate: timestamp("closed_date", { withTimezone: true, mode: 'string' }),
	closedBy: uuid("closed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_billing_periods_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.closedBy],
			foreignColumns: [users.id],
			name: "billing_periods_closed_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "billing_periods_project_id_fkey"
		}),
	unique("billing_periods_project_id_period_number_key").on(table.projectId, table.periodNumber),
	pgPolicy("Users can view billing periods", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can manage billing periods", { as: "permissive", for: "all", to: ["public"] }),
]);

export const nodsPage = pgTable("nods_page", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentPageId: bigint("parent_page_id", { mode: "number" }),
	path: text().notNull(),
	checksum: text(),
	meta: jsonb(),
	type: text(),
	source: text(),
}, (table) => [
	foreignKey({
			columns: [table.parentPageId],
			foreignColumns: [table.id],
			name: "nods_page_parent_page_id_fkey"
		}),
	unique("nods_page_path_key").on(table.path),
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const syncStatus = pgTable("sync_status", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	syncType: text("sync_type").default('fireflies').notNull(),
	lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: 'string' }),
	lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true, mode: 'string' }),
	status: text().default('idle'),
	errorMessage: text("error_message"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	check("sync_status_status_check", sql`status = ANY (ARRAY['idle'::text, 'running'::text, 'failed'::text, 'completed'::text])`),
]);

export const budgetLineItemHistory = pgTable("budget_line_item_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	budgetLineItemId: uuid("budget_line_item_id").notNull(),
	budgetCode: text("budget_code").notNull(),
	description: text().notNull(),
	eventType: text("event_type").notNull(),
	changedField: text("changed_field"),
	fromValue: text("from_value"),
	toValue: text("to_value"),
	performedBy: uuid("performed_by"),
	performedByName: text("performed_by_name"),
	performedAt: timestamp("performed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	source: text().default('app').notNull(),
	notes: text(),
}, (table) => [
	index("budget_line_item_history_date_idx").using("btree", table.performedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("budget_line_item_history_event_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("budget_line_item_history_item_idx").using("btree", table.budgetLineItemId.asc().nullsLast().op("uuid_ops")),
	index("budget_line_item_history_project_idx").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	check("budget_line_item_history_event_type_check", sql`event_type = ANY (ARRAY['BUDGET_LINE_ITEM_CREATED'::text, 'BUDGET_LINE_ITEM_UPDATED'::text, 'BUDGET_LINE_ITEM_DELETED'::text, 'BUDGET_FORECAST_CREATED'::text])`),
]);

export const projectTasks = pgTable("project_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	taskDescription: text("task_description").notNull(),
	assignedTo: text("assigned_to"),
	dueDate: date("due_date"),
	priority: text(),
	status: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_project_tasks_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_project_tasks_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_tasks_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Service role has full access to project_tasks", { as: "permissive", for: "all", to: ["public"], using: sql`((auth.jwt() ->> 'role'::text) = 'service_role'::text)` }),
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("project_tasks_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])`),
	check("project_tasks_status_check", sql`status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const chunks = pgTable("chunks", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	documentId: uuid("document_id").notNull(),
	content: text().notNull(),
	embedding: vector({ dimensions: 1536 }),
	chunkIndex: integer("chunk_index").notNull(),
	metadata: jsonb().default({}),
	tokenCount: integer("token_count"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	documentTitle: text("document_title"),
}, (table) => [
	index("idx_chunks_chunk_index").using("btree", table.documentId.asc().nullsLast().op("int4_ops"), table.chunkIndex.asc().nullsLast().op("uuid_ops")),
	index("idx_chunks_content_trgm").using("gin", table.content.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_chunks_document_id").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_chunks_document_id_title").using("btree", table.documentId.asc().nullsLast().op("text_ops"), table.documentTitle.asc().nullsLast().op("text_ops")),
	index("idx_chunks_embedding").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "1"}),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.id],
			name: "chunks_document_id_fkey"
		}).onDelete("cascade"),
]);

export const fmTableVectors = pgTable("fm_table_vectors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tableId: text("table_id").notNull(),
	embedding: vector({ dimensions: 1536 }).notNull(),
	contentText: text("content_text").notNull(),
	contentType: text("content_type").notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("fm_table_vectors_embedding_cosine_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	index("fm_table_vectors_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	index("fm_table_vectors_embedding_l2_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_l2_ops")).with({lists: "100"}),
	foreignKey({
			columns: [table.tableId],
			foreignColumns: [fmGlobalTables.tableId],
			name: "fm_table_vectors_table_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow public read access", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const meetingSegments = pgTable("meeting_segments", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	metadataId: text("metadata_id").notNull(),
	segmentIndex: integer("segment_index").notNull(),
	title: text(),
	startIndex: integer("start_index").notNull(),
	endIndex: integer("end_index").notNull(),
	summary: text(),
	decisions: jsonb().default([]).notNull(),
	risks: jsonb().default([]).notNull(),
	tasks: jsonb().default([]).notNull(),
	summaryEmbedding: vector("summary_embedding", { dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	projectIds: integer("project_ids").array().default([]),
}, (table) => [
	index("meeting_segments_project_ids_gin_idx").using("gin", table.projectIds.asc().nullsLast().op("array_ops")),
	index("meeting_segments_summary_embedding_idx").using("hnsw", table.summaryEmbedding.asc().nullsLast().op("vector_cosine_ops")).with({m: "16",ef_construction: "64"}),
	foreignKey({
			columns: [table.metadataId],
			foreignColumns: [documentMetadata.id],
			name: "meeting_segments_metadata_id_fkey"
		}).onDelete("cascade"),
	unique("meeting_segments_metadata_id_segment_index_key").on(table.metadataId, table.segmentIndex),
]);

export const employees = pgTable("employees", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "employees_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	department: text(),
	salery: text(),
	startDate: date("start_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	supervisor: bigint({ mode: "number" }),
	companyCard: numeric("company_card"),
	truckAllowance: numeric("truck_allowance"),
	phoneAllowance: numeric("phone_allowance"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	jobTitle: text("job_title"),
	supervisorName: text("supervisor_name"),
	photo: text(),
}, (table) => [
	foreignKey({
			columns: [table.supervisor],
			foreignColumns: [table.id],
			name: "employees_supervisor_fkey"
		}).onUpdate("cascade").onDelete("set default"),
	unique("employees_email_key").on(table.email),
	pgPolicy("Enable insert for authenticated users only", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`true`  }),
	pgPolicy("Allow public to view employees", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Allow authenticated users to insert employees", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Allow authenticated users to update employees", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Allow authenticated users to delete employees", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const costCodeDivisions = pgTable("cost_code_divisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	title: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("divisions_code_unique").on(table.code),
]);

export const fmOptimizationSuggestions = pgTable("fm_optimization_suggestions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	formSubmissionId: uuid("form_submission_id"),
	suggestionType: text("suggestion_type").notNull(),
	title: text().notNull(),
	description: text(),
	originalConfig: jsonb("original_config"),
	suggestedConfig: jsonb("suggested_config"),
	estimatedSavings: numeric("estimated_savings"),
	implementationEffort: text("implementation_effort"),
	riskLevel: text("risk_level"),
	technicalJustification: text("technical_justification"),
	applicableCodes: text("applicable_codes").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.formSubmissionId],
			foreignColumns: [fmFormSubmissions.id],
			name: "fm_optimization_suggestions_form_submission_id_fkey"
		}).onDelete("cascade"),
]);

export const companyContext = pgTable("company_context", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	goals: jsonb().default([]),
	strategicInitiatives: jsonb("strategic_initiatives").default([]),
	okrs: jsonb().default([]),
	resourceConstraints: jsonb("resource_constraints").default([]),
	policies: jsonb().default([]),
	orgStructure: jsonb("org_structure"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const userProjects = pgTable("user_projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userEmail: varchar("user_email", { length: 255 }),
	projectName: text("project_name"),
	companyName: text("company_name"),
	contactPhone: varchar("contact_phone", { length: 50 }),
	projectData: jsonb("project_data").notNull(),
	leadScore: integer("lead_score").default(0),
	status: varchar({ length: 50 }).default('new'),
	estimatedValue: numeric("estimated_value", { precision: 12, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("projects_created_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("user_projects_lead_score_idx").using("btree", table.leadScore.desc().nullsFirst().op("int4_ops")),
	index("user_projects_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	pgPolicy("Allow public access on projects", { as: "permissive", for: "all", to: ["public"], using: sql`true` }),
]);

export const designRecommendations = pgTable("design_recommendations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id"),
	recommendationType: varchar("recommendation_type", { length: 100 }).notNull(),
	description: text().notNull(),
	potentialSavings: numeric("potential_savings", { precision: 12, scale:  2 }),
	priorityLevel: varchar("priority_level", { length: 20 }).notNull(),
	implementationEffort: varchar("implementation_effort", { length: 20 }),
	technicalDetails: jsonb("technical_details"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("recommendations_priority_idx").using("btree", table.priorityLevel.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [userProjects.id],
			name: "fk_project_id"
		}),
	pgPolicy("Allow public access on recommendations", { as: "permissive", for: "all", to: ["public"], using: sql`true` }),
]);

export const costFactors = pgTable("cost_factors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	factorName: varchar("factor_name", { length: 100 }).notNull(),
	factorType: varchar("factor_type", { length: 50 }).notNull(),
	baseCostPerUnit: numeric("base_cost_per_unit", { precision: 10, scale:  2 }),
	unitType: varchar("unit_type", { length: 50 }),
	complexityMultiplier: numeric("complexity_multiplier", { precision: 4, scale:  2 }).default('1.0'),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("cost_factors_factor_name_key").on(table.factorName),
	pgPolicy("Allow public access on cost_factors", { as: "permissive", for: "all", to: ["public"], using: sql`true` }),
]);

export const asrsConfigurations = pgTable("asrs_configurations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	configName: varchar("config_name", { length: 100 }).notNull(),
	asrsType: varchar("asrs_type", { length: 50 }).notNull(),
	maxHeightFt: numeric("max_height_ft", { precision: 5, scale:  2 }),
	containerTypes: text("container_types").array(),
	typicalApplications: text("typical_applications").array(),
	costMultiplier: numeric("cost_multiplier", { precision: 4, scale:  2 }).default('1.0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("asrs_configurations_config_name_key").on(table.configName),
	pgPolicy("Allow public access on asrs_configurations", { as: "permissive", for: "all", to: ["public"], using: sql`true` }),
]);

export const chatSessions = pgTable("chat_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	title: text(),
	context: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("chat_sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_sessions_user_id_fkey"
		}).onDelete("cascade"),
]);

export const fmFormSubmissions = pgTable("fm_form_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: text("session_id"),
	userInput: jsonb("user_input").notNull(),
	parsedRequirements: jsonb("parsed_requirements"),
	matchedTableIds: text("matched_table_ids").array(),
	similarityScores: numeric("similarity_scores").array(),
	selectedConfiguration: jsonb("selected_configuration"),
	contactInfo: jsonb("contact_info"),
	projectDetails: jsonb("project_details"),
	leadScore: integer("lead_score"),
	leadStatus: text("lead_status").default('new'),
	costAnalysis: jsonb("cost_analysis"),
	recommendations: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_form_submissions_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_form_submissions_lead_score").using("btree", table.leadScore.asc().nullsLast().op("int4_ops")),
	index("idx_form_submissions_status").using("btree", table.leadStatus.asc().nullsLast().op("text_ops")),
	check("chk_lead_score", sql`(lead_score >= 0) AND (lead_score <= 100)`),
	check("chk_lead_status", sql`lead_status = ANY (ARRAY['new'::text, 'qualified'::text, 'contacted'::text, 'converted'::text, 'lost'::text])`),
]);

export const issues = pgTable("issues", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	title: text().notNull(),
	description: text(),
	category: issueCategory().notNull(),
	severity: issueSeverity().default('Medium'),
	status: issueStatus().default('Open'),
	reportedBy: text("reported_by"),
	dateReported: date("date_reported").default(sql`CURRENT_DATE`),
	dateResolved: date("date_resolved"),
	directCost: numeric("direct_cost", { precision: 12, scale:  2 }).default('0'),
	indirectCost: numeric("indirect_cost", { precision: 12, scale:  2 }).default('0'),
	totalCost: numeric("total_cost", { precision: 12, scale:  2 }).generatedAlwaysAs(sql`(direct_cost + indirect_cost)`),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "issues_project_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const fmDocuments = pgTable("fm_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	filename: text(),
	content: text(),
	documentType: text("document_type"),
	embedding: vector({ dimensions: 1536 }),
	relatedTableIds: text("related_table_ids").array(),
	source: text(),
	processingStatus: text("processing_status").default('pending'),
	processingNotes: text("processing_notes"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("fm_documents_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "50"}),
	index("idx_documents_status").using("btree", table.processingStatus.asc().nullsLast().op("text_ops")),
	index("idx_documents_type").using("btree", table.documentType.asc().nullsLast().op("text_ops")),
	index("idx_fm_documents_content_search").using("gin", sql`to_tsvector('english'::regconfig, content)`),
]);

export const subcontractorProjects = pgTable("subcontractor_projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subcontractorId: uuid("subcontractor_id"),
	projectName: text("project_name").notNull(),
	projectValue: numeric("project_value", { precision: 12, scale:  2 }),
	startDate: date("start_date"),
	completionDate: date("completion_date"),
	projectRating: numeric("project_rating", { precision: 3, scale:  2 }),
	onTime: boolean("on_time"),
	onBudget: boolean("on_budget"),
	safetyIncidents: integer("safety_incidents").default(0),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_subcontractor_projects_subcontractor_id").using("btree", table.subcontractorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subcontractorId],
			foreignColumns: [subcontractors.id],
			name: "subcontractor_projects_subcontractor_id_fkey"
		}).onDelete("cascade"),
	check("subcontractor_projects_project_rating_check", sql`(project_rating >= (0)::numeric) AND (project_rating <= (5)::numeric)`),
]);

export const fmGlobalTables = pgTable("fm_global_tables", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tableNumber: integer("table_number").notNull(),
	tableId: text("table_id").notNull(),
	title: text().notNull(),
	asrsType: text("asrs_type").notNull(),
	systemType: text("system_type").notNull(),
	protectionScheme: text("protection_scheme").notNull(),
	commodityTypes: text("commodity_types").array().default([""]),
	ceilingHeightMinFt: numeric("ceiling_height_min_ft"),
	ceilingHeightMaxFt: numeric("ceiling_height_max_ft"),
	storageHeightMaxFt: numeric("storage_height_max_ft"),
	aisleWidthRequirements: text("aisle_width_requirements"),
	rackConfiguration: jsonb("rack_configuration"),
	sprinklerSpecifications: jsonb("sprinkler_specifications"),
	designParameters: jsonb("design_parameters"),
	specialConditions: text("special_conditions").array(),
	applicableFigures: integer("applicable_figures").array(),
	estimatedPageNumber: integer("estimated_page_number"),
	extractionStatus: text("extraction_status").default('pending'),
	rawData: jsonb("raw_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	sectionReferences: text("section_references").array(),
	containerType: text("container_type"),
	figures: uuid(),
	image: text(),
}, (table) => [
	index("fm_global_tables_specs_gin").using("gin", table.sprinklerSpecifications.asc().nullsLast().op("jsonb_ops")),
	index("fm_global_tables_tableid_idx").using("btree", table.tableId.asc().nullsLast().op("text_ops")),
	index("idx_fm_global_tables_number").using("btree", table.tableNumber.asc().nullsLast().op("int4_ops")),
	index("idx_fm_tables_asrs_type").using("btree", table.asrsType.asc().nullsLast().op("text_ops")),
	index("idx_fm_tables_commodities").using("gin", table.commodityTypes.asc().nullsLast().op("array_ops")),
	index("idx_fm_tables_number").using("btree", table.tableNumber.asc().nullsLast().op("int4_ops")),
	index("idx_fm_tables_status").using("btree", table.extractionStatus.asc().nullsLast().op("text_ops")),
	index("idx_fm_tables_system_type").using("btree", table.systemType.asc().nullsLast().op("text_ops")),
	index("idx_fm_tables_title_search").using("gin", sql`to_tsvector('english'::regconfig, title)`),
	index("idx_fm_tables_type_system").using("btree", table.asrsType.asc().nullsLast().op("text_ops"), table.systemType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.figures],
			foreignColumns: [fmGlobalFigures.id],
			name: "fm_global_tables_figures_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("fm_global_tables_table_id_key").on(table.tableId),
	check("chk_extraction_status", sql`extraction_status = ANY (ARRAY['pending'::text, 'extracted'::text, 'vectorized'::text, 'verified'::text])`),
]);

export const notes = pgTable("notes", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "notes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	title: text(),
	body: text(),
	createdBy: uuid("created_by").default(sql`auth.uid()`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	archived: boolean().default(false),
}, (table) => [
	index("idx_notes_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notes_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "notes_project_fkey"
		}).onDelete("cascade"),
]);

export const documentExecutiveSummaries = pgTable("document_executive_summaries", {
	id: serial().primaryKey().notNull(),
	documentId: uuid("document_id").notNull(),
	projectId: integer("project_id"),
	executiveSummary: text("executive_summary").notNull(),
	criticalPathItems: integer("critical_path_items").default(0),
	totalInsights: integer("total_insights").default(0),
	confidenceAverage: numeric("confidence_average", { precision: 3, scale:  2 }).default('0.0'),
	budgetDiscussions: jsonb("budget_discussions").default([]),
	costImplications: numeric("cost_implications"),
	revenueImpact: numeric("revenue_impact"),
	financialDecisionsCount: integer("financial_decisions_count").default(0),
	delayRisks: jsonb("delay_risks").default([]),
	criticalDeadlines: jsonb("critical_deadlines").default([]),
	timelineConcernsCount: integer("timeline_concerns_count").default(0),
	relationshipChanges: jsonb("relationship_changes").default([]),
	performanceIssues: jsonb("performance_issues").default([]),
	stakeholderFeedbackCount: integer("stakeholder_feedback_count").default(0),
	decisionsMade: jsonb("decisions_made").default([]),
	competitiveIntel: jsonb("competitive_intel").default([]),
	strategicPivots: jsonb("strategic_pivots").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const fmSections = pgTable("fm_sections", {
	id: varchar().primaryKey().notNull(),
	number: varchar().notNull(),
	title: varchar().notNull(),
	slug: varchar().notNull(),
	sortKey: integer("sort_key").notNull(),
	parentId: varchar("parent_id"),
	pageStart: integer("page_start").notNull(),
	pageEnd: integer("page_end").notNull(),
	sectionPath: text("section_path").array(),
	breadcrumbDisplay: text("breadcrumb_display").array(),
	isVisible: boolean("is_visible").default(true),
	sectionType: varchar("section_type").default('section'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_fm_sections_parent").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
	index("idx_fm_sections_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_fm_sections_sort").using("btree", table.sortKey.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "fm_sections_parent_id_fkey"
		}).onDelete("set null"),
	unique("fm_sections_slug_key").on(table.slug),
	pgPolicy("Allow public read access on fm_sections", { as: "permissive", for: "select", to: ["public"], using: sql`(is_visible = true)` }),
]);

export const asrsSections = pgTable("asrs_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	number: text().notNull(),
	title: text().notNull(),
	parentId: uuid("parent_id"),
	slug: text().notNull(),
	sortKey: integer("sort_key").notNull(),
}, (table) => [
	index("asrs_sections_number_idx").using("btree", table.number.asc().nullsLast().op("text_ops")),
	index("idx_asrs_sections_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_asrs_sections_sort").using("btree", table.sortKey.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "asrs_sections_parent_id_fkey"
		}),
	unique("asrs_sections_slug_key").on(table.slug),
]);

export const fmBlocks = pgTable("fm_blocks", {
	id: varchar().primaryKey().notNull(),
	sectionId: varchar("section_id").notNull(),
	blockType: varchar("block_type").notNull(),
	ordinal: integer().notNull(),
	sourceText: text("source_text").notNull(),
	html: text().notNull(),
	meta: jsonb().default({}),
	pageReference: integer("page_reference"),
	inlineFigures: integer("inline_figures").array(),
	inlineTables: text("inline_tables").array(),
	// NOTE: tsvector type - using text as fallback for Drizzle compatibility
	searchVector: text("search_vector"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_fm_blocks_search").using("gin", table.searchVector.asc().nullsLast().op("tsvector_ops")),
	index("idx_fm_blocks_section").using("btree", table.sectionId.asc().nullsLast().op("int4_ops"), table.ordinal.asc().nullsLast().op("int4_ops")),
	index("idx_fm_blocks_type").using("btree", table.blockType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [fmSections.id],
			name: "fm_blocks_section_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow public read access on fm_blocks", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const asrsProtectionRules = pgTable("asrs_protection_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionId: uuid("section_id").notNull(),
	asrsType: text("asrs_type"),
	containerWall: text("container_wall"),
	containerMaterial: text("container_material"),
	containerTop: text("container_top"),
	commodityClass: text("commodity_class"),
	ceilingHeightMin: numeric("ceiling_height_min"),
	ceilingHeightMax: numeric("ceiling_height_max"),
	sprinklerScheme: text("sprinkler_scheme"),
	kFactor: numeric("k_factor"),
	densityGpmFt2: numeric("density_gpm_ft2"),
	areaFt2: numeric("area_ft2"),
	pressurePsi: numeric("pressure_psi"),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [asrsSections.id],
			name: "asrs_protection_rules_section_id_fkey"
		}),
]);

export const blockEmbeddings = pgTable("block_embeddings", {
	blockId: uuid("block_id").primaryKey().notNull(),
	embedding: vector({ dimensions: 1536 }),
}, (table) => [
	foreignKey({
			columns: [table.blockId],
			foreignColumns: [asrsBlocks.id],
			name: "block_embeddings_block_id_fkey"
		}).onDelete("cascade"),
]);

export const projectMembers = pgTable("project_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	access: text().notNull(),
	permissions: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_project_members_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_project_members_project_user").using("btree", table.projectId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_project_members_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_members_project_id_fkey"
		}).onDelete("cascade"),
	unique("project_members_project_id_user_id_key").on(table.projectId, table.userId),
	pgPolicy("project_members_select_own", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(user_id = ( SELECT auth.uid() AS uid))` }),
	pgPolicy("project_members_insert_for_authenticated", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("project_members_update_own", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("project_members_admin_update", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const projectUsers = pgTable("project_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 100 }).notNull(),
	permissions: jsonb(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_project_users_project_id").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	index("idx_project_users_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_users_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_users_user_id_fkey"
		}).onDelete("cascade"),
	unique("project_users_project_id_user_id_key").on(table.projectId, table.userId),
]);

export const specifications = pgTable("specifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	sectionNumber: varchar("section_number", { length: 50 }).notNull(),
	sectionTitle: varchar("section_title", { length: 255 }).notNull(),
	division: varchar({ length: 50 }),
	specificationType: varchar("specification_type", { length: 50 }).default('csi'),
	documentUrl: text("document_url"),
	content: text(),
	requirements: jsonb(),
	keywords: text().array(),
	aiSummary: text("ai_summary"),
	version: varchar({ length: 50 }).default('1.0'),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_specifications_content_search").using("gin", sql`to_tsvector('english'::regconfig, content)`),
	index("idx_specifications_project_id").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	index("idx_specifications_requirements").using("gin", table.requirements.asc().nullsLast().op("jsonb_ops")),
	index("idx_specifications_section").using("btree", table.sectionNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "specifications_project_id_fkey"
		}).onDelete("cascade"),
	check("specifications_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'superseded'::character varying, 'archived'::character varying])::text[])`),
]);

export const contacts = pgTable("contacts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "contacts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	birthday: text(),
	notes: text(),
	jobTitle: text("job_title"),
	department: text(),
	projects: text().array().default([""]),
	metadata: jsonb().default({}),
	address: text(),
	city: text(),
	state: text(),
	zip: text(),
	country: text(),
	type: text(),
	companyId: uuid("company_id"),
	companyName: text("company_name"),
}, (table) => [
	index("idx_contacts_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "contacts_company_id_fkey"
		}).onDelete("set null"),
]);

export const chatHistory = pgTable("chat_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	userId: uuid("user_id"),
	role: text().notNull(),
	content: text().notNull(),
	sources: jsonb().default([]),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_chat_history_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_chat_history_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_history_user_id_fkey"
		}).onDelete("cascade"),
	check("chat_history_role_check", sql`role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])`),
]);

export const processingQueue = pgTable("processing_queue", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid("document_id").notNull(),
	jobType: text("job_type").notNull(),
	status: text().default('queued'),
	priority: integer().default(5),
	attempts: integer().default(0),
	maxAttempts: integer("max_attempts").default(3),
	errorMessage: text("error_message"),
	config: jsonb().default({}),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_processing_queue_document_id").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_processing_queue_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("processing_queue_job_type_check", sql`job_type = ANY (ARRAY['chunk'::text, 'embed'::text, 'index'::text])`),
	check("processing_queue_status_check", sql`status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text])`),
]);

export const budgetLineHistory = pgTable("budget_line_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	budgetLineId: uuid("budget_line_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	fieldName: text("field_name").notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	changedBy: uuid("changed_by"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	changeType: text("change_type").notNull(),
	notes: text(),
}, (table) => [
	index("idx_budget_line_history_budget_line_id").using("btree", table.budgetLineId.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_line_history_changed_at").using("btree", table.changedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_budget_line_history_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.budgetLineId],
			foreignColumns: [budgetLines.id],
			name: "budget_line_history_budget_line_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "budget_line_history_changed_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "budget_line_history_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("budget_line_history_select_for_authenticated", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("budget_line_history_insert_for_authenticated", { as: "permissive", for: "insert", to: ["authenticated"] }),
	check("budget_line_history_change_type_check", sql`change_type = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])`),
]);

export const submittalTypes = pgTable("submittal_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
	description: text(),
	requiredDocuments: text("required_documents").array(),
	reviewCriteria: jsonb("review_criteria"),
	aiAnalysisConfig: jsonb("ai_analysis_config"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("submittal_types_name_key").on(table.name),
]);

export const initiatives = pgTable("initiatives", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text().notNull(),
	status: text().default('active'),
	priority: text().default('medium'),
	completionPercentage: integer("completion_percentage").default(0),
	owner: text(),
	teamMembers: text("team_members").array(),
	stakeholders: text().array(),
	startDate: date("start_date"),
	targetCompletion: date("target_completion"),
	actualCompletion: date("actual_completion"),
	keywords: text().array(),
	aliases: text().array(),
	budget: numeric(),
	budgetUsed: numeric("budget_used").default('0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	notes: text(),
	documentationLinks: text("documentation_links").array(),
	relatedProjectIds: integer("related_project_ids").array(),
}, (table) => [
	index("idx_initiatives_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_initiatives_keywords").using("gin", table.keywords.asc().nullsLast().op("array_ops")),
	index("idx_initiatives_owner").using("btree", table.owner.asc().nullsLast().op("text_ops")),
	index("idx_initiatives_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("initiatives_name_key").on(table.name),
	check("initiatives_category_check", sql`category = ANY (ARRAY['hiring'::text, 'operations'::text, 'process_improvement'::text, 'training'::text, 'technology'::text, 'compliance'::text, 'marketing'::text, 'finance'::text, 'other'::text])`),
	check("initiatives_completion_percentage_check", sql`(completion_percentage >= 0) AND (completion_percentage <= 100)`),
	check("initiatives_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])`),
	check("initiatives_status_check", sql`status = ANY (ARRAY['active'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const contractPayments = pgTable("contract_payments", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	billingPeriodId: uuid("billing_period_id"),
	paymentNumber: text("payment_number").notNull(),
	paymentDate: date("payment_date").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	paymentType: text("payment_type").default('progress').notNull(),
	status: text().default('pending').notNull(),
	checkNumber: text("check_number"),
	referenceNumber: text("reference_number"),
	approvedBy: uuid("approved_by"),
	approvedDate: date("approved_date"),
	paidDate: date("paid_date"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_payments_approved_by").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_payments_billing_period").using("btree", table.billingPeriodId.asc().nullsLast().op("uuid_ops")),
	index("idx_payments_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_payments_payment_date").using("btree", table.paymentDate.asc().nullsLast().op("date_ops")),
	index("idx_payments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "contract_payments_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.billingPeriodId],
			foreignColumns: [contractBillingPeriods.id],
			name: "contract_payments_billing_period_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [primeContracts.id],
			name: "contract_payments_contract_id_fkey"
		}).onDelete("cascade"),
	unique("contract_payments_contract_id_payment_number_key").on(table.contractId, table.paymentNumber),
	pgPolicy("Users can view payments in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_payments.contract_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create payments", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update payments", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete payments", { as: "permissive", for: "delete", to: ["public"] }),
	check("contract_payments_amount_check", sql`amount > (0)::numeric`),
	check("contract_payments_payment_type_check", sql`payment_type = ANY (ARRAY['progress'::text, 'retention'::text, 'final'::text, 'advance'::text])`),
	check("contract_payments_status_check", sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])`),
	check("valid_approval_date", sql`((status = ANY (ARRAY['approved'::text, 'paid'::text])) AND (approved_date IS NOT NULL) AND (approved_by IS NOT NULL)) OR (status = ANY (ARRAY['pending'::text, 'cancelled'::text]))`),
	check("valid_paid_date", sql`((status = 'paid'::text) AND (paid_date IS NOT NULL)) OR (status = ANY (ARRAY['pending'::text, 'approved'::text, 'cancelled'::text]))`),
]);

export const contractBillingPeriods = pgTable("contract_billing_periods", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	periodNumber: integer("period_number").notNull(),
	billingDate: date("billing_date").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	workCompleted: numeric("work_completed", { precision: 15, scale:  2 }).default('0').notNull(),
	storedMaterials: numeric("stored_materials", { precision: 15, scale:  2 }).default('0').notNull(),
	currentPaymentDue: numeric("current_payment_due", { precision: 15, scale:  2 }).generatedAlwaysAs(sql`(work_completed + stored_materials)`),
	retentionPercentage: numeric("retention_percentage", { precision: 5, scale:  2 }).default('0').notNull(),
	retentionAmount: numeric("retention_amount", { precision: 15, scale:  2 }).default('0').notNull(),
	netPaymentDue: numeric("net_payment_due", { precision: 15, scale:  2 }).generatedAlwaysAs(sql`((work_completed + stored_materials) - retention_amount)`),
	status: text().default('draft').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_billing_periods_billing_date").using("btree", table.billingDate.asc().nullsLast().op("date_ops")),
	index("idx_billing_periods_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	index("idx_billing_periods_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_billing_periods_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [primeContracts.id],
			name: "contract_billing_periods_contract_id_fkey"
		}).onDelete("cascade"),
	unique("contract_billing_periods_contract_id_period_number_key").on(table.contractId, table.periodNumber),
	pgPolicy("Users can view billing periods in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_billing_periods.contract_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create billing periods", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update billing periods", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete billing periods", { as: "permissive", for: "delete", to: ["public"] }),
	check("contract_billing_periods_retention_amount_check", sql`retention_amount >= (0)::numeric`),
	check("contract_billing_periods_retention_percentage_check", sql`(retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)`),
	check("contract_billing_periods_status_check", sql`status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'paid'::text])`),
	check("contract_billing_periods_stored_materials_check", sql`stored_materials >= (0)::numeric`),
	check("contract_billing_periods_work_completed_check", sql`work_completed >= (0)::numeric`),
	check("valid_billing_date", sql`billing_date >= start_date`),
	check("valid_date_range", sql`start_date <= end_date`),
]);

export const risks = pgTable("risks", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	metadataId: text("metadata_id").notNull(),
	segmentId: uuid("segment_id"),
	sourceChunkId: uuid("source_chunk_id"),
	description: text().notNull(),
	category: text(),
	likelihood: text(),
	impact: text(),
	ownerName: text("owner_name"),
	ownerEmail: text("owner_email"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	mitigationPlan: text("mitigation_plan"),
	status: text().default('open').notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	projectIds: integer("project_ids").array().default([]),
}, (table) => [
	index("risks_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({m: "16",ef_construction: "64"}),
	index("risks_project_ids_gin_idx").using("gin", table.projectIds.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.metadataId],
			foreignColumns: [documentMetadata.id],
			name: "risks_metadata_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.segmentId],
			foreignColumns: [meetingSegments.id],
			name: "risks_segment_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sourceChunkId],
			foreignColumns: [documents.id],
			name: "risks_source_chunk_id_fkey"
		}).onDelete("set null"),
	unique("risks_metadata_id_description_key").on(table.metadataId, table.description),
	check("risks_impact_check", sql`impact = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])`),
	check("risks_likelihood_check", sql`likelihood = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])`),
	check("risks_status_check", sql`status = ANY (ARRAY['open'::text, 'mitigated'::text, 'closed'::text, 'occurred'::text])`),
]);

export const submittals = pgTable("submittals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	specificationId: uuid("specification_id"),
	submittalTypeId: uuid("submittal_type_id").notNull(),
	submittalNumber: varchar("submittal_number", { length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	submittedBy: uuid("submitted_by").notNull(),
	submitterCompany: varchar("submitter_company", { length: 255 }),
	submissionDate: timestamp("submission_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	requiredApprovalDate: date("required_approval_date"),
	priority: varchar({ length: 50 }).default('normal'),
	status: varchar({ length: 50 }).default('submitted'),
	currentVersion: integer("current_version").default(1),
	totalVersions: integer("total_versions").default(1),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_submittals_metadata").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
	index("idx_submittals_number").using("btree", table.submittalNumber.asc().nullsLast().op("text_ops")),
	index("idx_submittals_project_id").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	index("idx_submittals_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_submittals_submission_date").using("btree", table.submissionDate.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "submittals_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.specificationId],
			foreignColumns: [specifications.id],
			name: "submittals_specification_id_fkey"
		}),
	foreignKey({
			columns: [table.submittalTypeId],
			foreignColumns: [submittalTypes.id],
			name: "submittals_submittal_type_id_fkey"
		}),
	foreignKey({
			columns: [table.submittedBy],
			foreignColumns: [users.id],
			name: "submittals_submitted_by_fkey"
		}),
	unique("submittals_project_id_submittal_number_key").on(table.projectId, table.submittalNumber),
	pgPolicy("Authenticated users can manage submittals", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true`, withCheck: sql`true`  }),
	check("submittals_priority_check", sql`(priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'critical'::character varying])::text[])`),
	check("submittals_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'under_review'::character varying, 'requires_revision'::character varying, 'approved'::character varying, 'rejected'::character varying, 'superseded'::character varying])::text[])`),
]);

export const subcontractors = pgTable("subcontractors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyName: text("company_name").notNull(),
	legalBusinessName: text("legal_business_name"),
	dbaName: text("dba_name"),
	companyType: text("company_type"),
	taxId: text("tax_id"),
	primaryContactName: text("primary_contact_name").notNull(),
	primaryContactTitle: text("primary_contact_title"),
	primaryContactEmail: text("primary_contact_email"),
	primaryContactPhone: text("primary_contact_phone"),
	secondaryContactName: text("secondary_contact_name"),
	secondaryContactEmail: text("secondary_contact_email"),
	secondaryContactPhone: text("secondary_contact_phone"),
	addressLine1: text("address_line_1"),
	addressLine2: text("address_line_2"),
	city: text(),
	stateProvince: text("state_province"),
	postalCode: text("postal_code"),
	country: text().default('United States'),
	specialties: text().array(),
	serviceAreas: text("service_areas").array(),
	yearsInBusiness: integer("years_in_business"),
	employeeCount: integer("employee_count"),
	annualRevenueRange: text("annual_revenue_range"),
	asrsExperienceYears: integer("asrs_experience_years"),
	fmGlobalCertified: boolean("fm_global_certified").default(false),
	nfpaCertifications: text("nfpa_certifications").array(),
	sprinklerContractorLicense: text("sprinkler_contractor_license"),
	licenseExpirationDate: date("license_expiration_date"),
	maxProjectSize: text("max_project_size"),
	concurrentProjectsCapacity: integer("concurrent_projects_capacity"),
	preferredProjectTypes: text("preferred_project_types").array(),
	insuranceGeneralLiability: numeric("insurance_general_liability", { precision: 12, scale:  2 }),
	insuranceProfessionalLiability: numeric("insurance_professional_liability", { precision: 12, scale:  2 }),
	insuranceWorkersComp: boolean("insurance_workers_comp").default(false),
	bondingCapacity: numeric("bonding_capacity", { precision: 12, scale:  2 }),
	creditRating: text("credit_rating"),
	alleatoProjectsCompleted: integer("alleato_projects_completed").default(0),
	avgProjectRating: numeric("avg_project_rating", { precision: 3, scale:  2 }),
	onTimeCompletionRate: numeric("on_time_completion_rate", { precision: 5, scale:  2 }),
	safetyIncidentRate: numeric("safety_incident_rate", { precision: 5, scale:  2 }),
	preferredPaymentTerms: text("preferred_payment_terms"),
	markupPercentage: numeric("markup_percentage", { precision: 5, scale:  2 }),
	hourlyRatesRange: text("hourly_rates_range"),
	travelRadiusMiles: integer("travel_radius_miles"),
	projectManagementSoftware: text("project_management_software").array(),
	cadSoftwareProficiency: text("cad_software_proficiency").array(),
	bimCapabilities: boolean("bim_capabilities").default(false),
	digitalCollaborationTools: text("digital_collaboration_tools").array(),
	oshaTrainingCurrent: boolean("osha_training_current").default(false),
	drugTestingProgram: boolean("drug_testing_program").default(false),
	backgroundCheckPolicy: boolean("background_check_policy").default(false),
	qualityCertifications: text("quality_certifications").array(),
	status: text().default('active'),
	tierLevel: text("tier_level"),
	preferredVendor: boolean("preferred_vendor").default(false),
	masterAgreementSigned: boolean("master_agreement_signed").default(false),
	masterAgreementDate: date("master_agreement_date"),
	internalNotes: text("internal_notes"),
	strengths: text().array(),
	weaknesses: text().array(),
	specialRequirements: text("special_requirements"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
	updatedBy: uuid("updated_by"),
	emergencyContactName: text("emergency_contact_name"),
	emergencyContactPhone: text("emergency_contact_phone"),
	emergencyContactRelationship: text("emergency_contact_relationship"),
}, (table) => [
	index("idx_subcontractors_asrs_experience").using("btree", table.asrsExperienceYears.asc().nullsLast().op("int4_ops")),
	index("idx_subcontractors_company_name").using("btree", table.companyName.asc().nullsLast().op("text_ops")),
	index("idx_subcontractors_fm_certified").using("btree", table.fmGlobalCertified.asc().nullsLast().op("bool_ops")),
	index("idx_subcontractors_service_areas").using("gin", table.serviceAreas.asc().nullsLast().op("array_ops")),
	index("idx_subcontractors_specialties").using("gin", table.specialties.asc().nullsLast().op("array_ops")),
	index("idx_subcontractors_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_subcontractors_tier_level").using("btree", table.tierLevel.asc().nullsLast().op("text_ops")),
	pgPolicy("Authenticated users can view subcontractors", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Authenticated users can insert subcontractors", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Authenticated users can update subcontractors", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("subcontractors_annual_revenue_range_check", sql`annual_revenue_range = ANY (ARRAY['under_1m'::text, '1m_5m'::text, '5m_10m'::text, '10m_25m'::text, '25m_plus'::text])`),
	check("subcontractors_avg_project_rating_check", sql`(avg_project_rating >= (0)::numeric) AND (avg_project_rating <= (5)::numeric)`),
	check("subcontractors_company_type_check", sql`company_type = ANY (ARRAY['corporation'::text, 'llc'::text, 'partnership'::text, 'sole_proprietorship'::text, 'other'::text])`),
	check("subcontractors_credit_rating_check", sql`credit_rating = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'unknown'::text])`),
	check("subcontractors_max_project_size_check", sql`max_project_size = ANY (ARRAY['under_100k'::text, '100k_500k'::text, '500k_1m'::text, '1m_5m'::text, '5m_plus'::text])`),
	check("subcontractors_on_time_completion_rate_check", sql`(on_time_completion_rate >= (0)::numeric) AND (on_time_completion_rate <= (100)::numeric)`),
	check("subcontractors_preferred_payment_terms_check", sql`preferred_payment_terms = ANY (ARRAY['net_15'::text, 'net_30'::text, 'net_45'::text, 'net_60'::text, 'progress_billing'::text])`),
	check("subcontractors_status_check", sql`status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending_approval'::text, 'blacklisted'::text])`),
	check("subcontractors_tier_level_check", sql`tier_level = ANY (ARRAY['platinum'::text, 'gold'::text, 'silver'::text, 'bronze'::text, 'unrated'::text])`),
]);

export const projectResources = pgTable("project_resources", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "project_resources_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: text(),
	description: text(),
	type: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_resources_project_id_fkey"
		}).onUpdate("cascade").onDelete("set default"),
]);

export const submittalDocuments = pgTable("submittal_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submittalId: uuid("submittal_id").notNull(),
	documentName: varchar("document_name", { length: 255 }).notNull(),
	documentType: varchar("document_type", { length: 100 }),
	fileUrl: text("file_url").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
	mimeType: varchar("mime_type", { length: 100 }),
	pageCount: integer("page_count"),
	extractedText: text("extracted_text"),
	aiAnalysis: jsonb("ai_analysis"),
	version: integer().default(1),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	uploadedBy: uuid("uploaded_by").notNull(),
}, (table) => [
	index("idx_submittal_documents_submittal_id").using("btree", table.submittalId.asc().nullsLast().op("uuid_ops")),
	index("idx_submittal_documents_text_search").using("gin", sql`to_tsvector('english'::regconfig, extracted_text)`),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "submittal_documents_submittal_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "submittal_documents_uploaded_by_fkey"
		}),
]);

export const files = pgTable("files", {
	id: varchar({ length: 191 }).primaryKey().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb(),
	embedding: vector({ dimensions: 1536 }),
	url: text(),
	status: text(),
	projectId: integer("project_id"),
	title: text(),
	category: text(),
}, (table) => [
	index("idx_files_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_files_project_id").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "files_project_id_fkey"
		}),
	pgPolicy("Allow authenticated insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`true`  }),
	pgPolicy("Allow public read", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Allow authenticated delete", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const requests = pgTable("requests", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	userQuery: text("user_query").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userProfiles.id],
			name: "requests_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view their own requests", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Admins can view all requests", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can insert requests", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Deny delete for requests", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const asrsLogicCards = pgTable("asrs_logic_cards", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "asrs_logic_cards_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	doc: text().default('FMDS0834').notNull(),
	version: text().default('2024-07').notNull(),
	clauseId: text("clause_id"),
	page: integer(),
	purpose: text().notNull(),
	preconditions: jsonb().notNull(),
	inputs: jsonb().notNull(),
	decision: jsonb().notNull(),
	citations: jsonb().notNull(),
	relatedTableIds: text("related_table_ids").array(),
	relatedFigureIds: text("related_figure_ids").array(),
	insertedAt: timestamp("inserted_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	sectionId: uuid("section_id"),
}, (table) => [
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [asrsSections.id],
			name: "asrs_logic_cards_section_id_fkey"
		}).onUpdate("cascade").onDelete("set default"),
]);

export const discrepancies = pgTable("discrepancies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submittalId: uuid("submittal_id").notNull(),
	specificationId: uuid("specification_id"),
	documentId: uuid("document_id"),
	discrepancyType: varchar("discrepancy_type", { length: 100 }).notNull(),
	severity: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	specRequirement: text("spec_requirement"),
	submittalContent: text("submittal_content"),
	suggestedResolution: text("suggested_resolution"),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }),
	locationInDoc: jsonb("location_in_doc"),
	status: varchar({ length: 50 }).default('open'),
	identifiedBy: varchar("identified_by", { length: 50 }).default('ai'),
	aiModelVersion: varchar("ai_model_version", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_discrepancies_location").using("gin", table.locationInDoc.asc().nullsLast().op("jsonb_ops")),
	index("idx_discrepancies_search").using("gin", sql`to_tsvector('english'::regconfig, (((title)::text || ' '::text)`),
	index("idx_discrepancies_severity").using("btree", table.severity.asc().nullsLast().op("text_ops")),
	index("idx_discrepancies_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_discrepancies_submittal_id").using("btree", table.submittalId.asc().nullsLast().op("uuid_ops")),
	index("idx_discrepancies_type").using("btree", table.discrepancyType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [submittalDocuments.id],
			name: "discrepancies_document_id_fkey"
		}),
	foreignKey({
			columns: [table.specificationId],
			foreignColumns: [specifications.id],
			name: "discrepancies_specification_id_fkey"
		}),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "discrepancies_submittal_id_fkey"
		}).onDelete("cascade"),
	check("discrepancies_severity_check", sql`(severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])`),
	check("discrepancies_status_check", sql`(status)::text = ANY ((ARRAY['open'::character varying, 'acknowledged'::character varying, 'resolved'::character varying, 'waived'::character varying, 'disputed'::character varying])::text[])`),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	isAdmin: boolean("is_admin").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	role: text().default('team'),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "user_profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view their own profile", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = id)` }),
	pgPolicy("Users can update their own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Only admins can change admin status", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Admins can view all profiles", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can update all profiles", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Deny delete for user_profiles", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const tasks = pgTable("tasks", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	metadataId: text("metadata_id").notNull(),
	segmentId: uuid("segment_id"),
	sourceChunkId: uuid("source_chunk_id"),
	description: text().notNull(),
	assigneeName: text("assignee_name"),
	assigneeEmail: text("assignee_email"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	dueDate: date("due_date"),
	priority: text(),
	status: text().default('open').notNull(),
	sourceSystem: text("source_system").default('fireflies').notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	projectIds: integer("project_ids").array().default([]),
}, (table) => [
	index("tasks_project_ids_gin_idx").using("gin", table.projectIds.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.metadataId],
			foreignColumns: [documentMetadata.id],
			name: "tasks_metadata_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "tasks_project_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.segmentId],
			foreignColumns: [meetingSegments.id],
			name: "tasks_segment_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sourceChunkId],
			foreignColumns: [documents.id],
			name: "tasks_source_chunk_id_fkey"
		}).onDelete("set null"),
	unique("tasks_metadata_id_description_key").on(table.metadataId, table.description),
	check("tasks_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])`),
	check("tasks_status_check", sql`status = ANY (ARRAY['open'::text, 'in_progress'::text, 'blocked'::text, 'done'::text, 'cancelled'::text])`),
]);

export const users = pgTable("users", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["public"], using: sql`(auth.uid() = id)` }),
	pgPolicy("Users can view own profile", { as: "permissive", for: "select", to: ["public"] }),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submittalId: uuid("submittal_id").notNull(),
	reviewerId: uuid("reviewer_id").notNull(),
	reviewType: varchar("review_type", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('pending'),
	decision: varchar({ length: 50 }),
	comments: text(),
	reviewCriteriaMet: jsonb("review_criteria_met"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_reviews_due_date").using("btree", table.dueDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_reviews_reviewer_id").using("btree", table.reviewerId.asc().nullsLast().op("uuid_ops")),
	index("idx_reviews_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_reviews_submittal_id").using("btree", table.submittalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reviewerId],
			foreignColumns: [users.id],
			name: "reviews_reviewer_id_fkey"
		}),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "reviews_submittal_id_fkey"
		}).onDelete("cascade"),
	check("reviews_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'skipped'::character varying])::text[])`),
]);

export const reviewComments = pgTable("review_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reviewId: uuid("review_id").notNull(),
	documentId: uuid("document_id"),
	discrepancyId: uuid("discrepancy_id"),
	commentType: varchar("comment_type", { length: 50 }).default('general'),
	comment: text().notNull(),
	locationInDoc: jsonb("location_in_doc"),
	priority: varchar({ length: 50 }).default('normal'),
	status: varchar({ length: 50 }).default('open'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "review_comments_created_by_fkey"
		}),
	foreignKey({
			columns: [table.discrepancyId],
			foreignColumns: [discrepancies.id],
			name: "review_comments_discrepancy_id_fkey"
		}),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [submittalDocuments.id],
			name: "review_comments_document_id_fkey"
		}),
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_comments_review_id_fkey"
		}).onDelete("cascade"),
	check("review_comments_priority_check", sql`(priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying])::text[])`),
	check("review_comments_status_check", sql`(status)::text = ANY ((ARRAY['open'::character varying, 'addressed'::character varying, 'resolved'::character varying])::text[])`),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	username: text(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	website: text(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	unique("profiles_username_key").on(table.username),
	pgPolicy("Public profiles are viewable by everyone.", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can insert their own profile.", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own profile.", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("username_length", sql`char_length(username) >= 3`),
]);

export const aiAnalysisJobs = pgTable("ai_analysis_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submittalId: uuid("submittal_id").notNull(),
	jobType: varchar("job_type", { length: 100 }).notNull(),
	status: varchar({ length: 50 }).default('queued'),
	modelVersion: varchar("model_version", { length: 50 }),
	config: jsonb(),
	inputData: jsonb("input_data"),
	results: jsonb(),
	confidenceMetrics: jsonb("confidence_metrics"),
	processingTimeMs: integer("processing_time_ms"),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_analysis_results").using("gin", table.results.asc().nullsLast().op("jsonb_ops")),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "ai_analysis_jobs_submittal_id_fkey"
		}).onDelete("cascade"),
	check("ai_analysis_jobs_status_check", sql`(status)::text = ANY ((ARRAY['queued'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])`),
]);

export const nodsPageSection = pgTable("nods_page_section", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pageId: bigint("page_id", { mode: "number" }).notNull(),
	content: text(),
	tokenCount: integer("token_count"),
	embedding: vector({ dimensions: 1536 }),
	slug: text(),
	heading: text(),
}, (table) => [
	foreignKey({
			columns: [table.pageId],
			foreignColumns: [nodsPage.id],
			name: "nods_page_section_page_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const drizzleMigrations = pgTable("__drizzle_migrations", {
	hash: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const submittalHistory = pgTable("submittal_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submittalId: uuid("submittal_id").notNull(),
	action: varchar({ length: 100 }).notNull(),
	actorId: uuid("actor_id"),
	actorType: varchar("actor_type", { length: 50 }).default('user'),
	description: text(),
	previousStatus: varchar("previous_status", { length: 50 }),
	newStatus: varchar("new_status", { length: 50 }),
	changes: jsonb(),
	metadata: jsonb(),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_submittal_history_submittal_id").using("btree", table.submittalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "submittal_history_actor_id_fkey"
		}),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "submittal_history_submittal_id_fkey"
		}).onDelete("cascade"),
]);

export const submittalNotifications = pgTable("submittal_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	projectId: integer("project_id"),
	submittalId: uuid("submittal_id"),
	notificationType: varchar("notification_type", { length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text(),
	priority: varchar({ length: 50 }).default('normal'),
	isRead: boolean("is_read").default(false),
	deliveryMethods: text("delivery_methods").array().default(["RAY['in_app'::tex"]),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).defaultNow(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_submittal_notifications_unread").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("bool_ops")),
	index("idx_submittal_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "submittal_notifications_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "submittal_notifications_submittal_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "submittal_notifications_user_id_fkey"
		}).onDelete("cascade"),
	check("submittal_notifications_priority_check", sql`(priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])`),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id"),
	role: text().notNull(),
	content: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("chat_messages_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [chatSessions.id],
			name: "chat_messages_session_id_fkey"
		}).onDelete("cascade"),
	check("chat_messages_role_check", sql`role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])`),
]);

export const aiModels = pgTable("ai_models", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	version: varchar({ length: 50 }).notNull(),
	modelType: varchar("model_type", { length: 100 }).notNull(),
	description: text(),
	config: jsonb(),
	performanceMetrics: jsonb("performance_metrics"),
	isActive: boolean("is_active").default(true),
	deploymentDate: timestamp("deployment_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("ai_models_name_key").on(table.name),
]);

export const vendors = pgTable("vendors", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: text().notNull(),
	contactName: text("contact_name"),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	country: text().default('US'),
	taxId: text("tax_id"),
	notes: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_vendors_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_vendors_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_vendors_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_vendors_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "vendors_company_id_fkey"
		}).onDelete("cascade"),
	unique("vendors_company_id_name_key").on(table.companyId, table.name),
	pgPolicy("Users can view vendors in their company", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM companies
  WHERE ((companies.id = vendors.company_id) AND (EXISTS ( SELECT 1
           FROM project_members
          WHERE (project_members.user_id = auth.uid()))))))` }),
	pgPolicy("Editors can create vendors", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update vendors", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete vendors", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const contractViews = pgTable("contract_views", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	companyId: uuid("company_id").notNull(),
	viewName: text("view_name").notNull(),
	description: text(),
	filters: jsonb(),
	columns: jsonb(),
	sortOrder: jsonb("sort_order"),
	isDefault: boolean("is_default").default(false).notNull(),
	isShared: boolean("is_shared").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contract_views_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_contract_views_is_default").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")),
	index("idx_contract_views_is_shared").using("btree", table.isShared.asc().nullsLast().op("bool_ops")),
	index("idx_contract_views_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "contract_views_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "contract_views_user_id_fkey"
		}).onDelete("cascade"),
	unique("contract_views_user_id_view_name_key").on(table.userId, table.viewName),
	pgPolicy("Users can view their own views", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("Users can view shared views in their company", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can create their own views", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update their own views", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete their own views", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const contractSnapshots = pgTable("contract_snapshots", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	snapshotDate: timestamp("snapshot_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	snapshotData: jsonb("snapshot_data").notNull(),
	createdBy: uuid("created_by"),
	reason: text(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contract_snapshots_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	index("idx_contract_snapshots_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_contract_snapshots_date").using("btree", table.snapshotDate.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [primeContracts.id],
			name: "contract_snapshots_contract_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "contract_snapshots_created_by_fkey"
		}),
	pgPolicy("Users can view snapshots in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_snapshots.contract_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create snapshots", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can delete snapshots", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const contractDocuments = pgTable("contract_documents", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	documentName: text("document_name").notNull(),
	documentType: text("document_type").notNull(),
	filePath: text("file_path").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	mimeType: text("mime_type"),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	version: integer().default(1).notNull(),
	isCurrentVersion: boolean("is_current_version").default(true).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contract_documents_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	index("idx_contract_documents_is_current").using("btree", table.isCurrentVersion.asc().nullsLast().op("bool_ops")),
	index("idx_contract_documents_type").using("btree", table.documentType.asc().nullsLast().op("text_ops")),
	index("idx_contract_documents_uploaded_at").using("btree", table.uploadedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_contract_documents_uploaded_by").using("btree", table.uploadedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [primeContracts.id],
			name: "contract_documents_contract_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "contract_documents_uploaded_by_fkey"
		}),
	pgPolicy("Users can view documents in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_documents.contract_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can upload documents", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update documents", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete documents", { as: "permissive", for: "delete", to: ["public"] }),
	check("contract_documents_document_type_check", sql`document_type = ANY (ARRAY['contract'::text, 'amendment'::text, 'insurance'::text, 'bond'::text, 'lien_waiver'::text, 'change_order'::text, 'invoice'::text, 'other'::text])`),
]);

export const submittalAnalyticsEvents = pgTable("submittal_analytics_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	projectId: integer("project_id"),
	submittalId: uuid("submittal_id"),
	userId: uuid("user_id"),
	eventData: jsonb("event_data"),
	sessionId: varchar("session_id", { length: 255 }),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "submittal_analytics_events_project_id_fkey"
		}),
	foreignKey({
			columns: [table.submittalId],
			foreignColumns: [submittals.id],
			name: "submittal_analytics_events_submittal_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "submittal_analytics_events_user_id_fkey"
		}),
]);

export const documents = pgTable("documents", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	title: text(),
	source: text(),
	content: text().notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	fileId: text("file_id").notNull(),
	firefliesId: text("fireflies_id"),
	processingStatus: varchar("processing_status", { length: 20 }).default('pending'),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	project: text(),
	fileDate: timestamp("file_date", { withTimezone: true, mode: 'string' }),
	embedding: vector({ dimensions: 1536 }),
	url: text(),
	storageObjectId: uuid("storage_object_id"),
	projectIds: integer("project_ids").array().default([]),
}, (table) => [
	index("documents_project_ids_gin_idx").using("gin", table.projectIds.asc().nullsLast().op("array_ops")),
	index("idx_documents_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_documents_metadata").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
	index("idx_documents_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_documents_storage_object_id").using("btree", table.storageObjectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [documentMetadata.id],
			name: "documents_file_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "documents_project_id_fkey"
		}).onUpdate("cascade").onDelete("set default"),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Service role has full access", { as: "permissive", for: "all", to: ["service_role"] }),
	pgPolicy("Enable insert for authenticated users", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Enable update for authenticated users", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Enable delete for authenticated users", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const submittalPerformanceMetrics = pgTable("submittal_performance_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id"),
	metricType: varchar("metric_type", { length: 100 }).notNull(),
	metricName: varchar("metric_name", { length: 255 }).notNull(),
	value: numeric({ precision: 10, scale:  4 }),
	unit: varchar({ length: 50 }),
	periodStart: timestamp("period_start", { withTimezone: true, mode: 'string' }),
	periodEnd: timestamp("period_end", { withTimezone: true, mode: 'string' }),
	metadata: jsonb(),
	calculatedAt: timestamp("calculated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "submittal_performance_metrics_project_id_fkey"
		}),
]);

export const fmGlobalFigures = pgTable("fm_global_figures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	figureNumber: integer("figure_number").notNull(),
	title: text().notNull(),
	cleanCaption: text("clean_caption").notNull(),
	normalizedSummary: text("normalized_summary").notNull(),
	figureType: text("figure_type").notNull(),
	asrsType: text("asrs_type").notNull(),
	containerType: text("container_type"),
	maxDepthFt: numeric("max_depth_ft"),
	maxDepthM: numeric("max_depth_m"),
	maxSpacingFt: numeric("max_spacing_ft"),
	maxSpacingM: numeric("max_spacing_m"),
	ceilingHeightFt: numeric("ceiling_height_ft"),
	aisleWidthFt: numeric("aisle_width_ft"),
	relatedTables: integer("related_tables").array(),
	applicableCommodities: text("applicable_commodities").array(),
	systemRequirements: jsonb("system_requirements"),
	specialConditions: text("special_conditions").array(),
	machineReadableClaims: jsonb("machine_readable_claims"),
	calloutsLabels: text("callouts_labels").array(),
	axisTitles: text("axis_titles").array(),
	axisUnits: text("axis_units").array(),
	embeddedTables: jsonb("embedded_tables"),
	footnotes: text().array(),
	pageNumber: integer("page_number"),
	sectionReference: text("section_reference"),
	embedding: vector({ dimensions: 1536 }),
	searchKeywords: text("search_keywords").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	sectionReferences: text("section_references").array(),
	image: text(),
}, (table) => [
	index("fm_global_figures_claims_gin").using("gin", table.machineReadableClaims.asc().nullsLast().op("jsonb_ops")),
	index("fm_global_figures_num_idx").using("btree", table.figureNumber.asc().nullsLast().op("int4_ops")),
	index("idx_figures_asrs_type").using("btree", table.asrsType.asc().nullsLast().op("text_ops")),
	index("idx_figures_container_type").using("btree", table.containerType.asc().nullsLast().op("text_ops")),
	index("idx_figures_embedding").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	index("idx_figures_keywords").using("gin", table.searchKeywords.asc().nullsLast().op("array_ops")),
	index("idx_figures_number").using("btree", table.figureNumber.asc().nullsLast().op("int4_ops")),
	index("idx_figures_tables").using("gin", table.relatedTables.asc().nullsLast().op("array_ops")),
	index("idx_figures_type").using("btree", table.figureType.asc().nullsLast().op("text_ops")),
	index("idx_fm_global_figures_number").using("btree", table.figureNumber.asc().nullsLast().op("int4_ops")),
	unique("fm_global_figures_figure_number_key").on(table.figureNumber),
	pgPolicy("Figures are viewable by authenticated users", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("Figures are viewable by anonymous users", { as: "permissive", for: "select", to: ["public"] }),
	check("fm_global_figures_asrs_type_check", sql`asrs_type = ANY (ARRAY['All'::text, 'Shuttle'::text, 'Mini-Load'::text, 'Top-Loading'::text, 'Vertically-Enclosed'::text])`),
	check("fm_global_figures_container_type_check", sql`container_type = ANY (ARRAY['Closed-Top'::text, 'Open-Top'::text, 'Noncombustible'::text, 'Plastic'::text, 'Mixed'::text])`),
	check("fm_global_figures_figure_type_check", sql`figure_type = ANY (ARRAY['Navigation/Decision Tree'::text, 'System Diagram'::text, 'Sprinkler Layout'::text, 'Protection Scheme'::text, 'Configuration'::text, 'Installation Detail'::text, 'Special Arrangement'::text])`),
]);

export const projectBriefings = pgTable("project_briefings", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	briefingContent: text("briefing_content").notNull(),
	briefingType: varchar("briefing_type", { length: 50 }).default('executive_summary'),
	sourceDocuments: text("source_documents").array().notNull(),
	generatedAt: timestamp("generated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	generatedBy: varchar("generated_by", { length: 100 }),
	tokenCount: integer("token_count"),
	version: integer().default(1),
}, (table) => [
	index("idx_briefings_date").using("btree", table.generatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_briefings_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_briefings_project_id_fkey"
		}),
	unique("unique_latest_briefing").on(table.projectId, table.version),
]);

export const budgetModificationLines = pgTable("budget_modification_lines", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	budgetModificationId: uuid("budget_modification_id").notNull(),
	budgetLineId: uuid("budget_line_id").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_budget_modification_lines_budget_line").using("btree", table.budgetLineId.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_modification_lines_modification").using("btree", table.budgetModificationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.budgetLineId],
			foreignColumns: [budgetLines.id],
			name: "budget_modification_lines_budget_line_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.budgetModificationId],
			foreignColumns: [budgetModifications.id],
			name: "budget_modification_lines_budget_modification_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view budget modification lines", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
]);

export const commitmentLines = pgTable("commitment_lines", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	commitmentId: uuid("commitment_id").notNull(),
	budgetLineId: uuid("budget_line_id"),
	costCodeId: text("cost_code_id"),
	costTypeId: uuid("cost_type_id"),
	description: text(),
	quantity: numeric({ precision: 15, scale:  4 }),
	unitOfMeasure: text("unit_of_measure"),
	unitCost: numeric("unit_cost", { precision: 15, scale:  4 }),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_commitment_lines_budget_line").using("btree", table.budgetLineId.asc().nullsLast().op("uuid_ops")),
	index("idx_commitment_lines_commitment").using("btree", table.commitmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_commitment_lines_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.budgetLineId],
			foreignColumns: [budgetLines.id],
			name: "commitment_lines_budget_line_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.commitmentId],
			foreignColumns: [commitments.id],
			name: "commitment_lines_commitment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "commitment_lines_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "commitment_lines_cost_type_id_fkey"
		}),
	pgPolicy("Users can view commitment lines", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
]);

export const briefingRuns = pgTable("briefing_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	briefingId: uuid("briefing_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	status: text(),
	tokenUsage: jsonb("token_usage"),
	inputDocIds: text("input_doc_ids").array(),
	error: text(),
}, (table) => [
	foreignKey({
			columns: [table.briefingId],
			foreignColumns: [projectBriefings.id],
			name: "briefing_runs_briefing_id_fkey"
		}),
]);

export const clients = pgTable("clients", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "clients_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text(),
	companyId: uuid("company_id"),
	status: text(),
	code: text(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "clients_company_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const subcontractorContacts = pgTable("subcontractor_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subcontractorId: uuid("subcontractor_id"),
	name: text().notNull(),
	title: text(),
	email: text(),
	phone: text(),
	mobilePhone: text("mobile_phone"),
	contactType: text("contact_type"),
	isPrimary: boolean("is_primary").default(false),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_subcontractor_contacts_subcontractor_id").using("btree", table.subcontractorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subcontractorId],
			foreignColumns: [subcontractors.id],
			name: "subcontractor_contacts_subcontractor_id_fkey"
		}).onDelete("cascade"),
	check("subcontractor_contacts_contact_type_check", sql`contact_type = ANY (ARRAY['primary'::text, 'secondary'::text, 'project_manager'::text, 'estimator'::text, 'safety'::text, 'billing'::text])`),
]);

export const subcontractorDocuments = pgTable("subcontractor_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subcontractorId: uuid("subcontractor_id"),
	documentType: text("document_type").notNull(),
	documentName: text("document_name").notNull(),
	fileUrl: text("file_url"),
	expirationDate: date("expiration_date"),
	isCurrent: boolean("is_current").default(true),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	uploadedBy: uuid("uploaded_by"),
}, (table) => [
	index("idx_subcontractor_documents_expiration").using("btree", table.expirationDate.asc().nullsLast().op("date_ops")),
	index("idx_subcontractor_documents_subcontractor_id").using("btree", table.subcontractorId.asc().nullsLast().op("uuid_ops")),
	index("idx_subcontractor_documents_type").using("btree", table.documentType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subcontractorId],
			foreignColumns: [subcontractors.id],
			name: "subcontractor_documents_subcontractor_id_fkey"
		}).onDelete("cascade"),
	check("subcontractor_documents_document_type_check", sql`document_type = ANY (ARRAY['insurance_certificate'::text, 'license'::text, 'w9'::text, 'master_agreement'::text, 'safety_manual'::text, 'quality_certificate'::text, 'reference_letter'::text, 'other'::text])`),
]);

export const prospectsCapitalized = pgTable("Prospects", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "Prospects_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contact: bigint({ mode: "number" }),
	status: text(),
}, (table) => [
	foreignKey({
			columns: [table.contact],
			foreignColumns: [contacts.id],
			name: "Prospects_contact_fkey"
		}).onUpdate("cascade").onDelete("set default"),
]);

export const projects = pgTable("projects", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "projects_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text(),
	jobNumber: text("job number"),
	startDate: date("start date"),
	estCompletion: date("est completion"),
	estRevenue: numeric("est revenue"),
	estProfit: numeric("est profit"),
	address: text(),
	onedrive: text(),
	phase: text(),
	state: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	category: text(),
	aliases: text().array().default([""]),
	teamMembers: text("team_members").array().default([""]),
	currentPhase: varchar("current_phase", { length: 100 }),
	completionPercentage: integer("completion_percentage").default(0),
	budget: numeric({ precision: 12, scale:  2 }),
	budgetUsed: numeric("budget_used", { precision: 12, scale:  2 }).default('0'),
	client: text(),
	summary: text(),
	summaryMetadata: jsonb("summary_metadata").default({}),
	summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true, mode: 'string' }),
	healthScore: numeric("health_score", { precision: 5, scale:  2 }),
	healthStatus: text("health_status"),
	access: text(),
	archived: boolean().default(false).notNull(),
	archivedBy: uuid("archived_by"),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	erpSystem: text("erp_system"),
	erpLastJobCostSync: timestamp("erp_last_job_cost_sync", { withTimezone: true, mode: 'string' }),
	erpLastDirectCostSync: timestamp("erp_last_direct_cost_sync", { withTimezone: true, mode: 'string' }),
	erpSyncStatus: text("erp_sync_status"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectManager: bigint("project_manager", { mode: "number" }),
	projectNumber: varchar("project_number", { length: 50 }),
	stakeholders: jsonb().default([]),
	budgetLocked: boolean("budget_locked").default(false),
	budgetLockedAt: timestamp("budget_locked_at", { withTimezone: true, mode: 'string' }),
	budgetLockedBy: uuid("budget_locked_by"),
	workScope: text("work_scope"),
	projectSector: text("project_sector"),
	deliveryMethod: text("delivery_method"),
	nameCode: text("name_code"),
	type: text(),
}, (table) => [
	index("idx_projects_archived").using("btree", table.archived.asc().nullsLast().op("bool_ops")),
	index("idx_projects_delivery_method").using("btree", table.deliveryMethod.asc().nullsLast().op("text_ops")),
	index("idx_projects_health_score").using("btree", table.healthScore.desc().nullsFirst().op("numeric_ops")),
	index("idx_projects_phase").using("btree", table.phase.asc().nullsLast().op("text_ops")),
	index("idx_projects_project_manager").using("btree", table.projectManager.asc().nullsLast().op("int8_ops")),
	uniqueIndex("idx_projects_project_number").using("btree", table.projectNumber.asc().nullsLast().op("text_ops")).where(sql`(project_number IS NOT NULL)`),
	index("idx_projects_project_sector").using("btree", table.projectSector.asc().nullsLast().op("text_ops")),
	index("idx_projects_state").using("btree", table.state.asc().nullsLast().op("text_ops")),
	index("idx_projects_summary_updated").using("btree", table.summaryUpdatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_projects_work_scope").using("btree", table.workScope.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.budgetLockedBy],
			foreignColumns: [appUsers.id],
			name: "projects_budget_locked_by_fkey"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "projects_client_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.projectManager],
			foreignColumns: [employees.id],
			name: "projects_project_manager_fkey"
		}).onDelete("set null"),
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("projects_select_for_members", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("projects_insert_authenticated", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("projects_select_member_unarchived", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("projects_update_unarchive_admin", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("projects_update_for_members", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("projects_delivery_method_check", sql`(delivery_method IS NULL) OR (delivery_method = ANY (ARRAY['Design-Bid-Build'::text, 'Design-Build'::text, 'Construction Management at Risk'::text, 'Integrated Project Delivery'::text]))`),
	check("projects_health_status_check", sql`health_status = ANY (ARRAY['Healthy'::text, 'At Risk'::text, 'Needs Attention'::text, 'Critical'::text])`),
	check("projects_project_sector_check", sql`(project_sector IS NULL) OR (project_sector = ANY (ARRAY['Commercial'::text, 'Industrial'::text, 'Infrastructure'::text, 'Healthcare'::text, 'Institutional'::text, 'Residential'::text]))`),
	check("projects_work_scope_check", sql`(work_scope IS NULL) OR (work_scope = ANY (ARRAY['Ground-Up Construction'::text, 'Renovation'::text, 'Tenant Improvement'::text, 'Interior Build-Out'::text, 'Maintenance'::text]))`),
]);

export const fmSprinklerConfigs = pgTable("fm_sprinkler_configs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tableId: text("table_id").notNull(),
	ceilingHeightFt: numeric("ceiling_height_ft").notNull(),
	storageHeightFt: numeric("storage_height_ft"),
	aisleWidthFt: numeric("aisle_width_ft"),
	sprinklerCount: integer("sprinkler_count"),
	kFactor: numeric("k_factor"),
	kFactorType: text("k_factor_type"),
	pressurePsi: numeric("pressure_psi"),
	pressureBar: numeric("pressure_bar"),
	orientation: text(),
	responseType: text("response_type"),
	temperatureRating: integer("temperature_rating"),
	designAreaSqft: numeric("design_area_sqft"),
	spacingFt: numeric("spacing_ft"),
	coverageType: text("coverage_type"),
	specialConditions: text("special_conditions").array(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sprinkler_configs_height").using("btree", table.ceilingHeightFt.asc().nullsLast().op("numeric_ops")),
	index("idx_sprinkler_configs_kfactor").using("btree", table.kFactor.asc().nullsLast().op("numeric_ops")),
	index("idx_sprinkler_configs_lookup").using("btree", table.tableId.asc().nullsLast().op("text_ops"), table.ceilingHeightFt.asc().nullsLast().op("numeric_ops"), table.kFactor.asc().nullsLast().op("numeric_ops")),
	index("idx_sprinkler_configs_table").using("btree", table.tableId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tableId],
			foreignColumns: [fmGlobalTables.tableId],
			name: "fm_sprinkler_configs_table_id_fkey"
		}),
]);

export const fmCostFactors = pgTable("fm_cost_factors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	componentType: text("component_type").notNull(),
	factorName: text("factor_name").notNull(),
	baseCostPerUnit: numeric("base_cost_per_unit"),
	unitType: text("unit_type"),
	complexityMultiplier: numeric("complexity_multiplier").default('1.0'),
	regionAdjustments: jsonb("region_adjustments").default({}),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
});

export const fmOptimizationRules = pgTable("fm_optimization_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ruleName: text("rule_name").notNull(),
	description: text(),
	triggerConditions: jsonb("trigger_conditions"),
	suggestedChanges: jsonb("suggested_changes"),
	estimatedSavingsMin: numeric("estimated_savings_min"),
	estimatedSavingsMax: numeric("estimated_savings_max"),
	implementationDifficulty: text("implementation_difficulty"),
	isActive: boolean("is_active").default(true),
	priorityLevel: integer("priority_level").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const parts = pgTable("parts", {
	id: varchar().primaryKey().notNull(),
	messageId: varchar().notNull(),
	type: varchar().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	order: integer().default(0).notNull(),
	textText: text("text_text"),
	reasoningText: text("reasoning_text"),
	fileMediaType: varchar("file_mediaType"),
	fileFilename: varchar("file_filename"),
	fileUrl: varchar("file_url"),
	sourceUrlSourceId: varchar("source_url_sourceId"),
	sourceUrlUrl: varchar("source_url_url"),
	sourceUrlTitle: varchar("source_url_title"),
	sourceDocumentSourceId: varchar("source_document_sourceId"),
	sourceDocumentMediaType: varchar("source_document_mediaType"),
	sourceDocumentTitle: varchar("source_document_title"),
	sourceDocumentFilename: varchar("source_document_filename"),
	toolToolCallId: varchar("tool_toolCallId"),
	toolState: varchar("tool_state"),
	toolErrorText: varchar("tool_errorText"),
	toolGetWeatherInformationInput: jsonb("tool_getWeatherInformation_input"),
	toolGetWeatherInformationOutput: jsonb("tool_getWeatherInformation_output"),
	toolGetLocationInput: jsonb("tool_getLocation_input"),
	toolGetLocationOutput: jsonb("tool_getLocation_output"),
	dataWeatherId: varchar("data_weather_id"),
	dataWeatherLocation: varchar("data_weather_location"),
	dataWeatherWeather: varchar("data_weather_weather"),
	dataWeatherTemperature: real("data_weather_temperature"),
	providerMetadata: jsonb(),
}, (table) => [
	index("parts_message_id_idx").using("btree", table.messageId.asc().nullsLast().op("text_ops")),
	index("parts_message_id_order_idx").using("btree", table.messageId.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int4_ops")),
	check("data_weather_fields_required", sql`CHECK (
CASE
    WHEN ((type)::text = 'data-weather'::text) THEN ((data_weather_location IS NOT NULL) AND (data_weather_weather IS NOT NULL) AND (data_weather_temperature IS NOT NULL))
    ELSE true
END)`),
	check("file_fields_required_if_type_is_file", sql`CHECK (
CASE
    WHEN ((type)::text = 'file'::text) THEN (("file_mediaType" IS NOT NULL) AND (file_url IS NOT NULL))
    ELSE true
END)`),
	check("reasoning_text_required_if_type_is_reasoning", sql`CHECK (
CASE
    WHEN ((type)::text = 'reasoning'::text) THEN (reasoning_text IS NOT NULL)
    ELSE true
END)`),
	check("source_document_fields_required_if_type_is_source_document", sql`CHECK (
CASE
    WHEN ((type)::text = 'source_document'::text) THEN (("source_document_sourceId" IS NOT NULL) AND ("source_document_mediaType" IS NOT NULL) AND (source_document_title IS NOT NULL))
    ELSE true
END)`),
	check("source_url_fields_required_if_type_is_source_url", sql`CHECK (
CASE
    WHEN ((type)::text = 'source_url'::text) THEN (("source_url_sourceId" IS NOT NULL) AND (source_url_url IS NOT NULL))
    ELSE true
END)`),
	check("text_text_required_if_type_is_text", sql`CHECK (
CASE
    WHEN ((type)::text = 'text'::text) THEN (text_text IS NOT NULL)
    ELSE true
END)`),
	check("tool_getLocation_fields_required", sql`CHECK (
CASE
    WHEN ((type)::text = 'tool-getLocation'::text) THEN (("tool_toolCallId" IS NOT NULL) AND (tool_state IS NOT NULL))
    ELSE true
END)`),
	check("tool_getWeatherInformation_fields_required", sql`CHECK (
CASE
    WHEN ((type)::text = 'tool-getWeatherInformation'::text) THEN (("tool_toolCallId" IS NOT NULL) AND (tool_state IS NOT NULL))
    ELSE true
END)`),
]);

export const asrsDecisionMatrix = pgTable("asrs_decision_matrix", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	asrsType: text("asrs_type").notNull(),
	containerType: text("container_type").notNull(),
	maxDepthFt: doublePrecision("max_depth_ft").notNull(),
	maxSpacingFt: doublePrecision("max_spacing_ft").notNull(),
	figureNumber: integer("figure_number").notNull(),
	sprinklerCount: integer("sprinkler_count").notNull(),
	sprinklerNumbering: text("sprinkler_numbering"),
	pageNumber: integer("page_number").notNull(),
	title: text(),
	requiresFlueSpaces: boolean("requires_flue_spaces").default(false),
	requiresVerticalBarriers: boolean("requires_vertical_barriers").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_asrs_lookup").using("btree", table.asrsType.asc().nullsLast().op("float8_ops"), table.containerType.asc().nullsLast().op("float8_ops"), table.maxDepthFt.asc().nullsLast().op("float8_ops"), table.maxSpacingFt.asc().nullsLast().op("float8_ops")),
	unique("asrs_decision_matrix_asrs_type_container_type_max_depth_ft__key").on(table.asrsType, table.containerType, table.maxDepthFt, table.maxSpacingFt),
]);

export const asrsBlocks = pgTable("asrs_blocks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionId: uuid("section_id").notNull(),
	ordinal: integer().notNull(),
	blockType: text("block_type").notNull(),
	sourceText: text("source_text"),
	html: text(),
	meta: jsonb().default({}),
}, (table) => [
	index("asrs_blocks_meta_gin").using("gin", table.meta.asc().nullsLast().op("jsonb_ops")),
	index("asrs_blocks_section_idx").using("btree", table.sectionId.asc().nullsLast().op("uuid_ops")),
	index("block_embeddings_source_text_fts").using("gin", sql`to_tsvector('english'::regconfig, source_text)`),
	index("idx_asrs_blocks_section").using("btree", table.sectionId.asc().nullsLast().op("int4_ops"), table.ordinal.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [asrsSections.id],
			name: "asrs_blocks_section_id_fkey"
		}),
	check("asrs_blocks_block_type_check", sql`block_type = ANY (ARRAY['paragraph'::text, 'note'::text, 'table'::text, 'figure'::text, 'equation'::text, 'heading'::text])`),
]);

export const commitmentChangeOrderLines = pgTable("commitment_change_order_lines", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	commitmentChangeOrderId: uuid("commitment_change_order_id").notNull(),
	budgetLineId: uuid("budget_line_id"),
	costCodeId: text("cost_code_id"),
	costTypeId: uuid("cost_type_id"),
	description: text(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_commitment_co_lines_budget_line").using("btree", table.budgetLineId.asc().nullsLast().op("uuid_ops")),
	index("idx_commitment_co_lines_co").using("btree", table.commitmentChangeOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.budgetLineId],
			foreignColumns: [budgetLines.id],
			name: "commitment_change_order_lines_budget_line_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.commitmentChangeOrderId],
			foreignColumns: [commitmentChangeOrders.id],
			name: "commitment_change_order_lines_commitment_change_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "commitment_change_order_lines_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "commitment_change_order_lines_cost_type_id_fkey"
		}),
	pgPolicy("Users can view commitment change order lines", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
]);

export const commitmentChangeOrders = pgTable("commitment_change_orders", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	commitmentId: uuid("commitment_id").notNull(),
	changeOrderNumber: text("change_order_number").notNull(),
	description: text().notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	requestedBy: uuid("requested_by"),
	requestedDate: date("requested_date").default(sql`CURRENT_DATE`).notNull(),
	approvedBy: uuid("approved_by"),
	approvedDate: date("approved_date"),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_commitment_cos_commitment").using("btree", table.commitmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_commitment_cos_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "commitment_change_orders_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.commitmentId],
			foreignColumns: [commitments.id],
			name: "commitment_change_orders_commitment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [users.id],
			name: "commitment_change_orders_requested_by_fkey"
		}),
	unique("commitment_change_orders_commitment_id_change_order_number_key").on(table.commitmentId, table.changeOrderNumber),
	pgPolicy("Users can view commitment change orders", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (commitments c
     JOIN project_members pm ON ((pm.project_id = c.project_id)))
  WHERE ((c.id = commitment_change_orders.commitment_id) AND (pm.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create commitment change orders", { as: "permissive", for: "insert", to: ["public"] }),
	check("commitment_change_orders_status_check", sql`status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'pending_review'::text, 'approved'::text, 'rejected'::text])`),
]);

export const qtoItems = pgTable("qto_items", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	qtoId: bigint("qto_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	costCode: text("cost_code"),
	division: text(),
	itemCode: text("item_code"),
	description: text(),
	unit: text(),
	quantity: numeric().default('0'),
	unitCost: numeric("unit_cost").default('0'),
	extendedCost: numeric("extended_cost").generatedAlwaysAs(sql`(quantity * unit_cost)`),
	sourceReference: text("source_reference"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_qto_items_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_qto_items_qto_id").using("btree", table.qtoId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "qto_items_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.qtoId],
			foreignColumns: [qtos.id],
			name: "qto_items_qto_id_fkey"
		}).onDelete("cascade"),
]);

export const changeOrders = pgTable("change_orders", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	coNumber: text("co_number"),
	title: text(),
	description: text(),
	status: text().default('proposed'),
	submittedBy: uuid("submitted_by").default(sql`auth.uid()`),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	applyVerticalMarkup: boolean("apply_vertical_markup").default(true),
}, (table) => [
	index("idx_change_orders_co_number").using("btree", table.coNumber.asc().nullsLast().op("text_ops")),
	index("idx_change_orders_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "change_orders_project_id_fkey"
		}).onDelete("cascade"),
]);

export const qtos = pgTable("qtos", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	title: text(),
	version: integer().default(1),
	createdBy: uuid("created_by").default(sql`auth.uid()`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	notes: text(),
	status: text().default('draft'),
}, (table) => [
	index("idx_qtos_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "qtos_project_id_fkey"
		}).onDelete("cascade"),
]);

export const changeOrderCosts = pgTable("change_order_costs", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeOrderId: bigint("change_order_id", { mode: "number" }).notNull(),
	labor: numeric().default('0'),
	materials: numeric().default('0'),
	subcontractor: numeric().default('0'),
	overhead: numeric().default('0'),
	contingency: numeric().default('0'),
	totalCost: numeric("total_cost").generatedAlwaysAs(sql`((((labor + materials) + subcontractor) + overhead) + contingency)`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_co_costs_change_order_id").using("btree", table.changeOrderId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.changeOrderId],
			foreignColumns: [changeOrders.id],
			name: "change_order_costs_change_order_id_fkey"
		}).onDelete("cascade"),
]);

export const changeOrderApprovals = pgTable("change_order_approvals", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeOrderId: bigint("change_order_id", { mode: "number" }).notNull(),
	approver: uuid(),
	role: text(),
	decision: text(),
	comment: text(),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_co_approvals_co_id").using("btree", table.changeOrderId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.changeOrderId],
			foreignColumns: [changeOrders.id],
			name: "change_order_approvals_change_order_id_fkey"
		}).onDelete("cascade"),
]);

export const attachments = pgTable("attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	attachedToTable: text("attached_to_table"),
	attachedToId: text("attached_to_id"),
	fileName: text("file_name"),
	url: text(),
	uploadedBy: uuid("uploaded_by").default(sql`auth.uid()`),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_attachments_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "attachments_project_id_fkey"
		}).onDelete("cascade"),
]);

export const scheduleTasks = pgTable("schedule_tasks", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	scheduleId: bigint("schedule_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentTaskId: bigint("parent_task_id", { mode: "number" }),
	name: text().notNull(),
	description: text(),
	taskType: text("task_type"),
	sequence: integer().default(0),
	startDate: date("start_date"),
	finishDate: date("finish_date"),
	durationDays: integer("duration_days"),
	percentComplete: numeric("percent_complete", { precision: 5, scale:  2 }).default('0'),
	floatOrder: numeric("float_order").default('0'),
	predecessorIds: text("predecessor_ids"),
	createdBy: uuid("created_by").default(sql`auth.uid()`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_schedule_tasks_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_schedule_tasks_schedule_id").using("btree", table.scheduleId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "schedule_tasks_project_id_fkey"
		}).onDelete("cascade"),
]);

export const scheduleTaskDependencies = pgTable("schedule_task_dependencies", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	taskId: bigint("task_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	predecessorTaskId: bigint("predecessor_task_id", { mode: "number" }).notNull(),
	dependencyType: text("dependency_type").default('FS'),
}, (table) => [
	index("idx_task_deps_task_id").using("btree", table.taskId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.predecessorTaskId],
			foreignColumns: [scheduleTasks.id],
			name: "schedule_task_dependencies_predecessor_task_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [scheduleTasks.id],
			name: "schedule_task_dependencies_task_id_fkey"
		}).onDelete("cascade"),
]);

export const scheduleResources = pgTable("schedule_resources", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	taskId: bigint("task_id", { mode: "number" }).notNull(),
	resourceId: uuid("resource_id"),
	resourceType: text("resource_type"),
	role: text(),
	units: numeric(),
	unitType: text("unit_type"),
	rate: numeric(),
	cost: numeric().generatedAlwaysAs(sql`(units * rate)`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_schedule_resources_task_id").using("btree", table.taskId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [scheduleTasks.id],
			name: "schedule_resources_task_id_fkey"
		}).onDelete("cascade"),
]);

export const scheduleProgressUpdates = pgTable("schedule_progress_updates", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	taskId: bigint("task_id", { mode: "number" }).notNull(),
	reportedAt: timestamp("reported_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	percentComplete: numeric("percent_complete", { precision: 5, scale:  2 }),
	actualStart: date("actual_start"),
	actualFinish: date("actual_finish"),
	actualHours: numeric("actual_hours"),
	notes: text(),
	reportedBy: uuid("reported_by").default(sql`auth.uid()`),
}, (table) => [
	index("idx_schedule_progress_task_id").using("btree", table.taskId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [scheduleTasks.id],
			name: "schedule_progress_updates_task_id_fkey"
		}).onDelete("cascade"),
]);

export const prospects = pgTable("prospects", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	companyName: text("company_name").notNull(),
	contactName: text("contact_name"),
	contactTitle: text("contact_title"),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	leadSource: text("lead_source"),
	referralContact: text("referral_contact"),
	industry: text(),
	projectType: text("project_type"),
	estimatedProjectValue: numeric("estimated_project_value", { precision: 14, scale:  2 }),
	estimatedStartDate: date("estimated_start_date"),
	status: text().default('New'),
	probability: integer().default(0),
	nextFollowUp: date("next_follow_up"),
	lastContacted: timestamp("last_contacted", { withTimezone: true, mode: 'string' }),
	assignedTo: text("assigned_to"),
	notes: text(),
	tags: text().array(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	aiSummary: text("ai_summary"),
	aiScore: numeric("ai_score", { precision: 5, scale:  2 }),
	metadata: jsonb().default({}),
}, (table) => [
	index("idx_prospects_assigned_to").using("btree", table.assignedTo.asc().nullsLast().op("text_ops")),
	index("idx_prospects_industry").using("btree", table.industry.asc().nullsLast().op("text_ops")),
	index("idx_prospects_next_follow_up").using("btree", table.nextFollowUp.asc().nullsLast().op("date_ops")),
	index("idx_prospects_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "prospects_client_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "prospects_project_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	check("prospects_probability_check", sql`(probability >= 0) AND (probability <= 100)`),
]);

export const decisions = pgTable("decisions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	metadataId: text("metadata_id").notNull(),
	segmentId: uuid("segment_id"),
	sourceChunkId: uuid("source_chunk_id"),
	description: text().notNull(),
	rationale: text(),
	ownerName: text("owner_name"),
	ownerEmail: text("owner_email"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	effectiveDate: date("effective_date"),
	impact: text(),
	status: text().default('active').notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	projectIds: integer("project_ids").array().default([]),
}, (table) => [
	index("decisions_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({m: "16",ef_construction: "64"}),
	index("decisions_project_ids_gin_idx").using("gin", table.projectIds.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.metadataId],
			foreignColumns: [documentMetadata.id],
			name: "decisions_metadata_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.segmentId],
			foreignColumns: [meetingSegments.id],
			name: "decisions_segment_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sourceChunkId],
			foreignColumns: [documents.id],
			name: "decisions_source_chunk_id_fkey"
		}).onDelete("set null"),
	unique("decisions_metadata_id_description_key").on(table.metadataId, table.description),
	check("decisions_status_check", sql`status = ANY (ARRAY['active'::text, 'superseded'::text, 'reversed'::text])`),
]);

export const opportunities = pgTable("opportunities", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	metadataId: text("metadata_id").notNull(),
	segmentId: uuid("segment_id"),
	sourceChunkId: uuid("source_chunk_id"),
	description: text().notNull(),
	type: text(),
	ownerName: text("owner_name"),
	ownerEmail: text("owner_email"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	nextStep: text("next_step"),
	status: text().default('open').notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	projectIds: integer("project_ids").array().default([]),
}, (table) => [
	index("opportunities_client_idx").using("btree", table.clientId.asc().nullsLast().op("int8_ops")),
	index("opportunities_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "50"}),
	index("opportunities_metadata_idx").using("btree", table.metadataId.asc().nullsLast().op("text_ops")),
	index("opportunities_project_ids_gin_idx").using("gin", table.projectIds.asc().nullsLast().op("array_ops")),
	index("opportunities_project_idx").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("opportunities_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("opportunities_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.metadataId],
			foreignColumns: [documentMetadata.id],
			name: "opportunities_metadata_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.segmentId],
			foreignColumns: [meetingSegments.id],
			name: "opportunities_segment_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sourceChunkId],
			foreignColumns: [documents.id],
			name: "opportunities_source_chunk_id_fkey"
		}).onDelete("set null"),
	unique("opportunities_metadata_id_description_key").on(table.metadataId, table.description),
	check("opportunities_status_check", sql`status = ANY (ARRAY['open'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'implemented'::text])`),
]);

export const procoreScreenshots = pgTable("procore_screenshots", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id"),
	name: text().notNull(),
	category: text().notNull(),
	subcategory: text(),
	sourceUrl: text("source_url"),
	pageTitle: text("page_title"),
	fullpagePath: text("fullpage_path"),
	viewportPath: text("viewport_path"),
	fullpageStoragePath: text("fullpage_storage_path"),
	viewportStoragePath: text("viewport_storage_path"),
	viewportWidth: integer("viewport_width"),
	viewportHeight: integer("viewport_height"),
	fullpageHeight: integer("fullpage_height"),
	fileSizeBytes: integer("file_size_bytes"),
	description: text(),
	detectedComponents: jsonb("detected_components").default([]),
	colorPalette: jsonb("color_palette").default([]),
	aiAnalysis: jsonb("ai_analysis"),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	newUrl: text("new_url"),
}, (table) => [
	index("idx_screenshots_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_screenshots_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_screenshots_session").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [procoreCaptureSessions.id],
			name: "procore_screenshots_session_id_fkey"
		}).onDelete("cascade"),
]);

export const firefliesIngestionJobs = pgTable("fireflies_ingestion_jobs", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	firefliesId: text("fireflies_id").notNull(),
	metadataId: text("metadata_id"),
	stage: text().default('pending').notNull(),
	attemptCount: integer("attempt_count").default(0).notNull(),
	lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true, mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fireflies_ingestion_jobs_metadata_idx").using("btree", table.metadataId.asc().nullsLast().op("text_ops")),
	index("fireflies_ingestion_jobs_stage_idx").using("btree", table.stage.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.metadataId],
			foreignColumns: [documentMetadata.id],
			name: "fireflies_ingestion_jobs_metadata_id_fkey"
		}).onDelete("set null"),
	unique("fireflies_ingestion_jobs_fireflies_id_key").on(table.firefliesId),
	check("fireflies_ingestion_jobs_stage_check", sql`stage = ANY (ARRAY['pending'::text, 'raw_ingested'::text, 'segmented'::text, 'chunked'::text, 'embedded'::text, 'structured_extracted'::text, 'done'::text, 'error'::text])`),
]);

export const project = pgTable("project", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).generatedByDefaultAsIdentity({ name: "project_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text(),
	jobNumber: text("job_number"),
	startDate: date("start_date"),
	estCompletion: date("est_completion"),
	estRevenue: numeric("est_revenue"),
	estProfit: numeric("est_profit"),
	address: text(),
	onedrive: text(),
	phase: text(),
	state: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	category: text(),
	teamMembers: text("team_members").array().default([""]),
	completionPercentage: integer("completion_percentage").default(0),
	budget: numeric({ precision: 12, scale:  2 }),
	budgetUsed: numeric("budget_used", { precision: 12, scale:  2 }).default('0'),
	client: text(),
	summary: text(),
	summaryMetadata: jsonb("summary_metadata").default({}),
	summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true, mode: 'string' }),
	healthScore: numeric("health_score", { precision: 5, scale:  2 }),
	healthStatus: text("health_status"),
	access: text(),
	archived: boolean().default(false).notNull(),
	archivedBy: uuid("archived_by"),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	erpSystem: text("erp_system"),
	erpLastJobCostSync: timestamp("erp_last_job_cost_sync", { withTimezone: true, mode: 'string' }),
	erpLastDirectCostSync: timestamp("erp_last_direct_cost_sync", { withTimezone: true, mode: 'string' }),
	erpSyncStatus: text("erp_sync_status"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectManager: bigint("project_manager", { mode: "number" }),
	type: text(),
	projectNumber: varchar("project_number", { length: 50 }),
	stakeholders: jsonb().default([]),
	keywords: text().array(),
	budgetLocked: boolean("budget_locked").default(false),
	budgetLockedAt: timestamp("budget_locked_at", { withTimezone: true, mode: 'string' }),
	budgetLockedBy: uuid("budget_locked_by"),
	workScope: text("work_scope"),
	projectSector: text("project_sector"),
	deliveryMethod: text("delivery_method"),
	nameCode: text("name_code"),
}, (table) => [
	foreignKey({
			columns: [table.budgetLockedBy],
			foreignColumns: [appUsers.id],
			name: "projects_budget_locked_by_fkey"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "projects_client_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.projectManager],
			foreignColumns: [employees.id],
			name: "projects_project_manager_fkey"
		}).onDelete("set null"),
	check("projects_delivery_method_check", sql`(delivery_method IS NULL) OR (delivery_method = ANY (ARRAY['Design-Bid-Build'::text, 'Design-Build'::text, 'Construction Management at Risk'::text, 'Integrated Project Delivery'::text]))`),
	check("projects_health_status_check", sql`health_status = ANY (ARRAY['Healthy'::text, 'At Risk'::text, 'Needs Attention'::text, 'Critical'::text])`),
	check("projects_project_sector_check", sql`(project_sector IS NULL) OR (project_sector = ANY (ARRAY['Commercial'::text, 'Industrial'::text, 'Infrastructure'::text, 'Healthcare'::text, 'Institutional'::text, 'Residential'::text]))`),
	check("projects_work_scope_check", sql`(work_scope IS NULL) OR (work_scope = ANY (ARRAY['Ground-Up Construction'::text, 'Renovation'::text, 'Tenant Improvement'::text, 'Interior Build-Out'::text, 'Maintenance'::text]))`),
]);

export const groups = pgTable("groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "groups_created_by_fkey"
		}),
]);

export const procoreCaptureSessions = pgTable("procore_capture_sessions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	captureType: text("capture_type").notNull(),
	status: text().default('in_progress').notNull(),
	totalScreenshots: integer("total_screenshots").default(0),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("procore_capture_sessions_capture_type_check", sql`capture_type = ANY (ARRAY['public_docs'::text, 'authenticated_app'::text, 'manual'::text])`),
	check("procore_capture_sessions_status_check", sql`status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'failed'::text])`),
]);

export const procoreComponents = pgTable("procore_components", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	screenshotId: uuid("screenshot_id"),
	componentType: text("component_type").notNull(),
	componentName: text("component_name"),
	x: integer(),
	y: integer(),
	width: integer(),
	height: integer(),
	localPath: text("local_path"),
	storagePath: text("storage_path"),
	styles: jsonb(),
	content: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_components_screenshot").using("btree", table.screenshotId.asc().nullsLast().op("uuid_ops")),
	index("idx_components_type").using("btree", table.componentType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.screenshotId],
			foreignColumns: [procoreScreenshots.id],
			name: "procore_components_screenshot_id_fkey"
		}).onDelete("cascade"),
]);

export const crawledPages = pgTable("crawled_pages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	url: varchar().notNull(),
	chunkNumber: integer("chunk_number").notNull(),
	content: text().notNull(),
	metadata: jsonb().default({}).notNull(),
	sourceId: text("source_id").notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("crawled_pages_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	index("idx_crawled_pages_metadata").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
	index("idx_crawled_pages_source_id").using("btree", table.sourceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.sourceId],
			name: "crawled_pages_source_id_fkey"
		}),
	unique("crawled_pages_url_chunk_number_key").on(table.url, table.chunkNumber),
	pgPolicy("Allow public read access to crawled_pages", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const sources = pgTable("sources", {
	sourceId: text("source_id").primaryKey().notNull(),
	summary: text(),
	totalWordCount: integer("total_word_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Allow public read access to sources", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const procoreModules = pgTable("procore_modules", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
	displayName: text("display_name").notNull(),
	category: text().notNull(),
	appPath: text("app_path"),
	docsUrl: text("docs_url"),
	complexity: text(),
	priority: text(),
	estimatedBuildWeeks: integer("estimated_build_weeks"),
	keyFeatures: jsonb("key_features").default([]),
	dependencies: jsonb().default([]),
	notes: text(),
	rebuildNotes: text("rebuild_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_modules_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	unique("procore_modules_name_key").on(table.name),
	check("procore_modules_complexity_check", sql`complexity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'very_high'::text])`),
	check("procore_modules_priority_check", sql`priority = ANY (ARRAY['must_have'::text, 'nice_to_have'::text, 'skip'::text])`),
]);

export const procoreFeatures = pgTable("procore_features", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	moduleId: uuid("module_id"),
	name: text().notNull(),
	description: text(),
	includeInRebuild: boolean("include_in_rebuild").default(true),
	complexity: text(),
	estimatedHours: integer("estimated_hours"),
	aiEnhancementPossible: boolean("ai_enhancement_possible").default(false),
	aiEnhancementNotes: text("ai_enhancement_notes"),
	screenshotIds: uuid("screenshot_ids").array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_features_module").using("btree", table.moduleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [procoreModules.id],
			name: "procore_features_module_id_fkey"
		}).onDelete("cascade"),
	check("procore_features_complexity_check", sql`complexity = ANY (ARRAY['trivial'::text, 'easy'::text, 'medium'::text, 'hard'::text, 'very_hard'::text])`),
]);

export const projectsAudit = pgTable("projects_audit", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	operation: text().notNull(),
	changedBy: uuid("changed_by"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	changedColumns: text("changed_columns").array(),
	oldData: jsonb("old_data"),
	newData: jsonb("new_data"),
	metadata: jsonb(),
});

export const directCosts = pgTable("direct_costs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	budgetItemId: uuid("budget_item_id").notNull(),
	vendorId: uuid("vendor_id"),
	description: text(),
	costType: text("cost_type"),
	amount: numeric({ precision: 14, scale:  2 }).notNull(),
	incurredDate: date("incurred_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_direct_costs_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "direct_costs_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view direct costs in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = direct_costs.project_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create direct costs", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const commitmentChanges = pgTable("commitment_changes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	commitmentId: uuid("commitment_id").notNull(),
	budgetItemId: uuid("budget_item_id").notNull(),
	amount: numeric({ precision: 14, scale:  2 }).notNull(),
	status: text(),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.commitmentId],
			foreignColumns: [commitments.id],
			name: "commitment_changes_commitment_id_fkey"
		}).onDelete("cascade"),
	check("commitment_changes_status_check", sql`status = ANY (ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'void'::text])`),
]);

export const codeExamples = pgTable("code_examples", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	url: varchar().notNull(),
	chunkNumber: integer("chunk_number").notNull(),
	content: text().notNull(),
	summary: text().notNull(),
	metadata: jsonb().default({}).notNull(),
	sourceId: text("source_id").notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("code_examples_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	index("idx_code_examples_metadata").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
	index("idx_code_examples_source_id").using("btree", table.sourceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.sourceId],
			name: "code_examples_source_id_fkey"
		}),
	unique("code_examples_url_chunk_number_key").on(table.url, table.chunkNumber),
	pgPolicy("Allow public read access to code_examples", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const forecasting = pgTable("forecasting", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	budgetItemId: uuid("budget_item_id").notNull(),
	forecastToComplete: numeric("forecast_to_complete", { precision: 14, scale:  2 }),
	projectedCosts: numeric("projected_costs", { precision: 14, scale:  2 }),
	estimatedCompletionCost: numeric("estimated_completion_cost", { precision: 14, scale:  2 }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const erpSyncLog = pgTable("erp_sync_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	erpSystem: text("erp_system"),
	lastJobCostSync: timestamp("last_job_cost_sync", { withTimezone: true, mode: 'string' }),
	lastDirectCostSync: timestamp("last_direct_cost_sync", { withTimezone: true, mode: 'string' }),
	syncStatus: text("sync_status"),
	payload: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "erp_sync_log_project_id_fkey"
		}).onDelete("cascade"),
]);

export const primeContractSovs = pgTable("prime_contract_sovs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "prime_contract_sovs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }).notNull(),
	costCode: text("cost_code"),
	description: text(),
	quantity: numeric({ precision: 14, scale:  2 }).default('1'),
	uom: text(),
	unitCost: numeric("unit_cost", { precision: 14, scale:  2 }).default('0'),
	lineAmount: numeric("line_amount", { precision: 14, scale:  2 }).generatedAlwaysAs(sql`(quantity * unit_cost)`),
	sortOrder: integer("sort_order").default(0),
}, (table) => [
	index("idx_prime_contract_sovs_contract").using("btree", table.contractId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "prime_contract_sovs_contract_id_fkey"
		}).onDelete("cascade"),
]);

export const primePotentialChangeOrders = pgTable("prime_potential_change_orders", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "prime_potential_change_orders_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeEventId: bigint("change_event_id", { mode: "number" }),
	pcoNumber: text("pco_number"),
	title: text().notNull(),
	status: text(),
	reason: text(),
	scope: text(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
}, (table) => [
	index("idx_pcos_change_event").using("btree", table.changeEventId.asc().nullsLast().op("int8_ops")),
	index("idx_pcos_contract").using("btree", table.contractId.asc().nullsLast().op("int8_ops")),
	index("idx_pcos_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.changeEventId],
			foreignColumns: [changeEvents.id],
			name: "prime_potential_change_orders_change_event_id_fkey"
		}),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "prime_potential_change_orders_contract_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "prime_potential_change_orders_project_id_fkey"
		}).onDelete("cascade"),
]);

export const changeEventLineItems = pgTable("change_event_line_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "change_event_line_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeEventId: bigint("change_event_id", { mode: "number" }).notNull(),
	costCode: text("cost_code"),
	description: text(),
	quantity: numeric({ precision: 14, scale:  2 }),
	uom: text(),
	unitCost: numeric("unit_cost", { precision: 14, scale:  2 }),
	romAmount: numeric("rom_amount", { precision: 14, scale:  2 }),
	finalAmount: numeric("final_amount", { precision: 14, scale:  2 }),
}, (table) => [
	index("idx_change_event_line_items_event").using("btree", table.changeEventId.asc().nullsLast().op("int8_ops")),
	index("idx_change_event_lines_event").using("btree", table.changeEventId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.changeEventId],
			foreignColumns: [changeEvents.id],
			name: "change_event_line_items_change_event_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view change event line items", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (change_events ce
     JOIN project_members pm ON ((pm.project_id = ce.project_id)))
  WHERE ((ce.id = change_event_line_items.change_event_id) AND (pm.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create change event line items", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const changeEvents = pgTable("change_events", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "change_events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	eventNumber: text("event_number"),
	title: text().notNull(),
	reason: text(),
	scope: text(),
	status: text(),
	notes: text(),
}, (table) => [
	index("idx_change_events_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_change_events_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "change_events_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view change events in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = change_events.project_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create change events", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const pcoLineItems = pgTable("pco_line_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "pco_line_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pcoId: bigint("pco_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeEventLineItemId: bigint("change_event_line_item_id", { mode: "number" }),
	costCode: text("cost_code"),
	description: text(),
	quantity: numeric({ precision: 14, scale:  2 }),
	uom: text(),
	unitCost: numeric("unit_cost", { precision: 14, scale:  2 }),
	lineAmount: numeric("line_amount", { precision: 14, scale:  2 }).generatedAlwaysAs(sql`(quantity * unit_cost)`),
}, (table) => [
	index("idx_pco_line_items_pco").using("btree", table.pcoId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.changeEventLineItemId],
			foreignColumns: [changeEventLineItems.id],
			name: "pco_line_items_change_event_line_item_id_fkey"
		}),
	foreignKey({
			columns: [table.pcoId],
			foreignColumns: [primePotentialChangeOrders.id],
			name: "pco_line_items_pco_id_fkey"
		}).onDelete("cascade"),
]);

export const primeContractChangeOrders = pgTable("prime_contract_change_orders", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "prime_contract_change_orders_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }).notNull(),
	pccoNumber: text("pcco_number"),
	title: text().notNull(),
	status: text(),
	executed: boolean().default(false),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	totalAmount: numeric("total_amount", { precision: 14, scale:  2 }),
}, (table) => [
	index("idx_pccos_contract").using("btree", table.contractId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "prime_contract_change_orders_contract_id_fkey"
		}).onDelete("cascade"),
]);

export const pccoLineItems = pgTable("pcco_line_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "pcco_line_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pccoId: bigint("pcco_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pcoId: bigint("pco_id", { mode: "number" }),
	costCode: text("cost_code"),
	description: text(),
	quantity: numeric({ precision: 14, scale:  2 }),
	uom: text(),
	unitCost: numeric("unit_cost", { precision: 14, scale:  2 }),
	lineAmount: numeric("line_amount", { precision: 14, scale:  2 }).generatedAlwaysAs(sql`(quantity * unit_cost)`),
}, (table) => [
	index("idx_pcco_line_items_pcco").using("btree", table.pccoId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.pccoId],
			foreignColumns: [primeContractChangeOrders.id],
			name: "pcco_line_items_pcco_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pcoId],
			foreignColumns: [primePotentialChangeOrders.id],
			name: "pcco_line_items_pco_id_fkey"
		}),
]);

export const costCodeDivisionUpdatesAudit = pgTable("cost_code_division_updates_audit", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	divisionId: uuid("division_id").notNull(),
	newTitle: text("new_title"),
	updatedCount: integer("updated_count"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	changedBy: text("changed_by"),
});

export const ownerInvoiceLineItems = pgTable("owner_invoice_line_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "owner_invoice_line_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	invoiceId: bigint("invoice_id", { mode: "number" }).notNull(),
	description: text(),
	category: text(),
	approvedAmount: numeric("approved_amount", { precision: 14, scale:  2 }),
}, (table) => [
	index("idx_owner_invoice_line_items_invoice").using("btree", table.invoiceId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [ownerInvoices.id],
			name: "owner_invoice_line_items_invoice_id_fkey"
		}).onDelete("cascade"),
]);

export const ownerInvoices = pgTable("owner_invoices", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "owner_invoices_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }).notNull(),
	invoiceNumber: text("invoice_number"),
	periodStart: date("period_start"),
	periodEnd: date("period_end"),
	status: text(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	billingPeriodId: uuid("billing_period_id"),
}, (table) => [
	index("idx_owner_invoices_contract").using("btree", table.contractId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.billingPeriodId],
			foreignColumns: [billingPeriods.id],
			name: "owner_invoices_billing_period_id_fkey"
		}),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "owner_invoices_contract_id_fkey"
		}).onDelete("cascade"),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "payment_transactions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	invoiceId: bigint("invoice_id", { mode: "number" }),
	paymentDate: date("payment_date").notNull(),
	amount: numeric({ precision: 14, scale:  2 }).notNull(),
	method: text(),
	referenceNumber: text("reference_number"),
}, (table) => [
	index("idx_payments_contract").using("btree", table.contractId.asc().nullsLast().op("int8_ops")),
	index("idx_payments_invoice").using("btree", table.invoiceId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "payment_transactions_contract_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [ownerInvoices.id],
			name: "payment_transactions_invoice_id_fkey"
		}),
]);

export const ragPipelineState = pgTable("rag_pipeline_state", {
	pipelineId: text("pipeline_id").primaryKey().notNull(),
	pipelineType: text("pipeline_type").notNull(),
	lastCheckTime: timestamp("last_check_time", { mode: 'string' }),
	knownFiles: jsonb("known_files"),
	lastRun: timestamp("last_run", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_rag_pipeline_state_last_run").using("btree", table.lastRun.asc().nullsLast().op("timestamp_ops")),
	index("idx_rag_pipeline_state_pipeline_type").using("btree", table.pipelineType.asc().nullsLast().op("text_ops")),
]);

export const conversations = pgTable("conversations", {
	sessionId: varchar("session_id").primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastMessageAt: timestamp("last_message_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isArchived: boolean("is_archived").default(false),
	metadata: jsonb().default({}),
}, (table) => [
	index("idx_conversations_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userProfiles.id],
			name: "conversations_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Admins can update all conversations", { as: "permissive", for: "update", to: ["public"], using: sql`is_admin()` }),
	pgPolicy("Admins can insert conversations", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Deny delete for conversations", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Users can view their own conversations", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can insert their own conversations", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update their own conversations", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can view all conversations", { as: "permissive", for: "select", to: ["public"] }),
]);

export const messages = pgTable("messages", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "messages_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	computedSessionUserId: uuid("computed_session_user_id").generatedAlwaysAs(sql`(split_part((session_id)::text, '~'::text, 1))::uuid`),
	sessionId: varchar("session_id").notNull(),
	message: jsonb().notNull(),
	messageData: text("message_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_messages_computed_session").using("btree", table.computedSessionUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_messages_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [conversations.sessionId],
			name: "messages_session_id_fkey"
		}),
	pgPolicy("Users can view their own messages", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = computed_session_user_id)` }),
	pgPolicy("Users can insert messages in their conversations", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can view all messages", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can insert messages", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Deny delete for messages", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const documentMetadata = pgTable("document_metadata", {
	id: text().primaryKey().notNull(),
	title: text(),
	url: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	type: text(),
	source: text(),
	content: text(),
	summary: text(),
	participants: text(),
	tags: text(),
	category: text(),
	firefliesId: text("fireflies_id"),
	firefliesLink: text("fireflies_link"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	project: text(),
	date: timestamp({ withTimezone: true, mode: 'string' }),
	durationMinutes: integer("duration_minutes"),
	bulletPoints: text("bullet_points"),
	actionItems: text("action_items"),
	fileId: integer("file_id"),
	overview: text(),
	description: text(),
	status: text(),
	accessLevel: text("access_level").default('team'),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }),
	contentHash: text("content_hash"),
	participantsArray: text("participants_array").array(),
	phase: text().default('Current').notNull(),
	audio: text(),
	video: text(),
}, (table) => [
	index("idx_document_metadata_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_document_metadata_composite").using("btree", table.type.asc().nullsLast().op("text_ops"), table.category.asc().nullsLast().op("text_ops"), table.date.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_document_metadata_content_fts").using("gin", sql`to_tsvector('english'::regconfig, content)`),
	index("idx_document_metadata_date").using("btree", table.date.asc().nullsLast().op("timestamptz_ops")),
	index("idx_document_metadata_fireflies_id").using("btree", table.firefliesId.asc().nullsLast().op("text_ops")),
	index("idx_document_metadata_lower_title").using("btree", sql`lower(title)`),
	index("idx_document_metadata_participants").using("gin", sql`to_tsvector('english'::regconfig, participants)`),
	index("idx_document_metadata_project_captured").using("btree", table.projectId.asc().nullsLast().op("timestamptz_ops"), table.capturedAt.asc().nullsLast().op("int8_ops")),
	index("idx_document_metadata_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_table_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	uniqueIndex("ux_document_metadata_content_hash").using("btree", table.contentHash.asc().nullsLast().op("text_ops")),
	uniqueIndex("ux_document_metadata_fireflies").using("btree", table.firefliesId.asc().nullsLast().op("text_ops")).where(sql`(fireflies_id IS NOT NULL)`),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "document_metadata_project_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("document_metadata_fireflies_id_unique").on(table.firefliesId),
	unique("document_metadata_file_id_key").on(table.fileId),
	pgPolicy("zapier_access_policy", { as: "permissive", for: "all", to: ["zapier"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("zapier_full_access", { as: "permissive", for: "all", to: ["zapier"] }),
	pgPolicy("team_update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("admin_all_access", { as: "permissive", for: "all", to: ["authenticated"] }),
	pgPolicy("leadership_update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("leadership_access", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("leadership_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("leadership_delete", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("team_access", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("team_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("users_can_read_docs", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const documentRows = pgTable("document_rows", {
	id: serial().primaryKey().notNull(),
	datasetId: text("dataset_id"),
	rowData: jsonb("row_data"),
}, (table) => [
	foreignKey({
			columns: [table.datasetId],
			foreignColumns: [documentMetadata.id],
			name: "document_rows_dataset_id_fkey"
		}),
]);

export const projectInsights = pgTable("project_insights", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	summary: text().notNull(),
	detail: jsonb().default({}).notNull(),
	severity: text(),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sourceDocumentIds: text("source_document_ids").array().default(["RAY"]),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_project_insights_project_captured").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.capturedAt.desc().nullsFirst().op("int4_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_insights_project_id_fkey"
		}).onDelete("cascade"),
]);

export const chatThreads = pgTable("chat_threads", {
	id: text().primaryKey().notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_chat_threads_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const chatThreadItems = pgTable("chat_thread_items", {
	id: text().primaryKey().notNull(),
	threadId: text("thread_id").notNull(),
	itemType: text("item_type").notNull(),
	payload: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_chat_thread_items_thread_created").using("btree", table.threadId.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [chatThreads.id],
			name: "chat_thread_items_thread_id_fkey"
		}).onDelete("cascade"),
]);

export const chatThreadAttachments = pgTable("chat_thread_attachments", {
	id: text().primaryKey().notNull(),
	threadId: text("thread_id"),
	filename: text(),
	mimeType: text("mime_type"),
	payload: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [chatThreads.id],
			name: "chat_thread_attachments_thread_id_fkey"
		}).onDelete("cascade"),
]);

export const chatThreadFeedback = pgTable("chat_thread_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: text("thread_id").notNull(),
	itemIds: text("item_ids").array().notNull(),
	feedback: text().notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [chatThreads.id],
			name: "chat_thread_feedback_thread_id_fkey"
		}).onDelete("cascade"),
]);

export const chatThreadAttachmentFiles = pgTable("chat_thread_attachment_files", {
	attachmentId: text("attachment_id").primaryKey().notNull(),
	storagePath: text("storage_path").notNull(),
	threadId: text("thread_id"),
	filename: text(),
	mimeType: text("mime_type"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeBytes: bigint("size_bytes", { mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.attachmentId],
			foreignColumns: [chatThreadAttachments.id],
			name: "chat_thread_attachment_files_attachment_id_fkey"
		}).onDelete("cascade"),
]);

export const rfis = pgTable("rfis", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	number: integer().notNull(),
	subject: text().notNull(),
	question: text().notNull(),
	status: text().default('Open').notNull(),
	dueDate: date("due_date"),
	dateInitiated: date("date_initiated"),
	closedDate: date("closed_date"),
	rfiManager: text("rfi_manager"),
	receivedFrom: text("received_from"),
	assignees: text().array(),
	distributionList: text("distribution_list").array(),
	ballInCourt: text("ball_in_court"),
	responsibleContractor: text("responsible_contractor"),
	specification: text(),
	location: text(),
	subJob: text("sub_job"),
	costCode: text("cost_code"),
	rfiStage: text("rfi_stage"),
	scheduleImpact: text("schedule_impact"),
	costImpact: text("cost_impact"),
	reference: text(),
	isPrivate: boolean("is_private").default(false).notNull(),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	rfiManagerEmployeeId: bigint("rfi_manager_employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ballInCourtEmployeeId: bigint("ball_in_court_employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdByEmployeeId: bigint("created_by_employee_id", { mode: "number" }),
}, (table) => [
	index("idx_rfis_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_rfis_number_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops"), table.number.asc().nullsLast().op("int8_ops")),
	index("idx_rfis_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_rfis_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ballInCourtEmployeeId],
			foreignColumns: [employees.id],
			name: "rfis_ball_in_court_employee_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdByEmployeeId],
			foreignColumns: [employees.id],
			name: "rfis_created_by_employee_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "rfis_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.rfiManagerEmployeeId],
			foreignColumns: [employees.id],
			name: "rfis_rfi_manager_employee_id_fkey"
		}).onDelete("set null"),
]);

export const documentChunks = pgTable("document_chunks", {
	chunkId: text("chunk_id").primaryKey().notNull(),
	documentId: text("document_id").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	text: text().notNull(),
	metadata: jsonb(),
	contentHash: text("content_hash"),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("document_chunks_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	index("idx_document_chunks_content_hash").using("btree", table.contentHash.asc().nullsLast().op("text_ops")),
	index("idx_document_chunks_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_document_chunks_document_id").using("btree", table.documentId.asc().nullsLast().op("text_ops")),
	unique("document_chunks_document_id_chunk_index_key").on(table.documentId, table.chunkIndex),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Enable write access for authenticated users", { as: "permissive", for: "all", to: ["public"] }),
]);

export const documentInsights = pgTable("document_insights", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: text("document_id").notNull(),
	projectId: integer("project_id"),
	insightType: text("insight_type").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }).default('0.0'),
	generatedBy: text("generated_by").default('llama-3.1-8b').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	metadata: jsonb().default({}),
	docTitle: text("doc_title"),
	severity: varchar({ length: 20 }),
	businessImpact: text("business_impact"),
	assignee: text(),
	dueDate: date("due_date"),
	financialImpact: numeric("financial_impact", { precision: 12, scale:  2 }),
	urgencyIndicators: text("urgency_indicators").array(),
	resolved: boolean().default(false),
	sourceMeetings: text("source_meetings").array(),
	dependencies: text().array(),
	stakeholdersAffected: text("stakeholders_affected").array(),
	exactQuotes: text("exact_quotes").array(),
	numericalData: jsonb("numerical_data"),
	criticalPathImpact: boolean("critical_path_impact").default(false),
	crossProjectImpact: integer("cross_project_impact").array(),
	documentDate: date("document_date"),
	projectName: text("project_name"),
}, (table) => [
	index("idx_document_insights_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_document_insights_doc_title").using("gin", sql`to_tsvector('english'::regconfig, doc_title)`),
	index("idx_document_insights_document_date").using("btree", table.documentDate.asc().nullsLast().op("date_ops")),
	index("idx_document_insights_document_id").using("btree", table.documentId.asc().nullsLast().op("text_ops")),
	index("idx_document_insights_project_id").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	index("idx_document_insights_project_name").using("btree", table.projectName.asc().nullsLast().op("text_ops")),
	index("idx_document_insights_type").using("btree", table.insightType.asc().nullsLast().op("text_ops")),
	index("idx_insights_assignee").using("btree", table.assignee.asc().nullsLast().op("text_ops")),
	index("idx_insights_critical_path").using("btree", table.criticalPathImpact.asc().nullsLast().op("bool_ops")),
	index("idx_insights_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_insights_resolved").using("btree", table.resolved.asc().nullsLast().op("bool_ops")),
	index("idx_insights_severity").using("btree", table.severity.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documentMetadata.id],
			name: "document_insights_document_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	check("document_insights_confidence_score_check", sql`(confidence_score >= 0.0) AND (confidence_score <= 1.0)`),
	check("document_insights_severity_check", sql`(severity)::text = ANY ((ARRAY['critical'::character varying, 'high'::character varying, 'medium'::character varying, 'low'::character varying])::text[])`),
]);

export const aiTasks = pgTable("ai_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id"),
	sourceDocumentId: text("source_document_id"),
	title: text().notNull(),
	description: text(),
	assignee: text(),
	status: text().default('open').notNull(),
	dueDate: date("due_date"),
	createdBy: text("created_by").default('ai').notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ai_tasks_due_date").using("btree", table.status.asc().nullsLast().op("date_ops"), table.dueDate.asc().nullsLast().op("text_ops")),
	index("idx_ai_tasks_project_status").using("btree", table.projectId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "ai_tasks_project_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sourceDocumentId],
			foreignColumns: [documentMetadata.id],
			name: "ai_tasks_source_document_id_fkey"
		}).onDelete("set null"),
]);

export const ingestionJobs = pgTable("ingestion_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firefliesId: text("fireflies_id"),
	documentId: text("document_id"),
	status: text().default('pending').notNull(),
	error: text(),
	contentHash: text("content_hash"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("ux_ingestion_jobs_fireflies").using("btree", table.firefliesId.asc().nullsLast().op("text_ops")).where(sql`(fireflies_id IS NOT NULL)`),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documentMetadata.id],
			name: "ingestion_jobs_document_id_fkey"
		}).onDelete("set null"),
]);

export const aiInsights = pgTable("ai_insights", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "ai_insights_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	insightType: text("insight_type"),
	severity: text(),
	title: text().notNull(),
	description: text().notNull(),
	sourceMeetings: text("source_meetings"),
	confidenceScore: real("confidence_score"),
	resolved: integer().default(0),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	meetingId: uuid("meeting_id"),
	meetingName: text("meeting_name"),
	projectName: text("project_name"),
	documentId: uuid("document_id"),
	status: text().default('open'),
	assignedTo: text("assigned_to"),
	dueDate: date("due_date"),
	metadata: jsonb().default({}),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	businessImpact: text("business_impact"),
	assignee: text(),
	dependencies: jsonb().default([]),
	financialImpact: numeric("financial_impact"),
	timelineImpactDays: integer("timeline_impact_days"),
	stakeholdersAffected: text("stakeholders_affected").array(),
	exactQuotes: jsonb("exact_quotes").default([]),
	numericalData: jsonb("numerical_data").default([]),
	urgencyIndicators: text("urgency_indicators").array(),
	crossProjectImpact: integer("cross_project_impact").array(),
	chunksId: uuid("chunks_id"),
	meetingDate: timestamp("meeting_date", { withTimezone: true, mode: 'string' }),
	exactQuotesText: text("exact_quotes_text"),
}, (table) => [
	index("idx_ai_insights_assigned_to").using("btree", table.assignedTo.asc().nullsLast().op("text_ops")).where(sql`(assigned_to IS NOT NULL)`),
	index("idx_ai_insights_chunks_id").using("btree", table.chunksId.asc().nullsLast().op("uuid_ops")),
	index("idx_ai_insights_created_at").using("btree", table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_ai_insights_document_id").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_ai_insights_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")).where(sql`(due_date IS NOT NULL)`),
	index("idx_ai_insights_exact_quotes_search").using("gin", sql`to_tsvector('english'::regconfig, COALESCE((exact_quotes)::text`).where(sql`(exact_quotes IS NOT NULL)`),
	index("idx_ai_insights_exact_quotes_tsv").using("gin", sql`to_tsvector('english'::regconfig, COALESCE(exact_quotes_text, '`).where(sql`(exact_quotes_text IS NOT NULL)`),
	index("idx_ai_insights_meeting_name").using("btree", table.meetingName.asc().nullsLast().op("text_ops")),
	index("idx_ai_insights_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_ai_insights_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_ai_insights_project_name").using("btree", table.projectName.asc().nullsLast().op("text_ops")),
	index("idx_ai_insights_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_ai_insights_type").using("btree", table.insightType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.chunksId],
			foreignColumns: [chunks.id],
			name: "ai_insights_chunks_id_fkey"
		}),
	unique("ai_insights_id_key").on(table.id),
	pgPolicy("Allow anon users to view ai_insights", { as: "permissive", for: "select", to: ["anon"], using: sql`true` }),
	pgPolicy("Allow authenticated users full access to ai_insights", { as: "permissive", for: "all", to: ["authenticated"] }),
	pgPolicy("ai_insights_select_project_visible", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("ai_insights_flexible_parent_check", sql`(document_id IS NOT NULL) OR (meeting_id IS NOT NULL) OR ((document_id IS NULL) AND (meeting_id IS NULL))`),
	check("ai_insights_insight_type_check", sql`insight_type = ANY (ARRAY['action_item'::text, 'decision'::text, 'risk'::text, 'milestone'::text, 'fact'::text, 'blocker'::text, 'dependency'::text, 'budget_update'::text, 'timeline_change'::text, 'stakeholder_feedback'::text, 'technical_debt'::text])`),
	check("ai_insights_severity_check", sql`severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])`),
	check("ai_insights_status_check", sql`status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const dailyLogEquipment = pgTable("daily_log_equipment", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	dailyLogId: uuid("daily_log_id"),
	equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
	hoursOperated: numeric("hours_operated", { precision: 5, scale:  2 }),
	hoursIdle: numeric("hours_idle", { precision: 5, scale:  2 }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.dailyLogId],
			foreignColumns: [dailyLogs.id],
			name: "daily_log_equipment_daily_log_id_fkey"
		}).onDelete("cascade"),
]);

export const dailyLogs = pgTable("daily_logs", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	logDate: date("log_date").notNull(),
	weatherConditions: jsonb("weather_conditions"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "daily_logs_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "daily_logs_project_id_fkey"
		}),
	unique("daily_logs_project_id_log_date_key").on(table.projectId, table.logDate),
]);

export const dailyLogManpower = pgTable("daily_log_manpower", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	dailyLogId: uuid("daily_log_id"),
	companyId: uuid("company_id"),
	trade: varchar({ length: 100 }),
	workersCount: integer("workers_count").notNull(),
	hoursWorked: numeric("hours_worked", { precision: 5, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "daily_log_manpower_company_id_fkey"
		}),
	foreignKey({
			columns: [table.dailyLogId],
			foreignColumns: [dailyLogs.id],
			name: "daily_log_manpower_daily_log_id_fkey"
		}).onDelete("cascade"),
]);

export const dailyLogNotes = pgTable("daily_log_notes", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	dailyLogId: uuid("daily_log_id"),
	category: varchar({ length: 100 }),
	description: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.dailyLogId],
			foreignColumns: [dailyLogs.id],
			name: "daily_log_notes_daily_log_id_fkey"
		}).onDelete("cascade"),
]);

export const costForecasts = pgTable("cost_forecasts", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	budgetItemId: uuid("budget_item_id"),
	forecastDate: date("forecast_date").notNull(),
	forecastToComplete: numeric("forecast_to_complete", { precision: 15, scale:  2 }).notNull(),
	notes: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "cost_forecasts_created_by_fkey"
		}),
	unique("cost_forecasts_budget_item_id_forecast_date_key").on(table.budgetItemId, table.forecastDate),
]);

export const subJobs = pgTable("sub_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sub_jobs_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(is_active = true)`),
	index("idx_sub_jobs_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "sub_jobs_project_id_fkey"
		}).onDelete("cascade"),
	unique("uq_subjob_code").on(table.projectId, table.code),
	pgPolicy("sub_jobs_read", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("sub_jobs_write", { as: "permissive", for: "all", to: ["public"] }),
]);

export const directCostLineItems = pgTable("direct_cost_line_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	budgetCodeId: uuid("budget_code_id"),
	costCodeId: text("cost_code_id"),
	description: text().notNull(),
	transactionDate: date("transaction_date").notNull(),
	vendorName: varchar("vendor_name", { length: 255 }),
	invoiceNumber: varchar("invoice_number", { length: 100 }),
	amount: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	approved: boolean().default(false),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: uuid("approved_by"),
	costType: varchar("cost_type", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_direct_cost_line_items_approved").using("btree", table.approved.asc().nullsLast().op("bool_ops")),
	index("idx_direct_cost_line_items_budget").using("btree", table.budgetCodeId.asc().nullsLast().op("uuid_ops")).where(sql`(budget_code_id IS NOT NULL)`),
	index("idx_direct_cost_line_items_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")).where(sql`(cost_code_id IS NOT NULL)`),
	index("idx_direct_cost_line_items_date").using("btree", table.transactionDate.asc().nullsLast().op("date_ops")),
	index("idx_direct_cost_line_items_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "direct_cost_line_items_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "direct_cost_line_items_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "direct_cost_line_items_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "direct_cost_line_items_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("direct_cost_line_items_read", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("direct_cost_line_items_write", { as: "permissive", for: "all", to: ["public"] }),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	website: text(),
	address: text(),
	state: text(),
	city: text(),
	title: text(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	currencySymbol: varchar("currency_symbol", { length: 10 }).default('$'),
	currencyCode: varchar("currency_code", { length: 3 }).default('USD'),
	type: text(),
}, (table) => [
	pgPolicy("Allow authenticated users select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const forecastingCurves = pgTable("forecasting_curves", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	curveType: varchar("curve_type", { length: 50 }).notNull(),
	description: text(),
	curveConfig: jsonb("curve_config").default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
	updatedBy: uuid("updated_by"),
}, (table) => [
	index("idx_forecasting_curves_active").using("btree", table.companyId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("uuid_ops")),
	index("idx_forecasting_curves_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "forecasting_curves_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "forecasting_curves_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "forecasting_curves_updated_by_fkey"
		}),
	unique("forecasting_curves_company_name_unique").on(table.companyId, table.name),
	check("forecasting_curves_curve_type_check", sql`(curve_type)::text = ANY ((ARRAY['linear'::character varying, 's_curve'::character varying, 'custom'::character varying])::text[])`),
]);

export const financialContracts = pgTable("financial_contracts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contractNumber: varchar("contract_number", { length: 50 }).notNull(),
	contractType: varchar("contract_type", { length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	companyId: uuid("company_id"),
	subcontractorId: uuid("subcontractor_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	status: varchar({ length: 50 }).default('draft'),
	contractAmount: numeric("contract_amount", { precision: 15, scale:  2 }).default('0'),
	changeOrderAmount: numeric("change_order_amount", { precision: 15, scale:  2 }).default('0'),
	revisedAmount: numeric("revised_amount", { precision: 15, scale:  2 }).generatedAlwaysAs(sql`(contract_amount + change_order_amount)`),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "financial_contracts_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "financial_contracts_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "financial_contracts_project_id_fkey"
		}),
	foreignKey({
			columns: [table.subcontractorId],
			foreignColumns: [subcontractors.id],
			name: "financial_contracts_subcontractor_id_fkey"
		}),
	unique("financial_contracts_contract_number_key").on(table.contractNumber),
]);

export const scheduleOfValues = pgTable("schedule_of_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }),
	commitmentId: uuid("commitment_id"),
	status: text().default('draft'),
	totalAmount: numeric("total_amount", { precision: 15, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: uuid("approved_by"),
}, (table) => [
	index("idx_schedule_of_values_commitment").using("btree", table.commitmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_of_values_contract").using("btree", table.contractId.asc().nullsLast().op("int8_ops")),
	index("idx_schedule_of_values_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [appUsers.id],
			name: "schedule_of_values_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.commitmentId],
			foreignColumns: [commitments.id],
			name: "schedule_of_values_commitment_id_fkey"
		}),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "schedule_of_values_contract_id_fkey"
		}),
	pgPolicy("Users can view SOVs for their projects", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can manage SOVs for their projects", { as: "permissive", for: "all", to: ["public"] }),
	check("either_contract_or_commitment", sql`((contract_id IS NOT NULL) AND (commitment_id IS NULL)) OR ((contract_id IS NULL) AND (commitment_id IS NOT NULL))`),
	check("schedule_of_values_status_check", sql`status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'revised'::text])`),
]);

export const appUsers = pgTable("app_users", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 255 }),
	role: varchar({ length: 50 }).default('viewer').notNull(),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	emailVerified: boolean("email_verified").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text(),
}, (table) => [
	index("idx_app_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("app_users_email_key").on(table.email),
	pgPolicy("Service role can manage all users", { as: "permissive", for: "all", to: ["public"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("Users can read own data", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Service role can insert users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own data", { as: "permissive", for: "update", to: ["public"] }),
]);

export const dailyRecaps = pgTable("daily_recaps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	recapDate: date("recap_date").notNull(),
	dateRangeStart: date("date_range_start").notNull(),
	dateRangeEnd: date("date_range_end").notNull(),
	recapText: text("recap_text").notNull(),
	recapHtml: text("recap_html"),
	meetingCount: integer("meeting_count"),
	projectCount: integer("project_count"),
	meetingsAnalyzed: jsonb("meetings_analyzed"),
	risks: jsonb(),
	decisions: jsonb(),
	blockers: jsonb(),
	commitments: jsonb(),
	wins: jsonb(),
	sentEmail: boolean("sent_email").default(false),
	sentTeams: boolean("sent_teams").default(false),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	recipients: jsonb(),
	generationTimeSeconds: doublePrecision("generation_time_seconds"),
	modelUsed: varchar("model_used", { length: 50 }).default('gpt-4o'),
}, (table) => [
	index("idx_daily_recaps_date").using("btree", table.recapDate.desc().nullsFirst().op("date_ops")),
]);

export const todos = pgTable("todos", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "todos_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	task: text(),
	isComplete: boolean("is_complete").default(false),
	insertedAt: timestamp("inserted_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "todos_user_id_fkey"
		}),
	pgPolicy("Individuals can create todos.", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(auth.uid() = user_id)`  }),
	pgPolicy("Individuals can view their own todos. ", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Individuals can update their own todos.", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Individuals can delete their own todos.", { as: "permissive", for: "delete", to: ["public"] }),
	check("todos_task_check", sql`char_length(task) > 3`),
]);

export const sovLineItems = pgTable("sov_line_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sovId: uuid("sov_id"),
	lineNumber: integer("line_number").notNull(),
	description: text().notNull(),
	costCodeId: text("cost_code_id"),
	scheduledValue: numeric("scheduled_value", { precision: 15, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sov_line_items_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")),
	index("idx_sov_line_items_sov").using("btree", table.sovId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sovId],
			foreignColumns: [scheduleOfValues.id],
			name: "sov_line_items_sov_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view SOV line items", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can manage SOV line items", { as: "permissive", for: "all", to: ["public"] }),
]);

export const verticalMarkup = pgTable("vertical_markup", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	markupType: text("markup_type").notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	calculationOrder: integer("calculation_order").notNull(),
	compound: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_vertical_markup_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "vertical_markup_project_id_fkey"
		}),
	unique("vertical_markup_project_id_markup_type_key").on(table.projectId, table.markupType),
	pgPolicy("Users can view vertical markup", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can manage vertical markup", { as: "permissive", for: "all", to: ["public"] }),
	check("vertical_markup_markup_type_check", sql`markup_type = ANY (ARRAY['insurance'::text, 'bond'::text, 'fee'::text, 'overhead'::text, 'custom'::text])`),
	check("vertical_markup_percentage_check", sql`(percentage >= (0)::numeric) AND (percentage <= (100)::numeric)`),
]);

export const contracts = pgTable("contracts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "contracts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }).notNull(),
	contractNumber: text("contract_number"),
	title: text().notNull(),
	status: text(),
	erpStatus: text("erp_status"),
	executed: boolean().default(false),
	originalContractAmount: numeric("original_contract_amount", { precision: 14, scale:  2 }).default('0'),
	approvedChangeOrders: numeric("approved_change_orders", { precision: 14, scale:  2 }).default('0'),
	revisedContractAmount: numeric("revised_contract_amount", { precision: 14, scale:  2 }).default('0'),
	pendingChangeOrders: numeric("pending_change_orders", { precision: 14, scale:  2 }).default('0'),
	draftChangeOrders: numeric("draft_change_orders", { precision: 14, scale:  2 }).default('0'),
	invoicedAmount: numeric("invoiced_amount", { precision: 14, scale:  2 }).default('0'),
	paymentsReceived: numeric("payments_received", { precision: 14, scale:  2 }).default('0'),
	percentPaid: numeric("percent_paid", { precision: 6, scale:  2 }).generatedAlwaysAs(sql`
CASE
    WHEN (revised_contract_amount > (0)::numeric) THEN ((payments_received / revised_contract_amount) * (100)::numeric)
    ELSE (0)::numeric
END`),
	remainingBalance: numeric("remaining_balance", { precision: 14, scale:  2 }).default('0'),
	private: boolean().default(false),
	attachmentCount: integer("attachment_count").default(0),
	notes: text(),
	retentionPercentage: numeric("retention_percentage", { precision: 5, scale:  2 }).default('0'),
	applyVerticalMarkup: boolean("apply_vertical_markup").default(true),
	ownerClientId: integer("owner_client_id"),
	contractorId: integer("contractor_id"),
	architectEngineerId: integer("architect_engineer_id"),
	description: text(),
	startDate: date("start_date"),
	estimatedCompletionDate: date("estimated_completion_date"),
	substantialCompletionDate: date("substantial_completion_date"),
	actualCompletionDate: date("actual_completion_date"),
	signedContractReceivedDate: date("signed_contract_received_date"),
	contractTerminationDate: date("contract_termination_date"),
	inclusions: text(),
	exclusions: text(),
	defaultRetainage: numeric("default_retainage", { precision: 5, scale:  2 }).default('10'),
}, (table) => [
	index("idx_contracts_client_id").using("btree", table.clientId.asc().nullsLast().op("int8_ops")),
	index("idx_contracts_erp_status").using("btree", table.erpStatus.asc().nullsLast().op("text_ops")),
	index("idx_contracts_project_id").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_contracts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.architectEngineerId],
			foreignColumns: [clients.id],
			name: "contracts_architect_engineer_id_fkey"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "contracts_client_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.contractorId],
			foreignColumns: [clients.id],
			name: "contracts_contractor_id_fkey"
		}),
	foreignKey({
			columns: [table.ownerClientId],
			foreignColumns: [clients.id],
			name: "contracts_owner_client_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "contracts_project_id_fkey"
		}).onDelete("cascade"),
	check("contracts_default_retainage_check", sql`(default_retainage >= (0)::numeric) AND (default_retainage <= (100)::numeric)`),
	check("contracts_retention_percentage_check", sql`(retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)`),
]);

export const costCodes = pgTable("cost_codes", {
	id: text().primaryKey().notNull(),
	divisionId: uuid("division_id").notNull(),
	divisionTitle: text("division_title"),
	title: text(),
	status: text().default('True'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.divisionId],
			foreignColumns: [costCodeDivisions.id],
			name: "cost_codes_division_id_fkey"
		}),
]);

export const projectCostCodes = pgTable("project_cost_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	costCodeId: text("cost_code_id").notNull(),
	costTypeId: uuid("cost_type_id").default(sql`'f3f04b56-0bd1-5c8e-a57b-7c46c5b45b18'`),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("project_cost_codes_code_idx").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")),
	index("project_cost_codes_project_idx").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "project_cost_codes_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "project_cost_codes_cost_type_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_cost_codes_project_id_fkey"
		}).onDelete("cascade"),
]);

export const costCodeTypes = pgTable("cost_code_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	description: text().notNull(),
	category: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("cost_code_types_code_key").on(table.code),
]);

export const commitments = pgTable("commitments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	budgetItemId: uuid("budget_item_id").notNull(),
	vendorId: uuid("vendor_id"),
	contractAmount: numeric("contract_amount", { precision: 14, scale:  2 }).notNull(),
	status: text(),
	executedAt: timestamp("executed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	retentionPercentage: numeric("retention_percentage", { precision: 5, scale:  2 }).default('0'),
}, (table) => [
	index("idx_commitments_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_commitments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_commitments_vendor").using("btree", table.vendorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "commitments_project_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view commitments in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = commitments.project_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create commitments", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update commitments", { as: "permissive", for: "update", to: ["public"] }),
	check("commitments_retention_percentage_check", sql`(retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)`),
	check("commitments_status_check", sql`status = ANY (ARRAY['draft'::text, 'pending'::text, 'executed'::text, 'closed'::text, 'approved'::text])`),
]);

export const subcontractSovItems = pgTable("subcontract_sov_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subcontractId: uuid("subcontract_id").notNull(),
	lineNumber: integer("line_number"),
	changeEventLineItem: text("change_event_line_item"),
	budgetCode: text("budget_code"),
	description: text(),
	amount: numeric({ precision: 15, scale:  2 }).default('0'),
	billedToDate: numeric("billed_to_date", { precision: 15, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	sortOrder: integer("sort_order"),
}, (table) => [
	index("idx_sov_items_budget_code").using("btree", table.budgetCode.asc().nullsLast().op("text_ops")),
	index("idx_sov_items_sort_order").using("btree", table.subcontractId.asc().nullsLast().op("uuid_ops"), table.sortOrder.asc().nullsLast().op("uuid_ops")),
	index("idx_sov_items_subcontract_id").using("btree", table.subcontractId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subcontractId],
			foreignColumns: [subcontracts.id],
			name: "subcontract_sov_items_subcontract_id_fkey"
		}).onDelete("cascade"),
	unique("sov_line_number_unique").on(table.subcontractId, table.lineNumber),
	pgPolicy("Users can view SOV items", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (subcontracts s
     JOIN project_users pu ON ((pu.project_id = s.project_id)))
  WHERE ((s.id = subcontract_sov_items.subcontract_id) AND (pu.user_id = auth.uid()) AND ((s.is_private = false) OR (auth.uid() = ANY (s.non_admin_user_ids)) OR ((s.allow_non_admin_view_sov_items = true) AND (auth.uid() = ANY (s.non_admin_user_ids)))))))` }),
	pgPolicy("Users can manage SOV items", { as: "permissive", for: "all", to: ["public"] }),
	check("subcontract_sov_items_amount_check", sql`amount >= (0)::numeric`),
	check("subcontract_sov_items_billed_to_date_check", sql`billed_to_date >= (0)::numeric`),
]);

export const subcontracts = pgTable("subcontracts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contractNumber: text("contract_number").notNull(),
	contractCompanyId: uuid("contract_company_id"),
	title: text(),
	status: text().default('Draft').notNull(),
	executed: boolean().default(false).notNull(),
	defaultRetainagePercent: numeric("default_retainage_percent", { precision: 5, scale:  2 }),
	description: text(),
	inclusions: text(),
	exclusions: text(),
	startDate: text("start_date"),
	estimatedCompletionDate: text("estimated_completion_date"),
	actualCompletionDate: text("actual_completion_date"),
	contractDate: text("contract_date"),
	signedContractReceivedDate: text("signed_contract_received_date"),
	issuedOnDate: text("issued_on_date"),
	isPrivate: boolean("is_private").default(true),
	nonAdminUserIds: uuid("non_admin_user_ids").array().default([""]),
	allowNonAdminViewSovItems: boolean("allow_non_admin_view_sov_items").default(false),
	invoiceContactIds: uuid("invoice_contact_ids").array().default([""]),
	projectId: integer("project_id").notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_subcontracts_company_id").using("btree", table.contractCompanyId.asc().nullsLast().op("uuid_ops")),
	index("idx_subcontracts_contract_number").using("btree", table.contractNumber.asc().nullsLast().op("text_ops")),
	index("idx_subcontracts_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_subcontracts_project_id").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	index("idx_subcontracts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.contractCompanyId],
			foreignColumns: [companies.id],
			name: "subcontracts_contract_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "subcontracts_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "subcontracts_project_id_fkey"
		}).onDelete("cascade"),
	unique("contract_number_project_unique").on(table.contractNumber, table.projectId),
	pgPolicy("Users can view subcontracts for their projects", { as: "permissive", for: "select", to: ["public"], using: sql`((EXISTS ( SELECT 1
   FROM project_users pu
  WHERE ((pu.project_id = subcontracts.project_id) AND (pu.user_id = auth.uid())))) OR (is_private = false) OR ((is_private = true) AND (auth.uid() = ANY (non_admin_user_ids))))` }),
	pgPolicy("Users can create subcontracts for their projects", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update subcontracts for their projects", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete subcontracts for their projects", { as: "permissive", for: "delete", to: ["public"] }),
	check("subcontracts_default_retainage_percent_check", sql`(default_retainage_percent >= (0)::numeric) AND (default_retainage_percent <= (100)::numeric)`),
	check("subcontracts_status_check", sql`status = ANY (ARRAY['Draft'::text, 'Sent'::text, 'Pending'::text, 'Approved'::text, 'Executed'::text, 'Closed'::text, 'Void'::text])`),
]);

export const projectDirectory = pgTable("project_directory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	companyId: uuid("company_id"),
	role: text().notNull(),
	isActive: boolean("is_active").default(true),
	permissions: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_project_directory_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_project_directory_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "project_directory_company_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_directory_project_id_fkey"
		}),
	unique("project_directory_project_id_company_id_role_key").on(table.projectId, table.companyId, table.role),
	pgPolicy("Users can view project directory", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can manage project directory", { as: "permissive", for: "all", to: ["public"] }),
	check("project_directory_role_check", sql`role = ANY (ARRAY['owner'::text, 'architect'::text, 'engineer'::text, 'subcontractor'::text, 'vendor'::text])`),
]);

export const primeContracts = pgTable("prime_contracts", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	contractNumber: text("contract_number").notNull(),
	title: text().notNull(),
	vendorId: uuid("vendor_id"),
	description: text(),
	status: text().default('draft').notNull(),
	originalContractValue: numeric("original_contract_value", { precision: 15, scale:  2 }).default('0').notNull(),
	revisedContractValue: numeric("revised_contract_value", { precision: 15, scale:  2 }).default('0').notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	retentionPercentage: numeric("retention_percentage", { precision: 5, scale:  2 }).default('0'),
	paymentTerms: text("payment_terms"),
	billingSchedule: text("billing_schedule"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_prime_contracts_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_prime_contracts_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_prime_contracts_number").using("btree", table.contractNumber.asc().nullsLast().op("text_ops")),
	index("idx_prime_contracts_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_prime_contracts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_prime_contracts_vendor").using("btree", table.vendorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "prime_contracts_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "prime_contracts_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "prime_contracts_vendor_id_fkey"
		}).onDelete("set null"),
	unique("prime_contracts_project_id_contract_number_key").on(table.projectId, table.contractNumber),
	pgPolicy("Users can view contracts in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = prime_contracts.project_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create contracts", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update contracts", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete contracts", { as: "permissive", for: "delete", to: ["public"] }),
	check("prime_contracts_original_contract_value_check", sql`original_contract_value >= (0)::numeric`),
	check("prime_contracts_retention_percentage_check", sql`(retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)`),
	check("prime_contracts_revised_contract_value_check", sql`revised_contract_value >= (0)::numeric`),
	check("prime_contracts_status_check", sql`status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'on_hold'::text])`),
	check("valid_date_range", sql`(end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date)`),
]);

export const subcontractAttachments = pgTable("subcontract_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subcontractId: uuid("subcontract_id").notNull(),
	fileName: text("file_name").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	fileType: text("file_type"),
	storagePath: text("storage_path").notNull(),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_attachments_subcontract_id").using("btree", table.subcontractId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subcontractId],
			foreignColumns: [subcontracts.id],
			name: "subcontract_attachments_subcontract_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "subcontract_attachments_uploaded_by_fkey"
		}),
	pgPolicy("Users can view attachments", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (subcontracts s
     JOIN project_users pu ON ((pu.project_id = s.project_id)))
  WHERE ((s.id = subcontract_attachments.subcontract_id) AND (pu.user_id = auth.uid()))))` }),
	pgPolicy("Users can manage attachments", { as: "permissive", for: "all", to: ["public"] }),
]);

export const budgetViews = pgTable("budget_views", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false),
	isSystem: boolean("is_system").default(false),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_budget_views_default").using("btree", table.projectId.asc().nullsLast().op("bool_ops"), table.isDefault.asc().nullsLast().op("bool_ops")).where(sql`(is_default = true)`),
	index("idx_budget_views_project").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "budget_views_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "budget_views_project_id_fkey"
		}).onDelete("cascade"),
	unique("budget_views_project_id_name_key").on(table.projectId, table.name),
	pgPolicy("budget_views_select_policy", { as: "permissive", for: "select", to: ["public"], using: sql`(project_id IN ( SELECT p.id
   FROM (projects p
     JOIN project_users pu ON ((p.id = pu.project_id)))
  WHERE (pu.user_id = auth.uid())))` }),
	pgPolicy("budget_views_insert_policy", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("budget_views_update_policy", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("budget_views_delete_policy", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const budgetViewColumns = pgTable("budget_view_columns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	viewId: uuid("view_id").notNull(),
	columnKey: varchar("column_key", { length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 255 }),
	displayOrder: integer("display_order").default(0).notNull(),
	width: integer(),
	isVisible: boolean("is_visible").default(true),
	isLocked: boolean("is_locked").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_budget_view_columns_order").using("btree", table.viewId.asc().nullsLast().op("uuid_ops"), table.displayOrder.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_view_columns_view").using("btree", table.viewId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.viewId],
			foreignColumns: [budgetViews.id],
			name: "budget_view_columns_view_id_fkey"
		}).onDelete("cascade"),
	unique("budget_view_columns_view_id_column_key_key").on(table.viewId, table.columnKey),
	pgPolicy("budget_view_columns_select_policy", { as: "permissive", for: "select", to: ["public"], using: sql`(view_id IN ( SELECT bv.id
   FROM ((budget_views bv
     JOIN projects p ON ((bv.project_id = p.id)))
     JOIN project_users pu ON ((p.id = pu.project_id)))
  WHERE (pu.user_id = auth.uid())))` }),
	pgPolicy("budget_view_columns_insert_policy", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("budget_view_columns_update_policy", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("budget_view_columns_delete_policy", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const contractLineItems = pgTable("contract_line_items", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	lineNumber: integer("line_number").notNull(),
	description: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	costCodeId: bigint("cost_code_id", { mode: "number" }),
	quantity: numeric({ precision: 15, scale:  4 }).default('0'),
	unitOfMeasure: text("unit_of_measure"),
	unitCost: numeric("unit_cost", { precision: 15, scale:  2 }).default('0'),
	totalCost: numeric("total_cost", { precision: 15, scale:  2 }).generatedAlwaysAs(sql`(quantity * unit_cost)`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contract_line_items_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	index("idx_contract_line_items_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("int8_ops")),
	index("idx_contract_line_items_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [primeContracts.id],
			name: "contract_line_items_contract_id_fkey"
		}).onDelete("cascade"),
	unique("contract_line_items_contract_id_line_number_key").on(table.contractId, table.lineNumber),
	pgPolicy("Users can view line items in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_line_items.contract_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create line items", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update line items", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete line items", { as: "permissive", for: "delete", to: ["public"] }),
	check("contract_line_items_quantity_check", sql`quantity >= (0)::numeric`),
	check("contract_line_items_unit_cost_check", sql`unit_cost >= (0)::numeric`),
]);

export const changeOrderLines = pgTable("change_order_lines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeOrderId: bigint("change_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	subJobId: uuid("sub_job_id"),
	costCodeId: text("cost_code_id").notNull(),
	costTypeId: uuid("cost_type_id").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_co_lines_change_order").using("btree", table.changeOrderId.asc().nullsLast().op("int8_ops")),
	index("idx_co_lines_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")),
	index("idx_co_lines_cost_type").using("btree", table.costTypeId.asc().nullsLast().op("uuid_ops")),
	index("idx_co_lines_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.changeOrderId],
			foreignColumns: [changeOrders.id],
			name: "change_order_lines_change_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "change_order_lines_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "change_order_lines_cost_type_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "change_order_lines_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subJobId],
			foreignColumns: [subJobs.id],
			name: "change_order_lines_sub_job_id_fkey"
		}).onDelete("set null"),
	pgPolicy("change_order_lines_select", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("change_order_lines_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("change_order_lines_update", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("change_order_lines_delete", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const budgetModLines = pgTable("budget_mod_lines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	budgetModificationId: uuid("budget_modification_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	subJobId: uuid("sub_job_id"),
	costCodeId: text("cost_code_id").notNull(),
	costTypeId: uuid("cost_type_id").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_budget_mod_lines_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")),
	index("idx_budget_mod_lines_cost_type").using("btree", table.costTypeId.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_mod_lines_mod").using("btree", table.budgetModificationId.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_mod_lines_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.budgetModificationId],
			foreignColumns: [budgetModifications.id],
			name: "budget_mod_lines_budget_modification_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "budget_mod_lines_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "budget_mod_lines_cost_type_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "budget_mod_lines_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subJobId],
			foreignColumns: [subJobs.id],
			name: "budget_mod_lines_sub_job_id_fkey"
		}).onDelete("set null"),
	pgPolicy("budget_mod_lines_select", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("budget_mod_lines_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("budget_mod_lines_update", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("budget_mod_lines_delete", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const budgetLines = pgTable("budget_lines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	subJobId: uuid("sub_job_id"),
	costCodeId: text("cost_code_id").notNull(),
	costTypeId: uuid("cost_type_id").notNull(),
	description: text(),
	originalAmount: numeric("original_amount", { precision: 15, scale:  2 }).default('0').notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	subJobKey: uuid("sub_job_key").generatedAlwaysAs(sql`COALESCE(sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid)`),
	projectBudgetCodeId: uuid("project_budget_code_id"),
	updatedBy: uuid("updated_by"),
	quantity: numeric({ precision: 15, scale:  4 }),
	unitOfMeasure: text("unit_of_measure"),
	unitCost: numeric("unit_cost", { precision: 15, scale:  4 }),
	defaultFtcMethod: varchar("default_ftc_method", { length: 50 }).default('automatic'),
	defaultCurveId: uuid("default_curve_id"),
	forecastingEnabled: boolean("forecasting_enabled").default(true).notNull(),
}, (table) => [
	index("idx_budget_lines_cost_code").using("btree", table.costCodeId.asc().nullsLast().op("text_ops")),
	index("idx_budget_lines_cost_type").using("btree", table.costTypeId.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_lines_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_budget_lines_project_budget_code_id").using("btree", table.projectBudgetCodeId.asc().nullsLast().op("uuid_ops")),
	index("idx_budget_lines_sub_job").using("btree", table.subJobId.asc().nullsLast().op("uuid_ops")).where(sql`(sub_job_id IS NOT NULL)`),
	index("idx_budget_lines_updated_at").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.costCodeId],
			foreignColumns: [costCodes.id],
			name: "budget_lines_cost_code_id_fkey"
		}),
	foreignKey({
			columns: [table.costTypeId],
			foreignColumns: [costCodeTypes.id],
			name: "budget_lines_cost_type_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "budget_lines_created_by_fkey"
		}),
	foreignKey({
			columns: [table.defaultCurveId],
			foreignColumns: [forecastingCurves.id],
			name: "budget_lines_default_curve_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.projectBudgetCodeId],
			foreignColumns: [projectBudgetCodes.id],
			name: "budget_lines_project_budget_code_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "budget_lines_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subJobId],
			foreignColumns: [subJobs.id],
			name: "budget_lines_sub_job_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "budget_lines_updated_by_fkey"
		}),
	unique("uq_budget_line").on(table.projectId, table.costCodeId, table.costTypeId, table.subJobKey),
	pgPolicy("budget_lines_select", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("budget_lines_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("budget_lines_update", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("budget_lines_delete", { as: "permissive", for: "delete", to: ["public"] }),
	check("budget_lines_default_ftc_method_check", sql`(default_ftc_method)::text = ANY ((ARRAY['manual'::character varying, 'automatic'::character varying, 'lump_sum'::character varying, 'monitored_resources'::character varying])::text[])`),
]);

export const budgetModifications = pgTable("budget_modifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	number: text().notNull(),
	title: text().notNull(),
	reason: text(),
	status: text().default('draft').notNull(),
	effectiveDate: date("effective_date"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_budget_modifications_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_budget_modifications_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_budget_mods_project").using("btree", table.projectId.asc().nullsLast().op("int8_ops")),
	index("idx_budget_mods_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "budget_modifications_created_by_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "budget_modifications_project_id_fkey"
		}).onDelete("cascade"),
	unique("uq_budget_mod_number").on(table.projectId, table.number),
	pgPolicy("budget_modifications_select", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("budget_modifications_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("budget_modifications_update", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("budget_modifications_delete", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Users can view budget modifications in their projects", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Editors can create budget modifications", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update budget modifications", { as: "permissive", for: "update", to: ["public"] }),
	check("budget_modifications_status_check", sql`status = ANY (ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'void'::text])`),
]);

export const contractChangeOrders = pgTable("contract_change_orders", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	contractId: uuid("contract_id").notNull(),
	changeOrderNumber: text("change_order_number").notNull(),
	description: text().notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	requestedBy: uuid("requested_by"),
	requestedDate: date("requested_date").default(sql`CURRENT_DATE`).notNull(),
	approvedBy: uuid("approved_by"),
	approvedDate: date("approved_date"),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_change_orders_approved_by").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_change_orders_contract").using("btree", table.contractId.asc().nullsLast().op("uuid_ops")),
	index("idx_change_orders_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_change_orders_requested_by").using("btree", table.requestedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_change_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "contract_change_orders_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [primeContracts.id],
			name: "contract_change_orders_contract_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [users.id],
			name: "contract_change_orders_requested_by_fkey"
		}),
	unique("contract_change_orders_contract_id_change_order_number_key").on(table.contractId, table.changeOrderNumber),
	pgPolicy("Users can view change orders in their projects", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_change_orders.contract_id) AND (project_members.user_id = auth.uid()))))` }),
	pgPolicy("Editors can create change orders", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Editors can update change orders", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete change orders", { as: "permissive", for: "delete", to: ["public"] }),
	check("contract_change_orders_status_check", sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])`),
	check("valid_approval_date", sql`((status = 'approved'::text) AND (approved_date IS NOT NULL) AND (approved_by IS NOT NULL)) OR ((status = 'rejected'::text) AND (approved_date IS NOT NULL) AND (approved_by IS NOT NULL) AND (rejection_reason IS NOT NULL)) OR (status = 'pending'::text)`),
]);

export const groupMembers = pgTable("group_members", {
	groupId: uuid("group_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: text().default('member'),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_members_group_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_members_user_id_fkey"
		}),
	primaryKey({ columns: [table.groupId, table.userId], name: "group_members_pkey"}),
]);

export const documentUserAccess = pgTable("document_user_access", {
	documentId: text("document_id").notNull(),
	userId: uuid("user_id").notNull(),
	accessLevel: text("access_level").default('viewer').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documentMetadata.id],
			name: "document_user_access_document_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "document_user_access_user_id_fkey"
		}),
	primaryKey({ columns: [table.documentId, table.userId], name: "document_user_access_pkey"}),
	pgPolicy("Admins manage document_user_access", { as: "permissive", for: "all", to: ["public"], using: sql`((auth.jwt() ->> 'role'::text) = 'admin'::text)`, withCheck: sql`((auth.jwt() ->> 'role'::text) = 'admin'::text)`  }),
]);

export const documentGroupAccess = pgTable("document_group_access", {
	documentId: text("document_id").notNull(),
	groupId: uuid("group_id").notNull(),
	accessLevel: text("access_level").default('viewer').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documentMetadata.id],
			name: "document_group_access_document_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "document_group_access_group_id_fkey"
		}),
	primaryKey({ columns: [table.documentId, table.groupId], name: "document_group_access_pkey"}),
	pgPolicy("Admins manage document_group_access", { as: "permissive", for: "all", to: ["public"], using: sql`((auth.jwt() ->> 'role'::text) = 'admin'::text)`, withCheck: sql`((auth.jwt() ->> 'role'::text) = 'admin'::text)`  }),
]);

export const rfiAssignees = pgTable("rfi_assignees", {
	rfiId: uuid("rfi_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }).notNull(),
	isPrimary: boolean("is_primary").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "rfi_assignees_employee_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.rfiId],
			foreignColumns: [rfis.id],
			name: "rfi_assignees_rfi_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.rfiId, table.employeeId], name: "rfi_assignees_pkey"}),
]);

export const databaseTablesCatalog = pgTable("database_tables_catalog", {
	schemaName: text("schema_name").notNull(),
	tableName: text("table_name").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	rowCount: bigint("row_count", { mode: "number" }),
	rlsEnabled: boolean("rls_enabled"),
	primaryKeys: text("primary_keys"),
	tableComment: text("table_comment"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	primaryKey({ columns: [table.schemaName, table.tableName], name: "database_tables_catalog_pkey"}),
]);
export const costCodesWithDivisionTitle = pgView("cost_codes_with_division_title", {	id: text(),
	divisionId: uuid("division_id"),
	divisionTitle: text("division_title"),
	title: text(),
	status: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	divisionTitleCurrent: text("division_title_current"),
}).as(sql`SELECT c.id, c.division_id, c.division_title, c.title, c.status, c.created_at, c.updated_at, d.title AS division_title_current FROM cost_codes c LEFT JOIN cost_code_divisions d ON c.division_id = d.id`);

export const documentMetadataManualOnly = pgView("document_metadata_manual_only", {	id: text(),
	title: text(),
	url: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	type: text(),
	source: text(),
	content: text(),
	summary: text(),
	participants: text(),
	tags: text(),
	category: text(),
	firefliesId: text("fireflies_id"),
	firefliesLink: text("fireflies_link"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	project: text(),
	date: timestamp({ withTimezone: true, mode: 'string' }),
	durationMinutes: integer("duration_minutes"),
	bulletPoints: text("bullet_points"),
	actionItems: text("action_items"),
	fileId: integer("file_id"),
	overview: text(),
	description: text(),
	status: text(),
	accessLevel: text("access_level"),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }),
	contentHash: text("content_hash"),
	participantsArray: text("participants_array"),
	phase: text(),
	audio: text(),
	video: text(),
}).as(sql`SELECT id, title, url, created_at, type, source, content, summary, participants, tags, category, fireflies_id, fireflies_link, project_id, project, date, duration_minutes, bullet_points, action_items, file_id, overview, description, status, access_level, captured_at, content_hash, participants_array, phase, audio, video FROM document_metadata WHERE fireflies_id ~~* '%MANUAL%'::text`);

export const projectHealthDashboardNoSummary = pgView("project_health_dashboard_no_summary", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	name: text(),
	currentPhase: varchar("current_phase", { length: 100 }),
	completionPercentage: integer("completion_percentage"),
	healthScore: numeric("health_score", { precision: 5, scale:  2 }),
	healthStatus: text("health_status"),
	summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true, mode: 'string' }),
	budgetUtilization: numeric("budget_utilization"),
	estCompletion: date("est completion"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalInsightsCount: bigint("total_insights_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	openCriticalItems: bigint("open_critical_items", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	recentDocumentsCount: bigint("recent_documents_count", { mode: "number" }),
	lastDocumentDate: date("last_document_date"),
}).with({"securityInvoker":true}).as(sql`SELECT id, name, current_phase, completion_percentage, health_score, health_status, summary_updated_at, CASE WHEN budget IS NOT NULL AND budget > 0::numeric AND budget_used IS NOT NULL THEN budget_used::numeric / budget::numeric * 100::numeric ELSE 0::numeric END AS budget_utilization, "est completion", ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id) AS total_insights_count, ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'critical'::text AND (ai.resolved = 0 OR ai.resolved IS NULL)) AS open_critical_items, ( SELECT count(*) AS count FROM documents d WHERE d.project_id = p.id AND d.created_at > (now() - '30 days'::interval)) AS recent_documents_count, ( SELECT max(d.created_at::date) AS max FROM documents d WHERE d.project_id = p.id) AS last_document_date FROM projects p WHERE name IS NOT NULL ORDER BY ( CASE WHEN health_score IS NULL THEN 999::numeric ELSE health_score END)`);

export const aiInsightsWithProject = pgView("ai_insights_with_project", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	insightType: text("insight_type"),
	severity: text(),
	title: text(),
	description: text(),
	sourceMeetings: text("source_meetings"),
	confidenceScore: real("confidence_score"),
	resolved: integer(),
	createdAt: text("created_at"),
	meetingId: uuid("meeting_id"),
	projectName: text("project_name"),
}).as(sql`SELECT ai.id, ai.project_id, ai.insight_type, ai.severity, ai.title, ai.description, ai.source_meetings, ai.confidence_score, ai.resolved, ai.created_at, ai.meeting_id, p.name AS project_name FROM ai_insights ai LEFT JOIN projects p ON ai.project_id = p.id`);

export const figureSummary = pgView("figure_summary", {	figureNumber: integer("figure_number"),
	title: text(),
	normalizedSummary: text("normalized_summary"),
	figureType: text("figure_type"),
	asrsType: text("asrs_type"),
	containerType: text("container_type"),
	maxDepth: text("max_depth"),
	maxSpacing: text("max_spacing"),
	relatedTables: integer("related_tables"),
	pageNumber: integer("page_number"),
	keywords: text(),
	keywordCount: integer("keyword_count"),
}).as(sql`SELECT figure_number, title, normalized_summary, figure_type, asrs_type, container_type, CASE WHEN max_depth_ft IS NOT NULL THEN max_depth_ft || ' ft'::text ELSE 'Variable'::text END AS max_depth, CASE WHEN max_spacing_ft IS NOT NULL THEN max_spacing_ft || ' ft'::text ELSE 'Variable'::text END AS max_spacing, related_tables, page_number, array_to_string(search_keywords, ', '::text) AS keywords, array_length(search_keywords, 1) AS keyword_count FROM fm_global_figures ORDER BY figure_number`);

export const aiInsightsToday = pgView("ai_insights_today", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	insightType: text("insight_type"),
	severity: text(),
	title: text(),
	description: text(),
	sourceMeetings: text("source_meetings"),
	confidenceScore: real("confidence_score"),
	resolved: integer(),
	createdAt: text("created_at"),
	meetingId: uuid("meeting_id"),
	meetingName: text("meeting_name"),
	projectName: text("project_name"),
	documentId: uuid("document_id"),
	status: text(),
	assignedTo: text("assigned_to"),
	dueDate: date("due_date"),
	metadata: jsonb(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	businessImpact: text("business_impact"),
	assignee: text(),
	dependencies: jsonb(),
	financialImpact: numeric("financial_impact"),
	timelineImpactDays: integer("timeline_impact_days"),
	stakeholdersAffected: text("stakeholders_affected"),
	exactQuotes: jsonb("exact_quotes"),
	numericalData: jsonb("numerical_data"),
	urgencyIndicators: text("urgency_indicators"),
	crossProjectImpact: integer("cross_project_impact"),
}).with({"securityInvoker":true}).as(sql`SELECT id, project_id, insight_type, severity, title, description, source_meetings, confidence_score, resolved, created_at, meeting_id, meeting_name, project_name, document_id, status, assigned_to, due_date, metadata, resolved_at, business_impact, assignee, dependencies, financial_impact, timeline_impact_days, stakeholders_affected, exact_quotes, numerical_data, urgency_indicators, cross_project_impact FROM ai_insights WHERE created_at::timestamp with time zone >= date_trunc('day'::text, now()) AND created_at::timestamp with time zone < (date_trunc('day'::text, now()) + '1 day'::interval)`);

export const projectHealthDashboard = pgView("project_health_dashboard", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	name: text(),
	currentPhase: varchar("current_phase", { length: 100 }),
	completionPercentage: integer("completion_percentage"),
	healthScore: numeric("health_score", { precision: 5, scale:  2 }),
	healthStatus: text("health_status"),
	summary: text(),
	summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true, mode: 'string' }),
	budgetUtilization: numeric("budget_utilization"),
	estCompletion: date("est completion"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalInsightsCount: bigint("total_insights_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	openCriticalItems: bigint("open_critical_items", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	recentDocumentsCount: bigint("recent_documents_count", { mode: "number" }),
	lastDocumentDate: date("last_document_date"),
}).as(sql`SELECT id, name, current_phase, completion_percentage, health_score, health_status, summary, summary_updated_at, CASE WHEN budget IS NOT NULL AND budget > 0::numeric AND budget_used IS NOT NULL THEN budget_used::numeric / budget::numeric * 100::numeric ELSE 0::numeric END AS budget_utilization, "est completion", ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id) AS total_insights_count, ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'critical'::text AND (ai.resolved = 0 OR ai.resolved IS NULL)) AS open_critical_items, ( SELECT count(*) AS count FROM documents d WHERE d.project_id = p.id AND d.created_at > (now() - '30 days'::interval)) AS recent_documents_count, ( SELECT max(d.created_at::date) AS max FROM documents d WHERE d.project_id = p.id) AS last_document_date FROM projects p WHERE name IS NOT NULL ORDER BY ( CASE WHEN health_score IS NULL THEN 999::numeric ELSE health_score END)`);

export const documentsOrderedView = pgView("documents_ordered_view", {	id: uuid(),
	title: text(),
	date: timestamp({ withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	project: text(),
	firefliesId: text("fireflies_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}).with({"securityInvoker":true}).as(sql`SELECT id, title, file_date AS date, project_id, project, fireflies_id, created_at, updated_at FROM documents`);

export const contractFinancialSummaryMv = pgMaterializedView("contract_financial_summary_mv", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }),
	contractNumber: text("contract_number"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	title: text(),
	status: text(),
	erpStatus: text("erp_status"),
	executed: boolean(),
	private: boolean(),
	originalContractAmount: numeric("original_contract_amount"),
	approvedChangeOrders: numeric("approved_change_orders"),
	revisedContractAmount: numeric("revised_contract_amount"),
	pendingChangeOrders: numeric("pending_change_orders"),
	draftChangeOrders: numeric("draft_change_orders"),
	invoicedAmount: numeric("invoiced_amount"),
	paymentsReceived: numeric("payments_received"),
	percentPaid: numeric("percent_paid"),
	remainingBalance: numeric("remaining_balance"),
}).as(sql`WITH original_sov AS ( SELECT prime_contract_sovs.contract_id, COALESCE(sum(prime_contract_sovs.line_amount), 0::numeric) AS original_contract_amount FROM prime_contract_sovs GROUP BY prime_contract_sovs.contract_id ), approved_pccos AS ( SELECT prime_contract_change_orders.contract_id, COALESCE(sum(pcco_line_items.line_amount), 0::numeric) AS approved_change_orders FROM prime_contract_change_orders JOIN pcco_line_items ON pcco_line_items.pcco_id = prime_contract_change_orders.id WHERE prime_contract_change_orders.status = 'Approved'::text GROUP BY prime_contract_change_orders.contract_id ), pending_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS pending_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Pending'::text GROUP BY prime_potential_change_orders.contract_id ), draft_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS draft_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Draft'::text GROUP BY prime_potential_change_orders.contract_id ), invoiced AS ( SELECT owner_invoices.contract_id, COALESCE(sum(owner_invoice_line_items.approved_amount), 0::numeric) AS invoiced_amount FROM owner_invoices JOIN owner_invoice_line_items ON owner_invoice_line_items.invoice_id = owner_invoices.id WHERE owner_invoices.status = 'Approved'::text GROUP BY owner_invoices.contract_id ), payments AS ( SELECT payment_transactions.contract_id, COALESCE(sum(payment_transactions.amount), 0::numeric) AS payments_received FROM payment_transactions GROUP BY payment_transactions.contract_id ) SELECT c.id AS contract_id, c.contract_number, c.client_id, c.project_id, c.title, c.status, c.erp_status, c.executed, c.private, COALESCE(os.original_contract_amount, 0::numeric) AS original_contract_amount, COALESCE(ap.approved_change_orders, 0::numeric) AS approved_change_orders, COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric) AS revised_contract_amount, COALESCE(pp.pending_change_orders, 0::numeric) AS pending_change_orders, COALESCE(dp.draft_change_orders, 0::numeric) AS draft_change_orders, COALESCE(inv.invoiced_amount, 0::numeric) AS invoiced_amount, COALESCE(pay.payments_received, 0::numeric) AS payments_received, CASE WHEN (COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric)) > 0::numeric THEN round(COALESCE(pay.payments_received, 0::numeric) / (COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric)) * 100::numeric, 2) ELSE 0::numeric END AS percent_paid, COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric) - COALESCE(pay.payments_received, 0::numeric) AS remaining_balance FROM contracts c LEFT JOIN original_sov os ON os.contract_id = c.id LEFT JOIN approved_pccos ap ON ap.contract_id = c.id LEFT JOIN pending_pcos pp ON pp.contract_id = c.id LEFT JOIN draft_pcos dp ON dp.contract_id = c.id LEFT JOIN invoiced inv ON inv.contract_id = c.id LEFT JOIN payments pay ON pay.contract_id = c.id`);

export const figureStatistics = pgView("figure_statistics", {	metric: text(),
	value: text(),
}).as(sql`SELECT 'Total Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures UNION ALL SELECT 'Shuttle ASRS Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.asrs_type = 'Shuttle'::text UNION ALL SELECT 'Mini-Load ASRS Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.asrs_type = 'Mini-Load'::text UNION ALL SELECT 'Sprinkler Layout Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.figure_type = 'Sprinkler Layout'::text UNION ALL SELECT 'Open-Top Container Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.container_type = 'Open-Top'::text UNION ALL SELECT 'Closed-Top Container Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.container_type = 'Closed-Top'::text`);

export const actionableInsights = pgView("actionable_insights", {	id: uuid(),
	documentId: text("document_id"),
	projectId: integer("project_id"),
	insightType: text("insight_type"),
	title: text(),
	description: text(),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }),
	generatedBy: text("generated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb(),
	docTitle: text("doc_title"),
	severity: varchar({ length: 20 }),
	businessImpact: text("business_impact"),
	assignee: text(),
	dueDate: date("due_date"),
	financialImpact: numeric("financial_impact", { precision: 12, scale:  2 }),
	urgencyIndicators: text("urgency_indicators"),
	resolved: boolean(),
	sourceMeetings: text("source_meetings"),
	dependencies: text(),
	stakeholdersAffected: text("stakeholders_affected"),
	exactQuotes: text("exact_quotes"),
	numericalData: jsonb("numerical_data"),
	criticalPathImpact: boolean("critical_path_impact"),
	crossProjectImpact: integer("cross_project_impact"),
	documentTitle: text("document_title"),
	documentType: text("document_type"),
	meetingDate: timestamp("meeting_date", { withTimezone: true, mode: 'string' }),
	projectName: text("project_name"),
}).as(sql`SELECT di.id, di.document_id, di.project_id, di.insight_type, di.title, di.description, di.confidence_score, di.generated_by, di.created_at, di.metadata, di.doc_title, di.severity, di.business_impact, di.assignee, di.due_date, di.financial_impact, di.urgency_indicators, di.resolved, di.source_meetings, di.dependencies, di.stakeholders_affected, di.exact_quotes, di.numerical_data, di.critical_path_impact, di.cross_project_impact, dm.title AS document_title, dm.type AS document_type, dm.date AS meeting_date, p.name AS project_name FROM document_insights di LEFT JOIN document_metadata dm ON di.document_id = dm.id LEFT JOIN projects p ON di.project_id = p.id WHERE di.resolved = false AND (di.severity::text = ANY (ARRAY['critical'::character varying, 'high'::character varying]::text[])) ORDER BY ( CASE di.severity WHEN 'critical'::text THEN 1 WHEN 'high'::text THEN 2 WHEN 'medium'::text THEN 3 WHEN 'low'::text THEN 4 ELSE NULL::integer END), di.due_date, di.confidence_score DESC`);

export const subcontractorsSummary = pgView("subcontractors_summary", {	id: uuid(),
	companyName: text("company_name"),
	primaryContactName: text("primary_contact_name"),
	primaryContactEmail: text("primary_contact_email"),
	specialties: text(),
	serviceAreas: text("service_areas"),
	fmGlobalCertified: boolean("fm_global_certified"),
	asrsExperienceYears: integer("asrs_experience_years"),
	status: text(),
	tierLevel: text("tier_level"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalProjects: bigint("total_projects", { mode: "number" }),
	avgRating: numeric("avg_rating"),
	onTimePercentage: numeric("on_time_percentage"),
}).as(sql`SELECT s.id, s.company_name, s.primary_contact_name, s.primary_contact_email, s.specialties, s.service_areas, s.fm_global_certified, s.asrs_experience_years, s.status, s.tier_level, count(sp.id) AS total_projects, avg(sp.project_rating) AS avg_rating, sum( CASE WHEN sp.on_time THEN 1 ELSE 0 END)::numeric / count(sp.id)::numeric * 100::numeric AS on_time_percentage FROM subcontractors s LEFT JOIN subcontractor_projects sp ON s.id = sp.subcontractor_id GROUP BY s.id, s.company_name, s.primary_contact_name, s.primary_contact_email, s.specialties, s.service_areas, s.fm_global_certified, s.asrs_experience_years, s.status, s.tier_level`);

export const documentMetadataViewNoSummary = pgView("document_metadata_view_no_summary", {	title: text(),
	date: timestamp({ withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	project: text(),
	firefliesId: text("fireflies_id"),
	firefliesLink: text("fireflies_link"),
}).with({"securityInvoker":true}).as(sql`SELECT title, date, project_id, project, fireflies_id, fireflies_link FROM document_metadata`);

export const activeSubmittals = pgView("active_submittals", {	id: uuid(),
	projectId: integer("project_id"),
	specificationId: uuid("specification_id"),
	submittalTypeId: uuid("submittal_type_id"),
	submittalNumber: varchar("submittal_number", { length: 100 }),
	title: varchar({ length: 255 }),
	description: text(),
	submittedBy: uuid("submitted_by"),
	submitterCompany: varchar("submitter_company", { length: 255 }),
	submissionDate: timestamp("submission_date", { withTimezone: true, mode: 'string' }),
	requiredApprovalDate: date("required_approval_date"),
	priority: varchar({ length: 50 }),
	status: varchar({ length: 50 }),
	currentVersion: integer("current_version"),
	totalVersions: integer("total_versions"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	projectName: text("project_name"),
	submittedByEmail: varchar("submitted_by_email", { length: 64 }),
	submittalTypeName: varchar("submittal_type_name", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	discrepancyCount: bigint("discrepancy_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	criticalDiscrepancies: bigint("critical_discrepancies", { mode: "number" }),
}).as(sql`SELECT s.id, s.project_id, s.specification_id, s.submittal_type_id, s.submittal_number, s.title, s.description, s.submitted_by, s.submitter_company, s.submission_date, s.required_approval_date, s.priority, s.status, s.current_version, s.total_versions, s.metadata, s.created_at, s.updated_at, p.name AS project_name, u.email AS submitted_by_email, st.name AS submittal_type_name, count(d.id) AS discrepancy_count, count( CASE WHEN d.severity::text = 'critical'::text THEN 1 ELSE NULL::integer END) AS critical_discrepancies FROM submittals s JOIN projects p ON s.project_id = p.id JOIN users u ON s.submitted_by = u.id JOIN submittal_types st ON s.submittal_type_id = st.id LEFT JOIN discrepancies d ON s.id = d.submittal_id AND d.status::text = 'open'::text WHERE s.status::text <> ALL (ARRAY['approved'::character varying, 'rejected'::character varying, 'superseded'::character varying]::text[]) GROUP BY s.id, p.name, u.email, st.name`);

export const submittalProjectDashboard = pgView("submittal_project_dashboard", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	name: text(),
	status: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalSubmittals: bigint("total_submittals", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pendingSubmittals: bigint("pending_submittals", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	underReview: bigint("under_review", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	approvedSubmittals: bigint("approved_submittals", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	needsRevision: bigint("needs_revision", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalDiscrepancies: bigint("total_discrepancies", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	criticalDiscrepancies: bigint("critical_discrepancies", { mode: "number" }),
	avgReviewTimeDays: numeric("avg_review_time_days"),
}).as(sql`SELECT p.id, p.name, p.state AS status, count(s.id) AS total_submittals, count( CASE WHEN s.status::text = 'submitted'::text THEN 1 ELSE NULL::integer END) AS pending_submittals, count( CASE WHEN s.status::text = 'under_review'::text THEN 1 ELSE NULL::integer END) AS under_review, count( CASE WHEN s.status::text = 'approved'::text THEN 1 ELSE NULL::integer END) AS approved_submittals, count( CASE WHEN s.status::text = 'requires_revision'::text THEN 1 ELSE NULL::integer END) AS needs_revision, count(d.id) AS total_discrepancies, count( CASE WHEN d.severity::text = 'critical'::text THEN 1 ELSE NULL::integer END) AS critical_discrepancies, avg(EXTRACT(days FROM COALESCE(r.completed_at, now()) - s.submission_date)) AS avg_review_time_days FROM projects p LEFT JOIN submittals s ON p.id = s.project_id LEFT JOIN discrepancies d ON s.id = d.submittal_id AND d.status::text = 'open'::text LEFT JOIN reviews r ON s.id = r.submittal_id AND r.review_type::text = 'final'::text GROUP BY p.id, p.name, p.state`);

export const projectIssueSummary = pgView("project_issue_summary", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	projectName: text("project_name"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalIssues: bigint("total_issues", { mode: "number" }),
	totalCost: numeric("total_cost"),
	avgCostPerIssue: numeric("avg_cost_per_issue"),
}).as(sql`SELECT p.id AS project_id, p.name AS project_name, count(i.id) AS total_issues, sum(i.total_cost) AS total_cost, round(avg(i.total_cost), 2) AS avg_cost_per_issue FROM projects p LEFT JOIN issues i ON p.id = i.project_id GROUP BY p.id, p.name ORDER BY (sum(i.total_cost)) DESC NULLS LAST`);

export const costByCategory = pgView("cost_by_category", {	category: issueCategory(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	issueCount: bigint("issue_count", { mode: "number" }),
	totalCost: numeric("total_cost"),
	avgCost: numeric("avg_cost"),
}).as(sql`SELECT category, count(*) AS issue_count, sum(total_cost) AS total_cost, round(avg(total_cost), 2) AS avg_cost FROM issues GROUP BY category ORDER BY (sum(total_cost)) DESC NULLS LAST`);

export const procoreCaptureSummary = pgView("procore_capture_summary", {	category: text(),
	moduleName: text("module_name"),
	displayName: text("display_name"),
	priority: text(),
	complexity: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	screenshotCount: bigint("screenshot_count", { mode: "number" }),
	lastCaptured: timestamp("last_captured", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT m.category, m.name AS module_name, m.display_name, m.priority, m.complexity, count(DISTINCT s.id) AS screenshot_count, max(s.captured_at) AS last_captured FROM procore_modules m LEFT JOIN procore_screenshots s ON s.name ~~ (('%'::text || m.name) || '%'::text) GROUP BY m.category, m.name, m.display_name, m.priority, m.complexity ORDER BY m.category, m.priority`);

export const procoreRebuildEstimate = pgView("procore_rebuild_estimate", {	category: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	moduleCount: bigint("module_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	mustHaveWeeks: bigint("must_have_weeks", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	niceToHaveWeeks: bigint("nice_to_have_weeks", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalWeeks: bigint("total_weeks", { mode: "number" }),
}).as(sql`SELECT category, count(*) AS module_count, sum( CASE WHEN priority = 'must_have'::text THEN estimated_build_weeks ELSE 0 END) AS must_have_weeks, sum( CASE WHEN priority = 'nice_to_have'::text THEN estimated_build_weeks ELSE 0 END) AS nice_to_have_weeks, sum(estimated_build_weeks) AS total_weeks FROM procore_modules WHERE priority <> 'skip'::text GROUP BY category ORDER BY category`);

export const projectWithManager = pgView("project_with_manager", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	name: text(),
	jobNumber: text("job number"),
	startDate: date("start date"),
	estCompletion: date("est completion"),
	estRevenue: numeric("est revenue"),
	estProfit: numeric("est profit"),
	address: text(),
	onedrive: text(),
	phase: text(),
	state: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	category: text(),
	aliases: text(),
	teamMembers: text("team_members"),
	currentPhase: varchar("current_phase", { length: 100 }),
	completionPercentage: integer("completion_percentage"),
	budget: numeric({ precision: 12, scale:  2 }),
	budgetUsed: numeric("budget_used", { precision: 12, scale:  2 }),
	client: text(),
	summary: text(),
	summaryMetadata: jsonb("summary_metadata"),
	summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true, mode: 'string' }),
	healthScore: numeric("health_score", { precision: 5, scale:  2 }),
	healthStatus: text("health_status"),
	access: text(),
	archived: boolean(),
	archivedBy: uuid("archived_by"),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	erpSystem: text("erp_system"),
	erpLastJobCostSync: timestamp("erp_last_job_cost_sync", { withTimezone: true, mode: 'string' }),
	erpLastDirectCostSync: timestamp("erp_last_direct_cost_sync", { withTimezone: true, mode: 'string' }),
	erpSyncStatus: text("erp_sync_status"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectManager: bigint("project_manager", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	managerId: bigint("manager_id", { mode: "number" }),
	managerName: text("manager_name"),
	managerEmail: text("manager_email"),
}).as(sql`SELECT p.id, p.created_at, p.name, p."job number", p."start date", p."est completion", p."est revenue", p."est profit", p.address, p.onedrive, p.phase, p.state, p.client_id, p.category, p.aliases, p.team_members, p.current_phase, p.completion_percentage, p.budget, p.budget_used, p.client, p.summary, p.summary_metadata, p.summary_updated_at, p.health_score, p.health_status, p.access, p.archived, p.archived_by, p.archived_at, p.erp_system, p.erp_last_job_cost_sync, p.erp_last_direct_cost_sync, p.erp_sync_status, p.project_manager, e.id AS manager_id, (e.first_name || ' '::text) || e.last_name AS manager_name, e.email AS manager_email FROM projects p LEFT JOIN employees e ON e.id = p.project_manager`);

export const contractFinancialSummary = pgView("contract_financial_summary", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractId: bigint("contract_id", { mode: "number" }),
	contractNumber: text("contract_number"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clientId: bigint("client_id", { mode: "number" }),
	title: text(),
	status: text(),
	erpStatus: text("erp_status"),
	executed: boolean(),
	private: boolean(),
	originalContractAmount: numeric("original_contract_amount"),
	approvedChangeOrders: numeric("approved_change_orders"),
	revisedContractAmount: numeric("revised_contract_amount"),
	pendingChangeOrders: numeric("pending_change_orders"),
	draftChangeOrders: numeric("draft_change_orders"),
	invoicedAmount: numeric("invoiced_amount"),
	paymentsReceived: numeric("payments_received"),
	percentPaid: numeric("percent_paid"),
	remainingBalance: numeric("remaining_balance"),
}).as(sql`WITH original_sov AS ( SELECT prime_contract_sovs.contract_id, COALESCE(sum(prime_contract_sovs.line_amount), 0::numeric) AS original_contract_amount FROM prime_contract_sovs GROUP BY prime_contract_sovs.contract_id ), approved_pccos AS ( SELECT prime_contract_change_orders.contract_id, COALESCE(sum(pcco_line_items.line_amount), 0::numeric) AS approved_change_orders FROM prime_contract_change_orders JOIN pcco_line_items ON pcco_line_items.pcco_id = prime_contract_change_orders.id WHERE prime_contract_change_orders.status = 'Approved'::text GROUP BY prime_contract_change_orders.contract_id ), pending_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS pending_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Pending'::text GROUP BY prime_potential_change_orders.contract_id ), draft_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS draft_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Draft'::text GROUP BY prime_potential_change_orders.contract_id ), invoiced AS ( SELECT owner_invoices.contract_id, COALESCE(sum(owner_invoice_line_items.approved_amount), 0::numeric) AS invoiced_amount FROM owner_invoices JOIN owner_invoice_line_items ON owner_invoice_line_items.invoice_id = owner_invoices.id WHERE owner_invoices.status = 'Approved'::text GROUP BY owner_invoices.contract_id ), payments AS ( SELECT payment_transactions.contract_id, COALESCE(sum(payment_transactions.amount), 0::numeric) AS payments_received FROM payment_transactions GROUP BY payment_transactions.contract_id ) SELECT c.id AS contract_id, c.contract_number, c.client_id, c.title, c.status, c.erp_status, c.executed, c.private, os.original_contract_amount, ap.approved_change_orders, os.original_contract_amount + ap.approved_change_orders AS revised_contract_amount, pp.pending_change_orders, dp.draft_change_orders, inv.invoiced_amount, pay.payments_received, CASE WHEN (os.original_contract_amount + ap.approved_change_orders) > 0::numeric THEN round(pay.payments_received / (os.original_contract_amount + ap.approved_change_orders) * 100::numeric, 2) ELSE 0::numeric END AS percent_paid, os.original_contract_amount + ap.approved_change_orders - pay.payments_received AS remaining_balance FROM contracts c LEFT JOIN original_sov os ON os.contract_id = c.id LEFT JOIN approved_pccos ap ON ap.contract_id = c.id LEFT JOIN pending_pcos pp ON pp.contract_id = c.id LEFT JOIN draft_pcos dp ON dp.contract_id = c.id LEFT JOIN invoiced inv ON inv.contract_id = c.id LEFT JOIN payments pay ON pay.contract_id = c.id`);

export const projectActivityView = pgView("project_activity_view", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	name: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	meetingCount: bigint("meeting_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	openTasks: bigint("open_tasks", { mode: "number" }),
	lastMeetingAt: timestamp("last_meeting_at", { withTimezone: true, mode: 'string' }),
	lastTaskUpdate: timestamp("last_task_update", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT p.id AS project_id, p.name, COALESCE(count(DISTINCT dm.id), 0::bigint) AS meeting_count, COALESCE(count(DISTINCT CASE WHEN t.status = ANY (ARRAY['open'::text, 'in_progress'::text]) THEN t.id ELSE NULL::uuid END), 0::bigint) AS open_tasks, max(dm.captured_at) AS last_meeting_at, max(t.updated_at) AS last_task_update FROM projects p LEFT JOIN document_metadata dm ON dm.project_id = p.id LEFT JOIN ai_tasks t ON t.project_id = p.id GROUP BY p.id, p.name`);

export const openTasksView = pgView("open_tasks_view", {	id: uuid(),
	projectId: integer("project_id"),
	sourceDocumentId: text("source_document_id"),
	title: text(),
	description: text(),
	assignee: text(),
	status: text(),
	dueDate: date("due_date"),
	createdBy: text("created_by"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	projectName: text("project_name"),
	sourceDocumentTitle: text("source_document_title"),
}).as(sql`SELECT t.id, t.project_id, t.source_document_id, t.title, t.description, t.assignee, t.status, t.due_date, t.created_by, t.metadata, t.created_at, t.updated_at, p.name AS project_name, dm.title AS source_document_title FROM ai_tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN document_metadata dm ON dm.id = t.source_document_id WHERE t.status = ANY (ARRAY['open'::text, 'in_progress'::text])`);

export const sovLineItemsWithPercentage = pgView("sov_line_items_with_percentage", {	id: uuid(),
	sovId: uuid("sov_id"),
	lineNumber: integer("line_number"),
	description: text(),
	costCodeId: text("cost_code_id"),
	scheduledValue: numeric("scheduled_value", { precision: 15, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	percentage: numeric(),
}).as(sql`SELECT sli.id, sli.sov_id, sli.line_number, sli.description, sli.cost_code_id, sli.scheduled_value, sli.created_at, sli.updated_at, CASE WHEN sov.total_amount > 0::numeric THEN round(sli.scheduled_value / sov.total_amount * 100::numeric, 2) ELSE 0::numeric END AS percentage FROM sov_line_items sli JOIN schedule_of_values sov ON sov.id = sli.sov_id`);

export const subcontractsWithTotals = pgView("subcontracts_with_totals", {	id: uuid(),
	contractNumber: text("contract_number"),
	contractCompanyId: uuid("contract_company_id"),
	title: text(),
	status: text(),
	executed: boolean(),
	defaultRetainagePercent: numeric("default_retainage_percent", { precision: 5, scale:  2 }),
	description: text(),
	inclusions: text(),
	exclusions: text(),
	startDate: text("start_date"),
	estimatedCompletionDate: text("estimated_completion_date"),
	actualCompletionDate: text("actual_completion_date"),
	contractDate: text("contract_date"),
	signedContractReceivedDate: text("signed_contract_received_date"),
	issuedOnDate: text("issued_on_date"),
	isPrivate: boolean("is_private"),
	nonAdminUserIds: uuid("non_admin_user_ids"),
	allowNonAdminViewSovItems: boolean("allow_non_admin_view_sov_items"),
	invoiceContactIds: uuid("invoice_contact_ids"),
	projectId: integer("project_id"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	totalSovAmount: numeric("total_sov_amount"),
	totalBilledToDate: numeric("total_billed_to_date"),
	totalAmountRemaining: numeric("total_amount_remaining"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sovLineCount: bigint("sov_line_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	attachmentCount: bigint("attachment_count", { mode: "number" }),
	companyName: text("company_name"),
	companyType: text("company_type"),
}).as(sql`SELECT s.id, s.contract_number, s.contract_company_id, s.title, s.status, s.executed, s.default_retainage_percent, s.description, s.inclusions, s.exclusions, s.start_date, s.estimated_completion_date, s.actual_completion_date, s.contract_date, s.signed_contract_received_date, s.issued_on_date, s.is_private, s.non_admin_user_ids, s.allow_non_admin_view_sov_items, s.invoice_contact_ids, s.project_id, s.created_by, s.created_at, s.updated_at, COALESCE(sov_totals.total_amount, 0::numeric) AS total_sov_amount, COALESCE(sov_totals.total_billed, 0::numeric) AS total_billed_to_date, COALESCE(sov_totals.total_amount, 0::numeric) - COALESCE(sov_totals.total_billed, 0::numeric) AS total_amount_remaining, COALESCE(sov_totals.line_item_count, 0::bigint) AS sov_line_count, COALESCE(att_count.count, 0::bigint) AS attachment_count, c.name AS company_name, c.type AS company_type FROM subcontracts s LEFT JOIN ( SELECT subcontract_sov_items.subcontract_id, sum(subcontract_sov_items.amount) AS total_amount, sum(subcontract_sov_items.billed_to_date) AS total_billed, count(*) AS line_item_count FROM subcontract_sov_items GROUP BY subcontract_sov_items.subcontract_id) sov_totals ON s.id = sov_totals.subcontract_id LEFT JOIN ( SELECT subcontract_attachments.subcontract_id, count(*) AS count FROM subcontract_attachments GROUP BY subcontract_attachments.subcontract_id) att_count ON s.id = att_count.subcontract_id LEFT JOIN companies c ON s.contract_company_id = c.id`);

export const vBudgetLines = pgView("v_budget_lines", {	id: uuid(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	subJobId: uuid("sub_job_id"),
	costCodeId: text("cost_code_id"),
	costTypeId: uuid("cost_type_id"),
	description: text(),
	originalAmount: numeric("original_amount", { precision: 15, scale:  2 }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	budgetModTotal: numeric("budget_mod_total"),
	approvedCoTotal: numeric("approved_co_total"),
	revisedBudget: numeric("revised_budget"),
}).as(sql`SELECT id, project_id, sub_job_id, cost_code_id, cost_type_id, description, original_amount, created_by, created_at, updated_at, COALESCE(( SELECT sum(bml.amount) AS sum FROM budget_mod_lines bml JOIN budget_modifications bm ON bml.budget_modification_id = bm.id WHERE bm.status = 'approved'::text AND bml.project_id = bl.project_id AND COALESCE(bml.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND bml.cost_code_id = bl.cost_code_id AND bml.cost_type_id = bl.cost_type_id), 0::numeric) AS budget_mod_total, COALESCE(( SELECT sum(col.amount) AS sum FROM change_order_lines col JOIN change_orders co ON col.change_order_id = co.id WHERE co.status = 'approved'::text AND col.project_id = bl.project_id AND COALESCE(col.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND col.cost_code_id = bl.cost_code_id AND col.cost_type_id = bl.cost_type_id), 0::numeric) AS approved_co_total, original_amount + COALESCE(( SELECT sum(bml.amount) AS sum FROM budget_mod_lines bml JOIN budget_modifications bm ON bml.budget_modification_id = bm.id WHERE bm.status = 'approved'::text AND bml.project_id = bl.project_id AND COALESCE(bml.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND bml.cost_code_id = bl.cost_code_id AND bml.cost_type_id = bl.cost_type_id), 0::numeric) + COALESCE(( SELECT sum(col.amount) AS sum FROM change_order_lines col JOIN change_orders co ON col.change_order_id = co.id WHERE co.status = 'approved'::text AND col.project_id = bl.project_id AND COALESCE(col.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND col.cost_code_id = bl.cost_code_id AND col.cost_type_id = bl.cost_type_id), 0::numeric) AS revised_budget FROM budget_lines bl`);