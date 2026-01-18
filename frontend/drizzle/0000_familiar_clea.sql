-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."billing_period_status" AS ENUM('open', 'closed', 'approved');--> statement-breakpoint
CREATE TYPE "public"."budget_status" AS ENUM('locked', 'unlocked');--> statement-breakpoint
CREATE TYPE "public"."calculation_method" AS ENUM('unit_price', 'lump_sum', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."change_event_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."change_order_status" AS ENUM('draft', 'pending', 'approved', 'void');--> statement-breakpoint
CREATE TYPE "public"."commitment_type" AS ENUM('subcontract', 'purchase_order', 'service_order');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('vendor', 'subcontractor', 'owner', 'architect', 'other');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending', 'executed', 'closed', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('prime_contract', 'commitment');--> statement-breakpoint
CREATE TYPE "public"."erp_sync_status" AS ENUM('pending', 'synced', 'failed', 'resyncing');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'pending', 'approved', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."issue_category" AS ENUM('Design', 'Submittal', 'Scheduling', 'Procurement', 'Installation', 'Safety', 'Change Order', 'Other');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('Low', 'Medium', 'High', 'Critical');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('Open', 'In Progress', 'Resolved', 'Pending Verification');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'inactive', 'complete');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'doing', 'review', 'done');--> statement-breakpoint
CREATE SEQUENCE "public"."ai_insights_id_seq1" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "fm_text_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" text DEFAULT 'FMDS0834' NOT NULL,
	"doc_version" text DEFAULT '2024-07' NOT NULL,
	"page_number" integer,
	"clause_id" text,
	"section_path" text[],
	"content_type" text DEFAULT 'text' NOT NULL,
	"raw_text" text NOT NULL,
	"chunk_summary" text,
	"chunk_size" integer GENERATED ALWAYS AS (length(raw_text)) STORED,
	"search_keywords" text[],
	"topics" text[],
	"extracted_requirements" text[],
	"compliance_type" text,
	"related_figures" integer[],
	"related_tables" text[],
	"related_sections" text[],
	"embedding" vector(1536),
	"cost_impact" text,
	"savings_opportunities" text[],
	"complexity_score" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fm_text_chunks_complexity_score_check" CHECK ((complexity_score >= 1) AND (complexity_score <= 10)),
	CONSTRAINT "fm_text_chunks_cost_impact_check" CHECK (cost_impact = ANY (ARRAY['HIGH'::text, 'MEDIUM'::text, 'LOW'::text]))
);
--> statement-breakpoint
ALTER TABLE "fm_text_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chats" (
	"id" varchar PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimization_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"condition_from" jsonb,
	"condition_to" jsonb,
	"cost_impact" numeric,
	"description" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "project_budget_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"sub_job_id" uuid,
	"cost_code_id" text NOT NULL,
	"cost_type_id" uuid NOT NULL,
	"description" text NOT NULL,
	"description_mode" text DEFAULT 'concatenated' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sub_job_key" uuid GENERATED ALWAYS AS (COALESCE(sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
	CONSTRAINT "uq_project_budget_code" UNIQUE("project_id","cost_code_id","cost_type_id","sub_job_key"),
	CONSTRAINT "project_budget_codes_description_mode_check" CHECK (description_mode = ANY (ARRAY['concatenated'::text, 'custom'::text]))
);
--> statement-breakpoint
ALTER TABLE "project_budget_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"content" text,
	"metadata" jsonb,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "billing_periods" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" bigint,
	"period_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_closed" boolean DEFAULT false,
	"closed_date" timestamp with time zone,
	"closed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "billing_periods_project_id_period_number_key" UNIQUE("project_id","period_number")
);
--> statement-breakpoint
ALTER TABLE "billing_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "nods_page" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"parent_page_id" bigint,
	"path" text NOT NULL,
	"checksum" text,
	"meta" jsonb,
	"type" text,
	"source" text,
	CONSTRAINT "nods_page_path_key" UNIQUE("path")
);
--> statement-breakpoint
ALTER TABLE "nods_page" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sync_status" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"sync_type" text DEFAULT 'fireflies' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"status" text DEFAULT 'idle',
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sync_status_status_check" CHECK (status = ANY (ARRAY['idle'::text, 'running'::text, 'failed'::text, 'completed'::text]))
);
--> statement-breakpoint
ALTER TABLE "sync_status" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_line_item_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"budget_line_item_id" uuid NOT NULL,
	"budget_code" text NOT NULL,
	"description" text NOT NULL,
	"event_type" text NOT NULL,
	"changed_field" text,
	"from_value" text,
	"to_value" text,
	"performed_by" uuid,
	"performed_by_name" text,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'app' NOT NULL,
	"notes" text,
	CONSTRAINT "budget_line_item_history_event_type_check" CHECK (event_type = ANY (ARRAY['BUDGET_LINE_ITEM_CREATED'::text, 'BUDGET_LINE_ITEM_UPDATED'::text, 'BUDGET_LINE_ITEM_DELETED'::text, 'BUDGET_FORECAST_CREATED'::text]))
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint,
	"task_description" text NOT NULL,
	"assigned_to" text,
	"due_date" date,
	"priority" text,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_tasks_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
	CONSTRAINT "project_tasks_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
ALTER TABLE "project_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"chunk_index" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"token_count" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"document_title" text
);
--> statement-breakpoint
CREATE TABLE "fm_table_vectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"content_text" text NOT NULL,
	"content_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fm_table_vectors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meeting_segments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"metadata_id" text NOT NULL,
	"segment_index" integer NOT NULL,
	"title" text,
	"start_index" integer NOT NULL,
	"end_index" integer NOT NULL,
	"summary" text,
	"decisions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary_embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_ids" integer[] DEFAULT '{}',
	CONSTRAINT "meeting_segments_metadata_id_segment_index_key" UNIQUE("metadata_id","segment_index")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "employees_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"department" text,
	"salery" text,
	"start_date" date,
	"supervisor" bigint,
	"company_card" numeric,
	"truck_allowance" numeric,
	"phone_allowance" numeric,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"job_title" text,
	"supervisor_name" text,
	"photo" text,
	CONSTRAINT "employees_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cost_code_divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "divisions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fm_optimization_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_submission_id" uuid,
	"suggestion_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"original_config" jsonb,
	"suggested_config" jsonb,
	"estimated_savings" numeric,
	"implementation_effort" text,
	"risk_level" text,
	"technical_justification" text,
	"applicable_codes" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_context" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb,
	"strategic_initiatives" jsonb DEFAULT '[]'::jsonb,
	"okrs" jsonb DEFAULT '[]'::jsonb,
	"resource_constraints" jsonb DEFAULT '[]'::jsonb,
	"policies" jsonb DEFAULT '[]'::jsonb,
	"org_structure" jsonb,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255),
	"project_name" text,
	"company_name" text,
	"contact_phone" varchar(50),
	"project_data" jsonb NOT NULL,
	"lead_score" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'new',
	"estimated_value" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "user_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "design_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"recommendation_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"potential_savings" numeric(12, 2),
	"priority_level" varchar(20) NOT NULL,
	"implementation_effort" varchar(20),
	"technical_details" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "design_recommendations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cost_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factor_name" varchar(100) NOT NULL,
	"factor_type" varchar(50) NOT NULL,
	"base_cost_per_unit" numeric(10, 2),
	"unit_type" varchar(50),
	"complexity_multiplier" numeric(4, 2) DEFAULT '1.0',
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cost_factors_factor_name_key" UNIQUE("factor_name")
);
--> statement-breakpoint
ALTER TABLE "cost_factors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "asrs_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_name" varchar(100) NOT NULL,
	"asrs_type" varchar(50) NOT NULL,
	"max_height_ft" numeric(5, 2),
	"container_types" text[],
	"typical_applications" text[],
	"cost_multiplier" numeric(4, 2) DEFAULT '1.0',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "asrs_configurations_config_name_key" UNIQUE("config_name")
);
--> statement-breakpoint
ALTER TABLE "asrs_configurations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fm_form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text,
	"user_input" jsonb NOT NULL,
	"parsed_requirements" jsonb,
	"matched_table_ids" text[],
	"similarity_scores" numeric[],
	"selected_configuration" jsonb,
	"contact_info" jsonb,
	"project_details" jsonb,
	"lead_score" integer,
	"lead_status" text DEFAULT 'new',
	"cost_analysis" jsonb,
	"recommendations" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chk_lead_score" CHECK ((lead_score >= 0) AND (lead_score <= 100)),
	CONSTRAINT "chk_lead_status" CHECK (lead_status = ANY (ARRAY['new'::text, 'qualified'::text, 'contacted'::text, 'converted'::text, 'lost'::text]))
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_id" bigint NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "issue_category" NOT NULL,
	"severity" "issue_severity" DEFAULT 'Medium',
	"status" "issue_status" DEFAULT 'Open',
	"reported_by" text,
	"date_reported" date DEFAULT CURRENT_DATE,
	"date_resolved" date,
	"direct_cost" numeric(12, 2) DEFAULT '0',
	"indirect_cost" numeric(12, 2) DEFAULT '0',
	"total_cost" numeric(12, 2) GENERATED ALWAYS AS ((direct_cost + indirect_cost)) STORED,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "fm_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"filename" text,
	"content" text,
	"document_type" text,
	"embedding" vector(1536),
	"related_table_ids" text[],
	"source" text,
	"processing_status" text DEFAULT 'pending',
	"processing_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subcontractor_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcontractor_id" uuid,
	"project_name" text NOT NULL,
	"project_value" numeric(12, 2),
	"start_date" date,
	"completion_date" date,
	"project_rating" numeric(3, 2),
	"on_time" boolean,
	"on_budget" boolean,
	"safety_incidents" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subcontractor_projects_project_rating_check" CHECK ((project_rating >= (0)::numeric) AND (project_rating <= (5)::numeric))
);
--> statement-breakpoint
CREATE TABLE "fm_global_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_number" integer NOT NULL,
	"table_id" text NOT NULL,
	"title" text NOT NULL,
	"asrs_type" text NOT NULL,
	"system_type" text NOT NULL,
	"protection_scheme" text NOT NULL,
	"commodity_types" text[] DEFAULT '{""}',
	"ceiling_height_min_ft" numeric,
	"ceiling_height_max_ft" numeric,
	"storage_height_max_ft" numeric,
	"aisle_width_requirements" text,
	"rack_configuration" jsonb,
	"sprinkler_specifications" jsonb,
	"design_parameters" jsonb,
	"special_conditions" text[],
	"applicable_figures" integer[],
	"estimated_page_number" integer,
	"extraction_status" text DEFAULT 'pending',
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"section_references" text[],
	"container_type" text,
	"figures" uuid,
	"image" text,
	CONSTRAINT "fm_global_tables_table_id_key" UNIQUE("table_id"),
	CONSTRAINT "chk_extraction_status" CHECK (extraction_status = ANY (ARRAY['pending'::text, 'extracted'::text, 'vectorized'::text, 'verified'::text]))
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" bigint NOT NULL,
	"title" text,
	"body" text,
	"created_by" uuid DEFAULT auth.uid(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"archived" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "document_executive_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"project_id" integer,
	"executive_summary" text NOT NULL,
	"critical_path_items" integer DEFAULT 0,
	"total_insights" integer DEFAULT 0,
	"confidence_average" numeric(3, 2) DEFAULT '0.0',
	"budget_discussions" jsonb DEFAULT '[]'::jsonb,
	"cost_implications" numeric,
	"revenue_impact" numeric,
	"financial_decisions_count" integer DEFAULT 0,
	"delay_risks" jsonb DEFAULT '[]'::jsonb,
	"critical_deadlines" jsonb DEFAULT '[]'::jsonb,
	"timeline_concerns_count" integer DEFAULT 0,
	"relationship_changes" jsonb DEFAULT '[]'::jsonb,
	"performance_issues" jsonb DEFAULT '[]'::jsonb,
	"stakeholder_feedback_count" integer DEFAULT 0,
	"decisions_made" jsonb DEFAULT '[]'::jsonb,
	"competitive_intel" jsonb DEFAULT '[]'::jsonb,
	"strategic_pivots" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "fm_sections" (
	"id" varchar PRIMARY KEY NOT NULL,
	"number" varchar NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"sort_key" integer NOT NULL,
	"parent_id" varchar,
	"page_start" integer NOT NULL,
	"page_end" integer NOT NULL,
	"section_path" text[],
	"breadcrumb_display" text[],
	"is_visible" boolean DEFAULT true,
	"section_type" varchar DEFAULT 'section',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "fm_sections_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "fm_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "asrs_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"sort_key" integer NOT NULL,
	CONSTRAINT "asrs_sections_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fm_blocks" (
	"id" varchar PRIMARY KEY NOT NULL,
	"section_id" varchar NOT NULL,
	"block_type" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"source_text" text NOT NULL,
	"html" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"page_reference" integer,
	"inline_figures" integer[],
	"inline_tables" text[],
	"search_vector" "tsvector",
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fm_blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "asrs_protection_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"asrs_type" text,
	"container_wall" text,
	"container_material" text,
	"container_top" text,
	"commodity_class" text,
	"ceiling_height_min" numeric,
	"ceiling_height_max" numeric,
	"sprinkler_scheme" text,
	"k_factor" numeric,
	"density_gpm_ft2" numeric,
	"area_ft2" numeric,
	"pressure_psi" numeric,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "asrs_protection_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "block_embeddings" (
	"block_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"access" text NOT NULL,
	"permissions" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_members_project_id_user_id_key" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(100) NOT NULL,
	"permissions" jsonb,
	"assigned_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_users_project_id_user_id_key" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"section_number" varchar(50) NOT NULL,
	"section_title" varchar(255) NOT NULL,
	"division" varchar(50),
	"specification_type" varchar(50) DEFAULT 'csi',
	"document_url" text,
	"content" text,
	"requirements" jsonb,
	"keywords" text[],
	"ai_summary" text,
	"version" varchar(50) DEFAULT '1.0',
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "specifications_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'superseded'::character varying, 'archived'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "contacts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"birthday" text,
	"notes" text,
	"job_title" text,
	"department" text,
	"projects" text[] DEFAULT '{""}',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"type" text,
	"company_id" uuid,
	"company_name" text
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chat_history_role_check" CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))
);
--> statement-breakpoint
ALTER TABLE "chat_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "processing_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'queued',
	"priority" integer DEFAULT 5,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"error_message" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "processing_queue_job_type_check" CHECK (job_type = ANY (ARRAY['chunk'::text, 'embed'::text, 'index'::text])),
	CONSTRAINT "processing_queue_status_check" CHECK (status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text]))
);
--> statement-breakpoint
ALTER TABLE "processing_queue" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_line_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_line_id" uuid NOT NULL,
	"project_id" bigint NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_type" text NOT NULL,
	"notes" text,
	CONSTRAINT "budget_line_history_change_type_check" CHECK (change_type = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text]))
);
--> statement-breakpoint
ALTER TABLE "budget_line_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submittal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"required_documents" text[],
	"review_criteria" jsonb,
	"ai_analysis_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "submittal_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "initiatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"status" text DEFAULT 'active',
	"priority" text DEFAULT 'medium',
	"completion_percentage" integer DEFAULT 0,
	"owner" text,
	"team_members" text[],
	"stakeholders" text[],
	"start_date" date,
	"target_completion" date,
	"actual_completion" date,
	"keywords" text[],
	"aliases" text[],
	"budget" numeric,
	"budget_used" numeric DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"notes" text,
	"documentation_links" text[],
	"related_project_ids" integer[],
	CONSTRAINT "initiatives_name_key" UNIQUE("name"),
	CONSTRAINT "initiatives_category_check" CHECK (category = ANY (ARRAY['hiring'::text, 'operations'::text, 'process_improvement'::text, 'training'::text, 'technology'::text, 'compliance'::text, 'marketing'::text, 'finance'::text, 'other'::text])),
	CONSTRAINT "initiatives_completion_percentage_check" CHECK ((completion_percentage >= 0) AND (completion_percentage <= 100)),
	CONSTRAINT "initiatives_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
	CONSTRAINT "initiatives_status_check" CHECK (status = ANY (ARRAY['active'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
CREATE TABLE "contract_payments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"contract_id" uuid NOT NULL,
	"billing_period_id" uuid,
	"payment_number" text NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"payment_type" text DEFAULT 'progress' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"check_number" text,
	"reference_number" text,
	"approved_by" uuid,
	"approved_date" date,
	"paid_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_payments_contract_id_payment_number_key" UNIQUE("contract_id","payment_number"),
	CONSTRAINT "contract_payments_amount_check" CHECK (amount > (0)::numeric),
	CONSTRAINT "contract_payments_payment_type_check" CHECK (payment_type = ANY (ARRAY['progress'::text, 'retention'::text, 'final'::text, 'advance'::text])),
	CONSTRAINT "contract_payments_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])),
	CONSTRAINT "valid_approval_date" CHECK (((status = ANY (ARRAY['approved'::text, 'paid'::text])) AND (approved_date IS NOT NULL) AND (approved_by IS NOT NULL)) OR (status = ANY (ARRAY['pending'::text, 'cancelled'::text]))),
	CONSTRAINT "valid_paid_date" CHECK (((status = 'paid'::text) AND (paid_date IS NOT NULL)) OR (status = ANY (ARRAY['pending'::text, 'approved'::text, 'cancelled'::text])))
);
--> statement-breakpoint
ALTER TABLE "contract_payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contract_billing_periods" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"contract_id" uuid NOT NULL,
	"period_number" integer NOT NULL,
	"billing_date" date NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"work_completed" numeric(15, 2) DEFAULT '0' NOT NULL,
	"stored_materials" numeric(15, 2) DEFAULT '0' NOT NULL,
	"current_payment_due" numeric(15, 2) GENERATED ALWAYS AS ((work_completed + stored_materials)) STORED,
	"retention_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"retention_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"net_payment_due" numeric(15, 2) GENERATED ALWAYS AS (((work_completed + stored_materials) - retention_amount)) STORED,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_billing_periods_contract_id_period_number_key" UNIQUE("contract_id","period_number"),
	CONSTRAINT "contract_billing_periods_retention_amount_check" CHECK (retention_amount >= (0)::numeric),
	CONSTRAINT "contract_billing_periods_retention_percentage_check" CHECK ((retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)),
	CONSTRAINT "contract_billing_periods_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'paid'::text])),
	CONSTRAINT "contract_billing_periods_stored_materials_check" CHECK (stored_materials >= (0)::numeric),
	CONSTRAINT "contract_billing_periods_work_completed_check" CHECK (work_completed >= (0)::numeric),
	CONSTRAINT "valid_billing_date" CHECK (billing_date >= start_date),
	CONSTRAINT "valid_date_range" CHECK (start_date <= end_date)
);
--> statement-breakpoint
ALTER TABLE "contract_billing_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "risks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"metadata_id" text NOT NULL,
	"segment_id" uuid,
	"source_chunk_id" uuid,
	"description" text NOT NULL,
	"category" text,
	"likelihood" text,
	"impact" text,
	"owner_name" text,
	"owner_email" text,
	"project_id" bigint,
	"client_id" bigint,
	"mitigation_plan" text,
	"status" text DEFAULT 'open' NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_ids" integer[] DEFAULT '{}',
	CONSTRAINT "risks_metadata_id_description_key" UNIQUE("metadata_id","description"),
	CONSTRAINT "risks_impact_check" CHECK (impact = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
	CONSTRAINT "risks_likelihood_check" CHECK (likelihood = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
	CONSTRAINT "risks_status_check" CHECK (status = ANY (ARRAY['open'::text, 'mitigated'::text, 'closed'::text, 'occurred'::text]))
);
--> statement-breakpoint
CREATE TABLE "submittals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"specification_id" uuid,
	"submittal_type_id" uuid NOT NULL,
	"submittal_number" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"submitted_by" uuid NOT NULL,
	"submitter_company" varchar(255),
	"submission_date" timestamp with time zone DEFAULT now(),
	"required_approval_date" date,
	"priority" varchar(50) DEFAULT 'normal',
	"status" varchar(50) DEFAULT 'submitted',
	"current_version" integer DEFAULT 1,
	"total_versions" integer DEFAULT 1,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "submittals_project_id_submittal_number_key" UNIQUE("project_id","submittal_number"),
	CONSTRAINT "submittals_priority_check" CHECK ((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'critical'::character varying])::text[])),
	CONSTRAINT "submittals_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'under_review'::character varying, 'requires_revision'::character varying, 'approved'::character varying, 'rejected'::character varying, 'superseded'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "submittals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subcontractors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"legal_business_name" text,
	"dba_name" text,
	"company_type" text,
	"tax_id" text,
	"primary_contact_name" text NOT NULL,
	"primary_contact_title" text,
	"primary_contact_email" text,
	"primary_contact_phone" text,
	"secondary_contact_name" text,
	"secondary_contact_email" text,
	"secondary_contact_phone" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state_province" text,
	"postal_code" text,
	"country" text DEFAULT 'United States',
	"specialties" text[],
	"service_areas" text[],
	"years_in_business" integer,
	"employee_count" integer,
	"annual_revenue_range" text,
	"asrs_experience_years" integer,
	"fm_global_certified" boolean DEFAULT false,
	"nfpa_certifications" text[],
	"sprinkler_contractor_license" text,
	"license_expiration_date" date,
	"max_project_size" text,
	"concurrent_projects_capacity" integer,
	"preferred_project_types" text[],
	"insurance_general_liability" numeric(12, 2),
	"insurance_professional_liability" numeric(12, 2),
	"insurance_workers_comp" boolean DEFAULT false,
	"bonding_capacity" numeric(12, 2),
	"credit_rating" text,
	"alleato_projects_completed" integer DEFAULT 0,
	"avg_project_rating" numeric(3, 2),
	"on_time_completion_rate" numeric(5, 2),
	"safety_incident_rate" numeric(5, 2),
	"preferred_payment_terms" text,
	"markup_percentage" numeric(5, 2),
	"hourly_rates_range" text,
	"travel_radius_miles" integer,
	"project_management_software" text[],
	"cad_software_proficiency" text[],
	"bim_capabilities" boolean DEFAULT false,
	"digital_collaboration_tools" text[],
	"osha_training_current" boolean DEFAULT false,
	"drug_testing_program" boolean DEFAULT false,
	"background_check_policy" boolean DEFAULT false,
	"quality_certifications" text[],
	"status" text DEFAULT 'active',
	"tier_level" text,
	"preferred_vendor" boolean DEFAULT false,
	"master_agreement_signed" boolean DEFAULT false,
	"master_agreement_date" date,
	"internal_notes" text,
	"strengths" text[],
	"weaknesses" text[],
	"special_requirements" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	CONSTRAINT "subcontractors_annual_revenue_range_check" CHECK (annual_revenue_range = ANY (ARRAY['under_1m'::text, '1m_5m'::text, '5m_10m'::text, '10m_25m'::text, '25m_plus'::text])),
	CONSTRAINT "subcontractors_avg_project_rating_check" CHECK ((avg_project_rating >= (0)::numeric) AND (avg_project_rating <= (5)::numeric)),
	CONSTRAINT "subcontractors_company_type_check" CHECK (company_type = ANY (ARRAY['corporation'::text, 'llc'::text, 'partnership'::text, 'sole_proprietorship'::text, 'other'::text])),
	CONSTRAINT "subcontractors_credit_rating_check" CHECK (credit_rating = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'unknown'::text])),
	CONSTRAINT "subcontractors_max_project_size_check" CHECK (max_project_size = ANY (ARRAY['under_100k'::text, '100k_500k'::text, '500k_1m'::text, '1m_5m'::text, '5m_plus'::text])),
	CONSTRAINT "subcontractors_on_time_completion_rate_check" CHECK ((on_time_completion_rate >= (0)::numeric) AND (on_time_completion_rate <= (100)::numeric)),
	CONSTRAINT "subcontractors_preferred_payment_terms_check" CHECK (preferred_payment_terms = ANY (ARRAY['net_15'::text, 'net_30'::text, 'net_45'::text, 'net_60'::text, 'progress_billing'::text])),
	CONSTRAINT "subcontractors_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending_approval'::text, 'blacklisted'::text])),
	CONSTRAINT "subcontractors_tier_level_check" CHECK (tier_level = ANY (ARRAY['platinum'::text, 'gold'::text, 'silver'::text, 'bronze'::text, 'unrated'::text]))
);
--> statement-breakpoint
ALTER TABLE "subcontractors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_resources" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "project_resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text,
	"description" text,
	"type" text,
	"project_id" bigint
);
--> statement-breakpoint
ALTER TABLE "project_resources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submittal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submittal_id" uuid NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"document_type" varchar(100),
	"file_url" text NOT NULL,
	"file_size_bytes" bigint,
	"mime_type" varchar(100),
	"page_count" integer,
	"extracted_text" text,
	"ai_analysis" jsonb,
	"version" integer DEFAULT 1,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	"uploaded_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"embedding" vector,
	"url" text,
	"status" text,
	"project_id" integer,
	"title" text,
	"category" text
);
--> statement-breakpoint
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_query" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "asrs_logic_cards" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "asrs_logic_cards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"doc" text DEFAULT 'FMDS0834' NOT NULL,
	"version" text DEFAULT '2024-07' NOT NULL,
	"clause_id" text,
	"page" integer,
	"purpose" text NOT NULL,
	"preconditions" jsonb NOT NULL,
	"inputs" jsonb NOT NULL,
	"decision" jsonb NOT NULL,
	"citations" jsonb NOT NULL,
	"related_table_ids" text[],
	"related_figure_ids" text[],
	"inserted_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"section_id" uuid
);
--> statement-breakpoint
CREATE TABLE "discrepancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submittal_id" uuid NOT NULL,
	"specification_id" uuid,
	"document_id" uuid,
	"discrepancy_type" varchar(100) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"spec_requirement" text,
	"submittal_content" text,
	"suggested_resolution" text,
	"confidence_score" numeric(3, 2),
	"location_in_doc" jsonb,
	"status" varchar(50) DEFAULT 'open',
	"identified_by" varchar(50) DEFAULT 'ai',
	"ai_model_version" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "discrepancies_severity_check" CHECK ((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])),
	CONSTRAINT "discrepancies_status_check" CHECK ((status)::text = ANY ((ARRAY['open'::character varying, 'acknowledged'::character varying, 'resolved'::character varying, 'waived'::character varying, 'disputed'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" text DEFAULT 'team'
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"metadata_id" text NOT NULL,
	"segment_id" uuid,
	"source_chunk_id" uuid,
	"description" text NOT NULL,
	"assignee_name" text,
	"assignee_email" text,
	"project_id" bigint,
	"client_id" bigint,
	"due_date" date,
	"priority" text,
	"status" text DEFAULT 'open' NOT NULL,
	"source_system" text DEFAULT 'fireflies' NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_ids" integer[] DEFAULT '{}',
	CONSTRAINT "tasks_metadata_id_description_key" UNIQUE("metadata_id","description"),
	CONSTRAINT "tasks_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
	CONSTRAINT "tasks_status_check" CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'blocked'::text, 'done'::text, 'cancelled'::text]))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submittal_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"review_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"decision" varchar(50),
	"comments" text,
	"review_criteria_met" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviews_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'skipped'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"document_id" uuid,
	"discrepancy_id" uuid,
	"comment_type" varchar(50) DEFAULT 'general',
	"comment" text NOT NULL,
	"location_in_doc" jsonb,
	"priority" varchar(50) DEFAULT 'normal',
	"status" varchar(50) DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid NOT NULL,
	CONSTRAINT "review_comments_priority_check" CHECK ((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying])::text[])),
	CONSTRAINT "review_comments_status_check" CHECK ((status)::text = ANY ((ARRAY['open'::character varying, 'addressed'::character varying, 'resolved'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone,
	"username" text,
	"full_name" text,
	"avatar_url" text,
	"website" text,
	CONSTRAINT "profiles_username_key" UNIQUE("username"),
	CONSTRAINT "username_length" CHECK (char_length(username) >= 3)
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_analysis_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submittal_id" uuid NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'queued',
	"model_version" varchar(50),
	"config" jsonb,
	"input_data" jsonb,
	"results" jsonb,
	"confidence_metrics" jsonb,
	"processing_time_ms" integer,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_analysis_jobs_status_check" CHECK ((status)::text = ANY ((ARRAY['queued'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "nods_page_section" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"page_id" bigint NOT NULL,
	"content" text,
	"token_count" integer,
	"embedding" vector(1536),
	"slug" text,
	"heading" text
);
--> statement-breakpoint
ALTER TABLE "nods_page_section" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "__drizzle_migrations" (
	"hash" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submittal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submittal_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"actor_id" uuid,
	"actor_type" varchar(50) DEFAULT 'user',
	"description" text,
	"previous_status" varchar(50),
	"new_status" varchar(50),
	"changes" jsonb,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submittal_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" integer,
	"submittal_id" uuid,
	"notification_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"priority" varchar(50) DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"delivery_methods" text[] DEFAULT '{"RAY['in_app'::tex"}',
	"scheduled_for" timestamp with time zone DEFAULT now(),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "submittal_notifications_priority_check" CHECK ((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chat_messages_role_check" CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"model_type" varchar(100) NOT NULL,
	"description" text,
	"config" jsonb,
	"performance_metrics" jsonb,
	"is_active" boolean DEFAULT true,
	"deployment_date" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_models_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'US',
	"tax_id" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_company_id_name_key" UNIQUE("company_id","name")
);
--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contract_views" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"view_name" text NOT NULL,
	"description" text,
	"filters" jsonb,
	"columns" jsonb,
	"sort_order" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_views_user_id_view_name_key" UNIQUE("user_id","view_name")
);
--> statement-breakpoint
ALTER TABLE "contract_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contract_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"contract_id" uuid NOT NULL,
	"snapshot_date" timestamp with time zone DEFAULT now() NOT NULL,
	"snapshot_data" jsonb NOT NULL,
	"created_by" uuid,
	"reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contract_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contract_documents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"contract_id" uuid NOT NULL,
	"document_name" text NOT NULL,
	"document_type" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint,
	"mime_type" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_current_version" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_documents_document_type_check" CHECK (document_type = ANY (ARRAY['contract'::text, 'amendment'::text, 'insurance'::text, 'bond'::text, 'lien_waiver'::text, 'change_order'::text, 'invoice'::text, 'other'::text]))
);
--> statement-breakpoint
ALTER TABLE "contract_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submittal_analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"project_id" integer,
	"submittal_id" uuid,
	"user_id" uuid,
	"event_data" jsonb,
	"session_id" varchar(255),
	"ip_address" "inet",
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"title" text,
	"source" text,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"file_id" text NOT NULL,
	"fireflies_id" text,
	"processing_status" varchar(20) DEFAULT 'pending',
	"project_id" bigint,
	"project" text,
	"file_date" timestamp with time zone,
	"embedding" vector,
	"url" text,
	"storage_object_id" uuid,
	"project_ids" integer[] DEFAULT '{}'
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submittal_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer,
	"metric_type" varchar(100) NOT NULL,
	"metric_name" varchar(255) NOT NULL,
	"value" numeric(10, 4),
	"unit" varchar(50),
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"metadata" jsonb,
	"calculated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fm_global_figures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"figure_number" integer NOT NULL,
	"title" text NOT NULL,
	"clean_caption" text NOT NULL,
	"normalized_summary" text NOT NULL,
	"figure_type" text NOT NULL,
	"asrs_type" text NOT NULL,
	"container_type" text,
	"max_depth_ft" numeric,
	"max_depth_m" numeric,
	"max_spacing_ft" numeric,
	"max_spacing_m" numeric,
	"ceiling_height_ft" numeric,
	"aisle_width_ft" numeric,
	"related_tables" integer[],
	"applicable_commodities" text[],
	"system_requirements" jsonb,
	"special_conditions" text[],
	"machine_readable_claims" jsonb,
	"callouts_labels" text[],
	"axis_titles" text[],
	"axis_units" text[],
	"embedded_tables" jsonb,
	"footnotes" text[],
	"page_number" integer,
	"section_reference" text,
	"embedding" vector(1536),
	"search_keywords" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"section_references" text[],
	"image" text,
	CONSTRAINT "fm_global_figures_figure_number_key" UNIQUE("figure_number"),
	CONSTRAINT "fm_global_figures_asrs_type_check" CHECK (asrs_type = ANY (ARRAY['All'::text, 'Shuttle'::text, 'Mini-Load'::text, 'Top-Loading'::text, 'Vertically-Enclosed'::text])),
	CONSTRAINT "fm_global_figures_container_type_check" CHECK (container_type = ANY (ARRAY['Closed-Top'::text, 'Open-Top'::text, 'Noncombustible'::text, 'Plastic'::text, 'Mixed'::text])),
	CONSTRAINT "fm_global_figures_figure_type_check" CHECK (figure_type = ANY (ARRAY['Navigation/Decision Tree'::text, 'System Diagram'::text, 'Sprinkler Layout'::text, 'Protection Scheme'::text, 'Configuration'::text, 'Installation Detail'::text, 'Special Arrangement'::text]))
);
--> statement-breakpoint
ALTER TABLE "fm_global_figures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_briefings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" bigint NOT NULL,
	"briefing_content" text NOT NULL,
	"briefing_type" varchar(50) DEFAULT 'executive_summary',
	"source_documents" text[] NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by" varchar(100),
	"token_count" integer,
	"version" integer DEFAULT 1,
	CONSTRAINT "unique_latest_briefing" UNIQUE("project_id","version")
);
--> statement-breakpoint
CREATE TABLE "budget_modification_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"budget_modification_id" uuid NOT NULL,
	"budget_line_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_modification_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commitment_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"commitment_id" uuid NOT NULL,
	"budget_line_id" uuid,
	"cost_code_id" text,
	"cost_type_id" uuid,
	"description" text,
	"quantity" numeric(15, 4),
	"unit_of_measure" text,
	"unit_cost" numeric(15, 4),
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commitment_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "briefing_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"briefing_id" uuid,
	"project_id" bigint,
	"started_at" timestamp with time zone DEFAULT now(),
	"finished_at" timestamp with time zone,
	"status" text,
	"token_usage" jsonb,
	"input_doc_ids" text[],
	"error" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "clients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"company_id" uuid,
	"status" text,
	"code" text
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subcontractor_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcontractor_id" uuid,
	"name" text NOT NULL,
	"title" text,
	"email" text,
	"phone" text,
	"mobile_phone" text,
	"contact_type" text,
	"is_primary" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subcontractor_contacts_contact_type_check" CHECK (contact_type = ANY (ARRAY['primary'::text, 'secondary'::text, 'project_manager'::text, 'estimator'::text, 'safety'::text, 'billing'::text]))
);
--> statement-breakpoint
CREATE TABLE "subcontractor_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcontractor_id" uuid,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"file_url" text,
	"expiration_date" date,
	"is_current" boolean DEFAULT true,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	"uploaded_by" uuid,
	CONSTRAINT "subcontractor_documents_document_type_check" CHECK (document_type = ANY (ARRAY['insurance_certificate'::text, 'license'::text, 'w9'::text, 'master_agreement'::text, 'safety_manual'::text, 'quality_certificate'::text, 'reference_letter'::text, 'other'::text]))
);
--> statement-breakpoint
CREATE TABLE "Prospects" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name ""Prospects_id_seq"" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text,
	"contact" bigint,
	"status" text
);
--> statement-breakpoint
ALTER TABLE "Prospects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"job number" text,
	"start date" date,
	"est completion" date,
	"est revenue" numeric,
	"est profit" numeric,
	"address" text,
	"onedrive" text,
	"phase" text,
	"state" text,
	"client_id" bigint,
	"category" text,
	"aliases" text[] DEFAULT '{""}',
	"team_members" text[] DEFAULT '{""}',
	"current_phase" varchar(100),
	"completion_percentage" integer DEFAULT 0,
	"budget" numeric(12, 2),
	"budget_used" numeric(12, 2) DEFAULT '0',
	"client" text,
	"summary" text,
	"summary_metadata" jsonb DEFAULT '{}'::jsonb,
	"summary_updated_at" timestamp with time zone,
	"health_score" numeric(5, 2),
	"health_status" text,
	"access" text,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_by" uuid,
	"archived_at" timestamp with time zone,
	"erp_system" text,
	"erp_last_job_cost_sync" timestamp with time zone,
	"erp_last_direct_cost_sync" timestamp with time zone,
	"erp_sync_status" text,
	"project_manager" bigint,
	"project_number" varchar(50),
	"stakeholders" jsonb DEFAULT '[]'::jsonb,
	"budget_locked" boolean DEFAULT false,
	"budget_locked_at" timestamp with time zone,
	"budget_locked_by" uuid,
	"work_scope" text,
	"project_sector" text,
	"delivery_method" text,
	"name_code" text,
	"type" text,
	CONSTRAINT "projects_delivery_method_check" CHECK ((delivery_method IS NULL) OR (delivery_method = ANY (ARRAY['Design-Bid-Build'::text, 'Design-Build'::text, 'Construction Management at Risk'::text, 'Integrated Project Delivery'::text]))),
	CONSTRAINT "projects_health_status_check" CHECK (health_status = ANY (ARRAY['Healthy'::text, 'At Risk'::text, 'Needs Attention'::text, 'Critical'::text])),
	CONSTRAINT "projects_project_sector_check" CHECK ((project_sector IS NULL) OR (project_sector = ANY (ARRAY['Commercial'::text, 'Industrial'::text, 'Infrastructure'::text, 'Healthcare'::text, 'Institutional'::text, 'Residential'::text]))),
	CONSTRAINT "projects_work_scope_check" CHECK ((work_scope IS NULL) OR (work_scope = ANY (ARRAY['Ground-Up Construction'::text, 'Renovation'::text, 'Tenant Improvement'::text, 'Interior Build-Out'::text, 'Maintenance'::text])))
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fm_sprinkler_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" text NOT NULL,
	"ceiling_height_ft" numeric NOT NULL,
	"storage_height_ft" numeric,
	"aisle_width_ft" numeric,
	"sprinkler_count" integer,
	"k_factor" numeric,
	"k_factor_type" text,
	"pressure_psi" numeric,
	"pressure_bar" numeric,
	"orientation" text,
	"response_type" text,
	"temperature_rating" integer,
	"design_area_sqft" numeric,
	"spacing_ft" numeric,
	"coverage_type" text,
	"special_conditions" text[],
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fm_cost_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_type" text NOT NULL,
	"factor_name" text NOT NULL,
	"base_cost_per_unit" numeric,
	"unit_type" text,
	"complexity_multiplier" numeric DEFAULT '1.0',
	"region_adjustments" jsonb DEFAULT '{}'::jsonb,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fm_optimization_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"trigger_conditions" jsonb,
	"suggested_changes" jsonb,
	"estimated_savings_min" numeric,
	"estimated_savings_max" numeric,
	"implementation_difficulty" text,
	"is_active" boolean DEFAULT true,
	"priority_level" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"messageId" varchar NOT NULL,
	"type" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"text_text" text,
	"reasoning_text" text,
	"file_mediaType" varchar,
	"file_filename" varchar,
	"file_url" varchar,
	"source_url_sourceId" varchar,
	"source_url_url" varchar,
	"source_url_title" varchar,
	"source_document_sourceId" varchar,
	"source_document_mediaType" varchar,
	"source_document_title" varchar,
	"source_document_filename" varchar,
	"tool_toolCallId" varchar,
	"tool_state" varchar,
	"tool_errorText" varchar,
	"tool_getWeatherInformation_input" jsonb,
	"tool_getWeatherInformation_output" jsonb,
	"tool_getLocation_input" jsonb,
	"tool_getLocation_output" jsonb,
	"data_weather_id" varchar,
	"data_weather_location" varchar,
	"data_weather_weather" varchar,
	"data_weather_temperature" real,
	"providerMetadata" jsonb,
	CONSTRAINT "data_weather_fields_required" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'data-weather'::text) THEN ((data_weather_location IS NOT NULL) AND (data_weather_weather IS NOT NULL) AND (data_weather_temperature IS NOT NULL))
    ELSE true
END)),
	CONSTRAINT "file_fields_required_if_type_is_file" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'file'::text) THEN (("file_mediaType" IS NOT NULL) AND (file_url IS NOT NULL))
    ELSE true
END)),
	CONSTRAINT "reasoning_text_required_if_type_is_reasoning" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'reasoning'::text) THEN (reasoning_text IS NOT NULL)
    ELSE true
END)),
	CONSTRAINT "source_document_fields_required_if_type_is_source_document" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'source_document'::text) THEN (("source_document_sourceId" IS NOT NULL) AND ("source_document_mediaType" IS NOT NULL) AND (source_document_title IS NOT NULL))
    ELSE true
END)),
	CONSTRAINT "source_url_fields_required_if_type_is_source_url" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'source_url'::text) THEN (("source_url_sourceId" IS NOT NULL) AND (source_url_url IS NOT NULL))
    ELSE true
END)),
	CONSTRAINT "text_text_required_if_type_is_text" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'text'::text) THEN (text_text IS NOT NULL)
    ELSE true
END)),
	CONSTRAINT "tool_getLocation_fields_required" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'tool-getLocation'::text) THEN (("tool_toolCallId" IS NOT NULL) AND (tool_state IS NOT NULL))
    ELSE true
END)),
	CONSTRAINT "tool_getWeatherInformation_fields_required" CHECK (CHECK (
CASE
    WHEN ((type)::text = 'tool-getWeatherInformation'::text) THEN (("tool_toolCallId" IS NOT NULL) AND (tool_state IS NOT NULL))
    ELSE true
END))
);
--> statement-breakpoint
CREATE TABLE "asrs_decision_matrix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asrs_type" text NOT NULL,
	"container_type" text NOT NULL,
	"max_depth_ft" double precision NOT NULL,
	"max_spacing_ft" double precision NOT NULL,
	"figure_number" integer NOT NULL,
	"sprinkler_count" integer NOT NULL,
	"sprinkler_numbering" text,
	"page_number" integer NOT NULL,
	"title" text,
	"requires_flue_spaces" boolean DEFAULT false,
	"requires_vertical_barriers" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "asrs_decision_matrix_asrs_type_container_type_max_depth_ft__key" UNIQUE("asrs_type","container_type","max_depth_ft","max_spacing_ft")
);
--> statement-breakpoint
CREATE TABLE "asrs_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"block_type" text NOT NULL,
	"source_text" text,
	"html" text,
	"meta" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "asrs_blocks_block_type_check" CHECK (block_type = ANY (ARRAY['paragraph'::text, 'note'::text, 'table'::text, 'figure'::text, 'equation'::text, 'heading'::text]))
);
--> statement-breakpoint
CREATE TABLE "commitment_change_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"commitment_change_order_id" uuid NOT NULL,
	"budget_line_id" uuid,
	"cost_code_id" text,
	"cost_type_id" uuid,
	"description" text,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commitment_change_order_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commitment_change_orders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"commitment_id" uuid NOT NULL,
	"change_order_number" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" uuid,
	"requested_date" date DEFAULT CURRENT_DATE NOT NULL,
	"approved_by" uuid,
	"approved_date" date,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commitment_change_orders_commitment_id_change_order_number_key" UNIQUE("commitment_id","change_order_number"),
	CONSTRAINT "commitment_change_orders_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'pending_review'::text, 'approved'::text, 'rejected'::text]))
);
--> statement-breakpoint
ALTER TABLE "commitment_change_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "qto_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"qto_id" bigint NOT NULL,
	"project_id" bigint NOT NULL,
	"cost_code" text,
	"division" text,
	"item_code" text,
	"description" text,
	"unit" text,
	"quantity" numeric DEFAULT '0',
	"unit_cost" numeric DEFAULT '0',
	"extended_cost" numeric GENERATED ALWAYS AS ((quantity * unit_cost)) STORED,
	"source_reference" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project_id" bigint NOT NULL,
	"co_number" text,
	"title" text,
	"description" text,
	"status" text DEFAULT 'proposed',
	"submitted_by" uuid DEFAULT auth.uid(),
	"submitted_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"apply_vertical_markup" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "qtos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project_id" bigint NOT NULL,
	"title" text,
	"version" integer DEFAULT 1,
	"created_by" uuid DEFAULT auth.uid(),
	"created_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	"status" text DEFAULT 'draft'
);
--> statement-breakpoint
CREATE TABLE "change_order_costs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"change_order_id" bigint NOT NULL,
	"labor" numeric DEFAULT '0',
	"materials" numeric DEFAULT '0',
	"subcontractor" numeric DEFAULT '0',
	"overhead" numeric DEFAULT '0',
	"contingency" numeric DEFAULT '0',
	"total_cost" numeric GENERATED ALWAYS AS (((((labor + materials) + subcontractor) + overhead) + contingency)) STORED,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_order_approvals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"change_order_id" bigint NOT NULL,
	"approver" uuid,
	"role" text,
	"decision" text,
	"comment" text,
	"decided_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint,
	"attached_to_table" text,
	"attached_to_id" text,
	"file_name" text,
	"url" text,
	"uploaded_by" uuid DEFAULT auth.uid(),
	"uploaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_tasks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"schedule_id" bigint NOT NULL,
	"project_id" bigint NOT NULL,
	"parent_task_id" bigint,
	"name" text NOT NULL,
	"description" text,
	"task_type" text,
	"sequence" integer DEFAULT 0,
	"start_date" date,
	"finish_date" date,
	"duration_days" integer,
	"percent_complete" numeric(5, 2) DEFAULT '0',
	"float_order" numeric DEFAULT '0',
	"predecessor_ids" text,
	"created_by" uuid DEFAULT auth.uid(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_task_dependencies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"task_id" bigint NOT NULL,
	"predecessor_task_id" bigint NOT NULL,
	"dependency_type" text DEFAULT 'FS'
);
--> statement-breakpoint
CREATE TABLE "schedule_resources" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"task_id" bigint NOT NULL,
	"resource_id" uuid,
	"resource_type" text,
	"role" text,
	"units" numeric,
	"unit_type" text,
	"rate" numeric,
	"cost" numeric GENERATED ALWAYS AS ((units * rate)) STORED,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_progress_updates" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"task_id" bigint NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now(),
	"percent_complete" numeric(5, 2),
	"actual_start" date,
	"actual_finish" date,
	"actual_hours" numeric,
	"notes" text,
	"reported_by" uuid DEFAULT auth.uid()
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"company_name" text NOT NULL,
	"contact_name" text,
	"contact_title" text,
	"contact_email" text,
	"contact_phone" text,
	"lead_source" text,
	"referral_contact" text,
	"industry" text,
	"project_type" text,
	"estimated_project_value" numeric(14, 2),
	"estimated_start_date" date,
	"status" text DEFAULT 'New',
	"probability" integer DEFAULT 0,
	"next_follow_up" date,
	"last_contacted" timestamp with time zone,
	"assigned_to" text,
	"notes" text,
	"tags" text[],
	"client_id" bigint,
	"project_id" bigint,
	"ai_summary" text,
	"ai_score" numeric(5, 2),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "prospects_probability_check" CHECK ((probability >= 0) AND (probability <= 100))
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"metadata_id" text NOT NULL,
	"segment_id" uuid,
	"source_chunk_id" uuid,
	"description" text NOT NULL,
	"rationale" text,
	"owner_name" text,
	"owner_email" text,
	"project_id" bigint,
	"client_id" bigint,
	"effective_date" date,
	"impact" text,
	"status" text DEFAULT 'active' NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_ids" integer[] DEFAULT '{}',
	CONSTRAINT "decisions_metadata_id_description_key" UNIQUE("metadata_id","description"),
	CONSTRAINT "decisions_status_check" CHECK (status = ANY (ARRAY['active'::text, 'superseded'::text, 'reversed'::text]))
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"metadata_id" text NOT NULL,
	"segment_id" uuid,
	"source_chunk_id" uuid,
	"description" text NOT NULL,
	"type" text,
	"owner_name" text,
	"owner_email" text,
	"project_id" bigint,
	"client_id" bigint,
	"next_step" text,
	"status" text DEFAULT 'open' NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_ids" integer[] DEFAULT '{}',
	CONSTRAINT "opportunities_metadata_id_description_key" UNIQUE("metadata_id","description"),
	CONSTRAINT "opportunities_status_check" CHECK (status = ANY (ARRAY['open'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'implemented'::text]))
);
--> statement-breakpoint
CREATE TABLE "procore_screenshots" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"session_id" uuid,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"source_url" text,
	"page_title" text,
	"fullpage_path" text,
	"viewport_path" text,
	"fullpage_storage_path" text,
	"viewport_storage_path" text,
	"viewport_width" integer,
	"viewport_height" integer,
	"fullpage_height" integer,
	"file_size_bytes" integer,
	"description" text,
	"detected_components" jsonb DEFAULT '[]'::jsonb,
	"color_palette" jsonb DEFAULT '[]'::jsonb,
	"ai_analysis" jsonb,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"new_url" text
);
--> statement-breakpoint
CREATE TABLE "fireflies_ingestion_jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"fireflies_id" text NOT NULL,
	"metadata_id" text,
	"stage" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fireflies_ingestion_jobs_fireflies_id_key" UNIQUE("fireflies_id"),
	CONSTRAINT "fireflies_ingestion_jobs_stage_check" CHECK (stage = ANY (ARRAY['pending'::text, 'raw_ingested'::text, 'segmented'::text, 'chunked'::text, 'embedded'::text, 'structured_extracted'::text, 'done'::text, 'error'::text]))
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" bigint GENERATED BY DEFAULT AS IDENTITY (sequence name "project_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"job_number" text,
	"start_date" date,
	"est_completion" date,
	"est_revenue" numeric,
	"est_profit" numeric,
	"address" text,
	"onedrive" text,
	"phase" text,
	"state" text,
	"client_id" bigint,
	"category" text,
	"team_members" text[] DEFAULT '{""}',
	"completion_percentage" integer DEFAULT 0,
	"budget" numeric(12, 2),
	"budget_used" numeric(12, 2) DEFAULT '0',
	"client" text,
	"summary" text,
	"summary_metadata" jsonb DEFAULT '{}'::jsonb,
	"summary_updated_at" timestamp with time zone,
	"health_score" numeric(5, 2),
	"health_status" text,
	"access" text,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_by" uuid,
	"archived_at" timestamp with time zone,
	"erp_system" text,
	"erp_last_job_cost_sync" timestamp with time zone,
	"erp_last_direct_cost_sync" timestamp with time zone,
	"erp_sync_status" text,
	"project_manager" bigint,
	"type" text,
	"project_number" varchar(50),
	"stakeholders" jsonb DEFAULT '[]'::jsonb,
	"keywords" text[],
	"budget_locked" boolean DEFAULT false,
	"budget_locked_at" timestamp with time zone,
	"budget_locked_by" uuid,
	"work_scope" text,
	"project_sector" text,
	"delivery_method" text,
	"name_code" text,
	CONSTRAINT "projects_delivery_method_check" CHECK ((delivery_method IS NULL) OR (delivery_method = ANY (ARRAY['Design-Bid-Build'::text, 'Design-Build'::text, 'Construction Management at Risk'::text, 'Integrated Project Delivery'::text]))),
	CONSTRAINT "projects_health_status_check" CHECK (health_status = ANY (ARRAY['Healthy'::text, 'At Risk'::text, 'Needs Attention'::text, 'Critical'::text])),
	CONSTRAINT "projects_project_sector_check" CHECK ((project_sector IS NULL) OR (project_sector = ANY (ARRAY['Commercial'::text, 'Industrial'::text, 'Infrastructure'::text, 'Healthcare'::text, 'Institutional'::text, 'Residential'::text]))),
	CONSTRAINT "projects_work_scope_check" CHECK ((work_scope IS NULL) OR (work_scope = ANY (ARRAY['Ground-Up Construction'::text, 'Renovation'::text, 'Tenant Improvement'::text, 'Interior Build-Out'::text, 'Maintenance'::text])))
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "procore_capture_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"capture_type" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"total_screenshots" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procore_capture_sessions_capture_type_check" CHECK (capture_type = ANY (ARRAY['public_docs'::text, 'authenticated_app'::text, 'manual'::text])),
	CONSTRAINT "procore_capture_sessions_status_check" CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'failed'::text]))
);
--> statement-breakpoint
CREATE TABLE "procore_components" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"screenshot_id" uuid,
	"component_type" text NOT NULL,
	"component_name" text,
	"x" integer,
	"y" integer,
	"width" integer,
	"height" integer,
	"local_path" text,
	"storage_path" text,
	"styles" jsonb,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawled_pages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"url" varchar NOT NULL,
	"chunk_number" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_id" text NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "crawled_pages_url_chunk_number_key" UNIQUE("url","chunk_number")
);
--> statement-breakpoint
ALTER TABLE "crawled_pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources" (
	"source_id" text PRIMARY KEY NOT NULL,
	"summary" text,
	"total_word_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "procore_modules" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"category" text NOT NULL,
	"app_path" text,
	"docs_url" text,
	"complexity" text,
	"priority" text,
	"estimated_build_weeks" integer,
	"key_features" jsonb DEFAULT '[]'::jsonb,
	"dependencies" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"rebuild_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procore_modules_name_key" UNIQUE("name"),
	CONSTRAINT "procore_modules_complexity_check" CHECK (complexity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'very_high'::text])),
	CONSTRAINT "procore_modules_priority_check" CHECK (priority = ANY (ARRAY['must_have'::text, 'nice_to_have'::text, 'skip'::text]))
);
--> statement-breakpoint
CREATE TABLE "procore_features" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"module_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"include_in_rebuild" boolean DEFAULT true,
	"complexity" text,
	"estimated_hours" integer,
	"ai_enhancement_possible" boolean DEFAULT false,
	"ai_enhancement_notes" text,
	"screenshot_ids" uuid[] DEFAULT '{""}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procore_features_complexity_check" CHECK (complexity = ANY (ARRAY['trivial'::text, 'easy'::text, 'medium'::text, 'hard'::text, 'very_hard'::text]))
);
--> statement-breakpoint
CREATE TABLE "projects_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint,
	"operation" text NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_columns" text[],
	"old_data" jsonb,
	"new_data" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "direct_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"budget_item_id" uuid NOT NULL,
	"vendor_id" uuid,
	"description" text,
	"cost_type" text,
	"amount" numeric(14, 2) NOT NULL,
	"incurred_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "direct_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commitment_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commitment_id" uuid NOT NULL,
	"budget_item_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commitment_changes_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'void'::text]))
);
--> statement-breakpoint
CREATE TABLE "code_examples" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"url" varchar NOT NULL,
	"chunk_number" integer NOT NULL,
	"content" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_id" text NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "code_examples_url_chunk_number_key" UNIQUE("url","chunk_number")
);
--> statement-breakpoint
ALTER TABLE "code_examples" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "forecasting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_item_id" uuid NOT NULL,
	"forecast_to_complete" numeric(14, 2),
	"projected_costs" numeric(14, 2),
	"estimated_completion_cost" numeric(14, 2),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"erp_system" text,
	"last_job_cost_sync" timestamp with time zone,
	"last_direct_cost_sync" timestamp with time zone,
	"sync_status" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prime_contract_sovs" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "prime_contract_sovs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"contract_id" bigint NOT NULL,
	"cost_code" text,
	"description" text,
	"quantity" numeric(14, 2) DEFAULT '1',
	"uom" text,
	"unit_cost" numeric(14, 2) DEFAULT '0',
	"line_amount" numeric(14, 2) GENERATED ALWAYS AS ((quantity * unit_cost)) STORED,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "prime_potential_change_orders" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "prime_potential_change_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"project_id" bigint NOT NULL,
	"contract_id" bigint NOT NULL,
	"change_event_id" bigint,
	"pco_number" text,
	"title" text NOT NULL,
	"status" text,
	"reason" text,
	"scope" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "change_event_line_items" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "change_event_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"change_event_id" bigint NOT NULL,
	"cost_code" text,
	"description" text,
	"quantity" numeric(14, 2),
	"uom" text,
	"unit_cost" numeric(14, 2),
	"rom_amount" numeric(14, 2),
	"final_amount" numeric(14, 2)
);
--> statement-breakpoint
ALTER TABLE "change_event_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "change_events" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "change_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"project_id" bigint NOT NULL,
	"number" text,
	"title" text NOT NULL,
	"reason" text,
	"scope" text,
	"status" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "change_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pco_line_items" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "pco_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"pco_id" bigint NOT NULL,
	"change_event_line_item_id" bigint,
	"cost_code" text,
	"description" text,
	"quantity" numeric(14, 2),
	"uom" text,
	"unit_cost" numeric(14, 2),
	"line_amount" numeric(14, 2) GENERATED ALWAYS AS ((quantity * unit_cost)) STORED
);
--> statement-breakpoint
CREATE TABLE "prime_contract_change_orders" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "prime_contract_change_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"contract_id" bigint NOT NULL,
	"pcco_number" text,
	"title" text NOT NULL,
	"status" text,
	"executed" boolean DEFAULT false,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"total_amount" numeric(14, 2)
);
--> statement-breakpoint
CREATE TABLE "pcco_line_items" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "pcco_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"pcco_id" bigint NOT NULL,
	"pco_id" bigint,
	"cost_code" text,
	"description" text,
	"quantity" numeric(14, 2),
	"uom" text,
	"unit_cost" numeric(14, 2),
	"line_amount" numeric(14, 2) GENERATED ALWAYS AS ((quantity * unit_cost)) STORED
);
--> statement-breakpoint
CREATE TABLE "cost_code_division_updates_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division_id" uuid NOT NULL,
	"new_title" text,
	"updated_count" integer,
	"changed_at" timestamp with time zone DEFAULT now(),
	"changed_by" text
);
--> statement-breakpoint
CREATE TABLE "owner_invoice_line_items" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "owner_invoice_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"invoice_id" bigint NOT NULL,
	"description" text,
	"category" text,
	"approved_amount" numeric(14, 2)
);
--> statement-breakpoint
CREATE TABLE "owner_invoices" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "owner_invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"contract_id" bigint NOT NULL,
	"invoice_number" text,
	"period_start" date,
	"period_end" date,
	"status" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"billing_period_id" uuid
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "payment_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"contract_id" bigint NOT NULL,
	"invoice_id" bigint,
	"payment_date" date NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"method" text,
	"reference_number" text
);
--> statement-breakpoint
CREATE TABLE "rag_pipeline_state" (
	"pipeline_id" text PRIMARY KEY NOT NULL,
	"pipeline_type" text NOT NULL,
	"last_check_time" timestamp,
	"known_files" jsonb,
	"last_run" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rag_pipeline_state" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"session_id" varchar PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_message_at" timestamp with time zone DEFAULT now(),
	"is_archived" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"computed_session_user_id" uuid GENERATED ALWAYS AS ((split_part((session_id)::text, '~'::text, 1))::uuid) STORED,
	"session_id" varchar NOT NULL,
	"message" jsonb NOT NULL,
	"message_data" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"url" text,
	"created_at" timestamp DEFAULT now(),
	"type" text,
	"source" text,
	"content" text,
	"summary" text,
	"participants" text,
	"tags" text,
	"category" text,
	"fireflies_id" text,
	"fireflies_link" text,
	"project_id" bigint,
	"project" text,
	"date" timestamp with time zone,
	"duration_minutes" integer,
	"bullet_points" text,
	"action_items" text,
	"file_id" integer,
	"overview" text,
	"description" text,
	"status" text,
	"access_level" text DEFAULT 'team',
	"captured_at" timestamp with time zone,
	"content_hash" text,
	"participants_array" text[],
	"phase" text DEFAULT 'Current' NOT NULL,
	"audio" text,
	"video" text,
	CONSTRAINT "document_metadata_fireflies_id_unique" UNIQUE("fireflies_id"),
	CONSTRAINT "document_metadata_file_id_key" UNIQUE("file_id")
);
--> statement-breakpoint
ALTER TABLE "document_metadata" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_rows" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_id" text,
	"row_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "project_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"summary" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"severity" text,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_document_ids" text[] DEFAULT '{"RAY"}',
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_thread_items" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"item_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_thread_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text,
	"filename" text,
	"mime_type" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_thread_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" text NOT NULL,
	"item_ids" text[] NOT NULL,
	"feedback" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_thread_attachment_files" (
	"attachment_id" text PRIMARY KEY NOT NULL,
	"storage_path" text NOT NULL,
	"thread_id" text,
	"filename" text,
	"mime_type" text,
	"size_bytes" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"number" integer NOT NULL,
	"subject" text NOT NULL,
	"question" text NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"due_date" date,
	"date_initiated" date,
	"closed_date" date,
	"rfi_manager" text,
	"received_from" text,
	"assignees" text[],
	"distribution_list" text[],
	"ball_in_court" text,
	"responsible_contractor" text,
	"specification" text,
	"location" text,
	"sub_job" text,
	"cost_code" text,
	"rfi_stage" text,
	"schedule_impact" text,
	"cost_impact" text,
	"reference" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rfi_manager_employee_id" bigint,
	"ball_in_court_employee_id" bigint,
	"created_by_employee_id" bigint
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"chunk_id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"text" text NOT NULL,
	"metadata" jsonb,
	"content_hash" text,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "document_chunks_document_id_chunk_index_key" UNIQUE("document_id","chunk_index")
);
--> statement-breakpoint
ALTER TABLE "document_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" text NOT NULL,
	"project_id" integer,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"confidence_score" numeric(3, 2) DEFAULT '0.0',
	"generated_by" text DEFAULT 'llama-3.1-8b' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"doc_title" text,
	"severity" varchar(20),
	"business_impact" text,
	"assignee" text,
	"due_date" date,
	"financial_impact" numeric(12, 2),
	"urgency_indicators" text[],
	"resolved" boolean DEFAULT false,
	"source_meetings" text[],
	"dependencies" text[],
	"stakeholders_affected" text[],
	"exact_quotes" text[],
	"numerical_data" jsonb,
	"critical_path_impact" boolean DEFAULT false,
	"cross_project_impact" integer[],
	"document_date" date,
	"project_name" text,
	CONSTRAINT "document_insights_confidence_score_check" CHECK ((confidence_score >= 0.0) AND (confidence_score <= 1.0)),
	CONSTRAINT "document_insights_severity_check" CHECK ((severity)::text = ANY ((ARRAY['critical'::character varying, 'high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ai_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer,
	"source_document_id" text,
	"title" text NOT NULL,
	"description" text,
	"assignee" text,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" date,
	"created_by" text DEFAULT 'ai' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fireflies_id" text,
	"document_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"content_hash" text,
	"started_at" timestamp with time zone DEFAULT now(),
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "ai_insights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" bigint,
	"insight_type" text,
	"severity" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source_meetings" text,
	"confidence_score" real,
	"resolved" integer DEFAULT 0,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"meeting_id" uuid,
	"meeting_name" text,
	"project_name" text,
	"document_id" uuid,
	"status" text DEFAULT 'open',
	"assigned_to" text,
	"due_date" date,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"resolved_at" timestamp with time zone,
	"business_impact" text,
	"assignee" text,
	"dependencies" jsonb DEFAULT '[]'::jsonb,
	"financial_impact" numeric,
	"timeline_impact_days" integer,
	"stakeholders_affected" text[],
	"exact_quotes" jsonb DEFAULT '[]'::jsonb,
	"numerical_data" jsonb DEFAULT '[]'::jsonb,
	"urgency_indicators" text[],
	"cross_project_impact" integer[],
	"chunks_id" uuid,
	"meeting_date" timestamp with time zone,
	"exact_quotes_text" text,
	CONSTRAINT "ai_insights_id_key" UNIQUE("id"),
	CONSTRAINT "ai_insights_flexible_parent_check" CHECK ((document_id IS NOT NULL) OR (meeting_id IS NOT NULL) OR ((document_id IS NULL) AND (meeting_id IS NULL))),
	CONSTRAINT "ai_insights_insight_type_check" CHECK (insight_type = ANY (ARRAY['action_item'::text, 'decision'::text, 'risk'::text, 'milestone'::text, 'fact'::text, 'blocker'::text, 'dependency'::text, 'budget_update'::text, 'timeline_change'::text, 'stakeholder_feedback'::text, 'technical_debt'::text])),
	CONSTRAINT "ai_insights_severity_check" CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
	CONSTRAINT "ai_insights_status_check" CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_log_equipment" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"daily_log_id" uuid,
	"equipment_name" varchar(255) NOT NULL,
	"hours_operated" numeric(5, 2),
	"hours_idle" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" bigint,
	"log_date" date NOT NULL,
	"weather_conditions" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "daily_logs_project_id_log_date_key" UNIQUE("project_id","log_date")
);
--> statement-breakpoint
CREATE TABLE "daily_log_manpower" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"daily_log_id" uuid,
	"company_id" uuid,
	"trade" varchar(100),
	"workers_count" integer NOT NULL,
	"hours_worked" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_log_notes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"daily_log_id" uuid,
	"category" varchar(100),
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"budget_item_id" uuid,
	"forecast_date" date NOT NULL,
	"forecast_to_complete" numeric(15, 2) NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cost_forecasts_budget_item_id_forecast_date_key" UNIQUE("budget_item_id","forecast_date")
);
--> statement-breakpoint
CREATE TABLE "sub_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_subjob_code" UNIQUE("project_id","code")
);
--> statement-breakpoint
ALTER TABLE "sub_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "direct_cost_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"budget_code_id" uuid,
	"cost_code_id" text,
	"description" text NOT NULL,
	"transaction_date" date NOT NULL,
	"vendor_name" varchar(255),
	"invoice_number" varchar(100),
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"approved" boolean DEFAULT false,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"cost_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "direct_cost_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"address" text,
	"state" text,
	"city" text,
	"title" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"currency_symbol" varchar(10) DEFAULT '$',
	"currency_code" varchar(3) DEFAULT 'USD',
	"type" text
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "forecasting_curves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"curve_type" varchar(50) NOT NULL,
	"description" text,
	"curve_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "forecasting_curves_company_name_unique" UNIQUE("company_id","name"),
	CONSTRAINT "forecasting_curves_curve_type_check" CHECK ((curve_type)::text = ANY ((ARRAY['linear'::character varying, 's_curve'::character varying, 'custom'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "forecasting_curves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "financial_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"company_id" uuid,
	"subcontractor_id" uuid,
	"project_id" bigint,
	"status" varchar(50) DEFAULT 'draft',
	"contract_amount" numeric(15, 2) DEFAULT '0',
	"change_order_amount" numeric(15, 2) DEFAULT '0',
	"revised_amount" numeric(15, 2) GENERATED ALWAYS AS ((contract_amount + change_order_amount)) STORED,
	"start_date" date,
	"end_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "financial_contracts_contract_number_key" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "schedule_of_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" bigint,
	"commitment_id" uuid,
	"status" text DEFAULT 'draft',
	"total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	CONSTRAINT "either_contract_or_commitment" CHECK (((contract_id IS NOT NULL) AND (commitment_id IS NULL)) OR ((contract_id IS NULL) AND (commitment_id IS NOT NULL))),
	CONSTRAINT "schedule_of_values_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'revised'::text]))
);
--> statement-breakpoint
ALTER TABLE "schedule_of_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"role" varchar(50) DEFAULT 'viewer' NOT NULL,
	"avatar_url" varchar(500),
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"name" text,
	CONSTRAINT "app_users_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "app_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_recaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"recap_date" date NOT NULL,
	"date_range_start" date NOT NULL,
	"date_range_end" date NOT NULL,
	"recap_text" text NOT NULL,
	"recap_html" text,
	"meeting_count" integer,
	"project_count" integer,
	"meetings_analyzed" jsonb,
	"risks" jsonb,
	"decisions" jsonb,
	"blockers" jsonb,
	"commitments" jsonb,
	"wins" jsonb,
	"sent_email" boolean DEFAULT false,
	"sent_teams" boolean DEFAULT false,
	"sent_at" timestamp with time zone,
	"recipients" jsonb,
	"generation_time_seconds" double precision,
	"model_used" varchar(50) DEFAULT 'gpt-4o'
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "todos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"task" text,
	"is_complete" boolean DEFAULT false,
	"inserted_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "todos_task_check" CHECK (char_length(task) > 3)
);
--> statement-breakpoint
ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sov_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sov_id" uuid,
	"line_number" integer NOT NULL,
	"description" text NOT NULL,
	"cost_code_id" text,
	"scheduled_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sov_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vertical_markup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint,
	"markup_type" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"calculation_order" integer NOT NULL,
	"compound" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vertical_markup_project_id_markup_type_key" UNIQUE("project_id","markup_type"),
	CONSTRAINT "vertical_markup_markup_type_check" CHECK (markup_type = ANY (ARRAY['insurance'::text, 'bond'::text, 'fee'::text, 'overhead'::text, 'custom'::text])),
	CONSTRAINT "vertical_markup_percentage_check" CHECK ((percentage >= (0)::numeric) AND (percentage <= (100)::numeric))
);
--> statement-breakpoint
ALTER TABLE "vertical_markup" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "contracts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_id" bigint NOT NULL,
	"client_id" bigint NOT NULL,
	"contract_number" text,
	"title" text NOT NULL,
	"status" text,
	"erp_status" text,
	"executed" boolean DEFAULT false,
	"original_contract_amount" numeric(14, 2) DEFAULT '0',
	"approved_change_orders" numeric(14, 2) DEFAULT '0',
	"revised_contract_amount" numeric(14, 2) DEFAULT '0',
	"pending_change_orders" numeric(14, 2) DEFAULT '0',
	"draft_change_orders" numeric(14, 2) DEFAULT '0',
	"invoiced_amount" numeric(14, 2) DEFAULT '0',
	"payments_received" numeric(14, 2) DEFAULT '0',
	"percent_paid" numeric(6, 2) GENERATED ALWAYS AS (
CASE
    WHEN (revised_contract_amount > (0)::numeric) THEN ((payments_received / revised_contract_amount) * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
	"remaining_balance" numeric(14, 2) DEFAULT '0',
	"private" boolean DEFAULT false,
	"attachment_count" integer DEFAULT 0,
	"notes" text,
	"retention_percentage" numeric(5, 2) DEFAULT '0',
	"apply_vertical_markup" boolean DEFAULT true,
	"owner_client_id" integer,
	"contractor_id" integer,
	"architect_engineer_id" integer,
	"description" text,
	"start_date" date,
	"estimated_completion_date" date,
	"substantial_completion_date" date,
	"actual_completion_date" date,
	"signed_contract_received_date" date,
	"contract_termination_date" date,
	"inclusions" text,
	"exclusions" text,
	"default_retainage" numeric(5, 2) DEFAULT '10',
	CONSTRAINT "contracts_default_retainage_check" CHECK ((default_retainage >= (0)::numeric) AND (default_retainage <= (100)::numeric)),
	CONSTRAINT "contracts_retention_percentage_check" CHECK ((retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric))
);
--> statement-breakpoint
CREATE TABLE "cost_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"division_id" uuid NOT NULL,
	"division_title" text,
	"title" text,
	"status" text DEFAULT 'True',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_cost_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"cost_code_id" text NOT NULL,
	"cost_type_id" uuid DEFAULT 'f3f04b56-0bd1-5c8e-a57b-7c46c5b45b18',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_code_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cost_code_types_code_key" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"budget_item_id" uuid NOT NULL,
	"vendor_id" uuid,
	"contract_amount" numeric(14, 2) NOT NULL,
	"status" text,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_percentage" numeric(5, 2) DEFAULT '0',
	CONSTRAINT "commitments_retention_percentage_check" CHECK ((retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)),
	CONSTRAINT "commitments_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'executed'::text, 'closed'::text, 'approved'::text]))
);
--> statement-breakpoint
ALTER TABLE "commitments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subcontract_sov_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcontract_id" uuid NOT NULL,
	"line_number" integer,
	"change_event_line_item" text,
	"budget_code" text,
	"description" text,
	"amount" numeric(15, 2) DEFAULT '0',
	"billed_to_date" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"sort_order" integer,
	CONSTRAINT "sov_line_number_unique" UNIQUE("subcontract_id","line_number"),
	CONSTRAINT "subcontract_sov_items_amount_check" CHECK (amount >= (0)::numeric),
	CONSTRAINT "subcontract_sov_items_billed_to_date_check" CHECK (billed_to_date >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "subcontract_sov_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subcontracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_number" text NOT NULL,
	"contract_company_id" uuid,
	"title" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"executed" boolean DEFAULT false NOT NULL,
	"default_retainage_percent" numeric(5, 2),
	"description" text,
	"inclusions" text,
	"exclusions" text,
	"start_date" text,
	"estimated_completion_date" text,
	"actual_completion_date" text,
	"contract_date" text,
	"signed_contract_received_date" text,
	"issued_on_date" text,
	"is_private" boolean DEFAULT true,
	"non_admin_user_ids" uuid[] DEFAULT '{""}',
	"allow_non_admin_view_sov_items" boolean DEFAULT false,
	"invoice_contact_ids" uuid[] DEFAULT '{""}',
	"project_id" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "contract_number_project_unique" UNIQUE("contract_number","project_id"),
	CONSTRAINT "subcontracts_default_retainage_percent_check" CHECK ((default_retainage_percent >= (0)::numeric) AND (default_retainage_percent <= (100)::numeric)),
	CONSTRAINT "subcontracts_status_check" CHECK (status = ANY (ARRAY['Draft'::text, 'Sent'::text, 'Pending'::text, 'Approved'::text, 'Executed'::text, 'Closed'::text, 'Void'::text]))
);
--> statement-breakpoint
ALTER TABLE "subcontracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint,
	"company_id" uuid,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_directory_project_id_company_id_role_key" UNIQUE("project_id","company_id","role"),
	CONSTRAINT "project_directory_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'architect'::text, 'engineer'::text, 'subcontractor'::text, 'vendor'::text]))
);
--> statement-breakpoint
ALTER TABLE "project_directory" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prime_contracts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"project_id" bigint NOT NULL,
	"contract_number" text NOT NULL,
	"title" text NOT NULL,
	"vendor_id" uuid,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"original_contract_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"revised_contract_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"retention_percentage" numeric(5, 2) DEFAULT '0',
	"payment_terms" text,
	"billing_schedule" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prime_contracts_project_id_contract_number_key" UNIQUE("project_id","contract_number"),
	CONSTRAINT "prime_contracts_original_contract_value_check" CHECK (original_contract_value >= (0)::numeric),
	CONSTRAINT "prime_contracts_retention_percentage_check" CHECK ((retention_percentage >= (0)::numeric) AND (retention_percentage <= (100)::numeric)),
	CONSTRAINT "prime_contracts_revised_contract_value_check" CHECK (revised_contract_value >= (0)::numeric),
	CONSTRAINT "prime_contracts_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'on_hold'::text])),
	CONSTRAINT "valid_date_range" CHECK ((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date))
);
--> statement-breakpoint
ALTER TABLE "prime_contracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subcontract_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcontract_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint,
	"file_type" text,
	"storage_path" text NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "subcontract_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_system" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "budget_views_project_id_name_key" UNIQUE("project_id","name")
);
--> statement-breakpoint
ALTER TABLE "budget_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_view_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_id" uuid NOT NULL,
	"column_key" varchar(100) NOT NULL,
	"display_name" varchar(255),
	"display_order" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"is_visible" boolean DEFAULT true,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "budget_view_columns_view_id_column_key_key" UNIQUE("view_id","column_key")
);
--> statement-breakpoint
ALTER TABLE "budget_view_columns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contract_line_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"contract_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"description" text NOT NULL,
	"cost_code_id" bigint,
	"quantity" numeric(15, 4) DEFAULT '0',
	"unit_of_measure" text,
	"unit_cost" numeric(15, 2) DEFAULT '0',
	"total_cost" numeric(15, 2) GENERATED ALWAYS AS ((quantity * unit_cost)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_line_items_contract_id_line_number_key" UNIQUE("contract_id","line_number"),
	CONSTRAINT "contract_line_items_quantity_check" CHECK (quantity >= (0)::numeric),
	CONSTRAINT "contract_line_items_unit_cost_check" CHECK (unit_cost >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "contract_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "change_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"change_order_id" bigint NOT NULL,
	"project_id" bigint NOT NULL,
	"sub_job_id" uuid,
	"cost_code_id" text NOT NULL,
	"cost_type_id" uuid NOT NULL,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "change_order_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_mod_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_modification_id" uuid NOT NULL,
	"project_id" bigint NOT NULL,
	"sub_job_id" uuid,
	"cost_code_id" text NOT NULL,
	"cost_type_id" uuid NOT NULL,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_mod_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"sub_job_id" uuid,
	"cost_code_id" text NOT NULL,
	"cost_type_id" uuid NOT NULL,
	"description" text,
	"original_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sub_job_key" uuid GENERATED ALWAYS AS (COALESCE(sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
	"project_budget_code_id" uuid,
	"updated_by" uuid,
	"quantity" numeric(15, 4),
	"unit_of_measure" text,
	"unit_cost" numeric(15, 4),
	"default_ftc_method" varchar(50) DEFAULT 'automatic',
	"default_curve_id" uuid,
	"forecasting_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "uq_budget_line" UNIQUE("project_id","cost_code_id","cost_type_id","sub_job_key"),
	CONSTRAINT "budget_lines_default_ftc_method_check" CHECK ((default_ftc_method)::text = ANY ((ARRAY['manual'::character varying, 'automatic'::character varying, 'lump_sum'::character varying, 'monitored_resources'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "budget_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budget_modifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" bigint NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"effective_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_budget_mod_number" UNIQUE("project_id","number"),
	CONSTRAINT "budget_modifications_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'void'::text]))
);
--> statement-breakpoint
ALTER TABLE "budget_modifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contract_change_orders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"contract_id" uuid NOT NULL,
	"change_order_number" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" uuid,
	"requested_date" date DEFAULT CURRENT_DATE NOT NULL,
	"approved_by" uuid,
	"approved_date" date,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_change_orders_contract_id_change_order_number_key" UNIQUE("contract_id","change_order_number"),
	CONSTRAINT "contract_change_orders_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
	CONSTRAINT "valid_approval_date" CHECK (((status = 'approved'::text) AND (approved_date IS NOT NULL) AND (approved_by IS NOT NULL)) OR ((status = 'rejected'::text) AND (approved_date IS NOT NULL) AND (approved_by IS NOT NULL) AND (rejection_reason IS NOT NULL)) OR (status = 'pending'::text))
);
--> statement-breakpoint
ALTER TABLE "contract_change_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member',
	CONSTRAINT "group_members_pkey" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "document_user_access" (
	"document_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_level" text DEFAULT 'viewer' NOT NULL,
	CONSTRAINT "document_user_access_pkey" PRIMARY KEY("document_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "document_user_access" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_group_access" (
	"document_id" text NOT NULL,
	"group_id" uuid NOT NULL,
	"access_level" text DEFAULT 'viewer' NOT NULL,
	CONSTRAINT "document_group_access_pkey" PRIMARY KEY("document_id","group_id")
);
--> statement-breakpoint
ALTER TABLE "document_group_access" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rfi_assignees" (
	"rfi_id" uuid NOT NULL,
	"employee_id" bigint NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rfi_assignees_pkey" PRIMARY KEY("rfi_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "database_tables_catalog" (
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	"row_count" bigint,
	"rls_enabled" boolean,
	"primary_keys" text,
	"table_comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "database_tables_catalog_pkey" PRIMARY KEY("schema_name","table_name")
);
--> statement-breakpoint
ALTER TABLE "project_budget_codes" ADD CONSTRAINT "project_budget_codes_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_budget_codes" ADD CONSTRAINT "project_budget_codes_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_budget_codes" ADD CONSTRAINT "project_budget_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_budget_codes" ADD CONSTRAINT "project_budget_codes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_budget_codes" ADD CONSTRAINT "project_budget_codes_sub_job_id_fkey" FOREIGN KEY ("sub_job_id") REFERENCES "public"."sub_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_periods" ADD CONSTRAINT "billing_periods_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_periods" ADD CONSTRAINT "billing_periods_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nods_page" ADD CONSTRAINT "nods_page_parent_page_id_fkey" FOREIGN KEY ("parent_page_id") REFERENCES "public"."nods_page"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fm_table_vectors" ADD CONSTRAINT "fm_table_vectors_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."fm_global_tables"("table_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_segments" ADD CONSTRAINT "meeting_segments_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_fkey" FOREIGN KEY ("supervisor") REFERENCES "public"."employees"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fm_optimization_suggestions" ADD CONSTRAINT "fm_optimization_suggestions_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "public"."fm_form_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_recommendations" ADD CONSTRAINT "fk_project_id" FOREIGN KEY ("project_id") REFERENCES "public"."user_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subcontractor_projects" ADD CONSTRAINT "subcontractor_projects_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fm_global_tables" ADD CONSTRAINT "fm_global_tables_figures_fkey" FOREIGN KEY ("figures") REFERENCES "public"."fm_global_figures"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fm_sections" ADD CONSTRAINT "fm_sections_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."fm_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asrs_sections" ADD CONSTRAINT "asrs_sections_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."asrs_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fm_blocks" ADD CONSTRAINT "fm_blocks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."fm_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asrs_protection_rules" ADD CONSTRAINT "asrs_protection_rules_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."asrs_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_embeddings" ADD CONSTRAINT "block_embeddings_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."asrs_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specifications" ADD CONSTRAINT "specifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line_history" ADD CONSTRAINT "budget_line_history_budget_line_id_fkey" FOREIGN KEY ("budget_line_id") REFERENCES "public"."budget_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line_history" ADD CONSTRAINT "budget_line_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line_history" ADD CONSTRAINT "budget_line_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payments" ADD CONSTRAINT "contract_payments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payments" ADD CONSTRAINT "contract_payments_billing_period_id_fkey" FOREIGN KEY ("billing_period_id") REFERENCES "public"."contract_billing_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payments" ADD CONSTRAINT "contract_payments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."prime_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_billing_periods" ADD CONSTRAINT "contract_billing_periods_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."prime_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."meeting_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittals" ADD CONSTRAINT "submittals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittals" ADD CONSTRAINT "submittals_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "public"."specifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittals" ADD CONSTRAINT "submittals_submittal_type_id_fkey" FOREIGN KEY ("submittal_type_id") REFERENCES "public"."submittal_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittals" ADD CONSTRAINT "submittals_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal_documents" ADD CONSTRAINT "submittal_documents_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_documents" ADD CONSTRAINT "submittal_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asrs_logic_cards" ADD CONSTRAINT "asrs_logic_cards_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."asrs_sections"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."submittal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "public"."specifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."meeting_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_discrepancy_id_fkey" FOREIGN KEY ("discrepancy_id") REFERENCES "public"."discrepancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."submittal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis_jobs" ADD CONSTRAINT "ai_analysis_jobs_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nods_page_section" ADD CONSTRAINT "nods_page_section_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."nods_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_history" ADD CONSTRAINT "submittal_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_history" ADD CONSTRAINT "submittal_history_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_notifications" ADD CONSTRAINT "submittal_notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_notifications" ADD CONSTRAINT "submittal_notifications_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_notifications" ADD CONSTRAINT "submittal_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_views" ADD CONSTRAINT "contract_views_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_views" ADD CONSTRAINT "contract_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_snapshots" ADD CONSTRAINT "contract_snapshots_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."prime_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_snapshots" ADD CONSTRAINT "contract_snapshots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."prime_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_analytics_events" ADD CONSTRAINT "submittal_analytics_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_analytics_events" ADD CONSTRAINT "submittal_analytics_events_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submittal_analytics_events" ADD CONSTRAINT "submittal_analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal_performance_metrics" ADD CONSTRAINT "submittal_performance_metrics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_briefings" ADD CONSTRAINT "project_briefings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_modification_lines" ADD CONSTRAINT "budget_modification_lines_budget_line_id_fkey" FOREIGN KEY ("budget_line_id") REFERENCES "public"."budget_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_modification_lines" ADD CONSTRAINT "budget_modification_lines_budget_modification_id_fkey" FOREIGN KEY ("budget_modification_id") REFERENCES "public"."budget_modifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_lines" ADD CONSTRAINT "commitment_lines_budget_line_id_fkey" FOREIGN KEY ("budget_line_id") REFERENCES "public"."budget_lines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_lines" ADD CONSTRAINT "commitment_lines_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "public"."commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_lines" ADD CONSTRAINT "commitment_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_lines" ADD CONSTRAINT "commitment_lines_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "briefing_runs" ADD CONSTRAINT "briefing_runs_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "public"."project_briefings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subcontractor_contacts" ADD CONSTRAINT "subcontractor_contacts_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontractor_documents" ADD CONSTRAINT "subcontractor_documents_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Prospects" ADD CONSTRAINT "Prospects_contact_fkey" FOREIGN KEY ("contact") REFERENCES "public"."contacts"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_budget_locked_by_fkey" FOREIGN KEY ("budget_locked_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_fkey" FOREIGN KEY ("project_manager") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fm_sprinkler_configs" ADD CONSTRAINT "fm_sprinkler_configs_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."fm_global_tables"("table_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asrs_blocks" ADD CONSTRAINT "asrs_blocks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."asrs_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_order_lines" ADD CONSTRAINT "commitment_change_order_lines_budget_line_id_fkey" FOREIGN KEY ("budget_line_id") REFERENCES "public"."budget_lines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_order_lines" ADD CONSTRAINT "commitment_change_order_lines_commitment_change_order_id_fkey" FOREIGN KEY ("commitment_change_order_id") REFERENCES "public"."commitment_change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_order_lines" ADD CONSTRAINT "commitment_change_order_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_order_lines" ADD CONSTRAINT "commitment_change_order_lines_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_orders" ADD CONSTRAINT "commitment_change_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_orders" ADD CONSTRAINT "commitment_change_orders_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "public"."commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_change_orders" ADD CONSTRAINT "commitment_change_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qto_items" ADD CONSTRAINT "qto_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qto_items" ADD CONSTRAINT "qto_items_qto_id_fkey" FOREIGN KEY ("qto_id") REFERENCES "public"."qtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qtos" ADD CONSTRAINT "qtos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_costs" ADD CONSTRAINT "change_order_costs_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "public"."change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_approvals" ADD CONSTRAINT "change_order_approvals_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "public"."change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_tasks" ADD CONSTRAINT "schedule_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_task_dependencies" ADD CONSTRAINT "schedule_task_dependencies_predecessor_task_id_fkey" FOREIGN KEY ("predecessor_task_id") REFERENCES "public"."schedule_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_task_dependencies" ADD CONSTRAINT "schedule_task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."schedule_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_resources" ADD CONSTRAINT "schedule_resources_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."schedule_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_progress_updates" ADD CONSTRAINT "schedule_progress_updates_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."schedule_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."meeting_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."meeting_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procore_screenshots" ADD CONSTRAINT "procore_screenshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."procore_capture_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fireflies_ingestion_jobs" ADD CONSTRAINT "fireflies_ingestion_jobs_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."document_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "projects_budget_locked_by_fkey" FOREIGN KEY ("budget_locked_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "projects_project_manager_fkey" FOREIGN KEY ("project_manager") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procore_components" ADD CONSTRAINT "procore_components_screenshot_id_fkey" FOREIGN KEY ("screenshot_id") REFERENCES "public"."procore_screenshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawled_pages" ADD CONSTRAINT "crawled_pages_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procore_features" ADD CONSTRAINT "procore_features_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."procore_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_costs" ADD CONSTRAINT "direct_costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_changes" ADD CONSTRAINT "commitment_changes_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "public"."commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_examples" ADD CONSTRAINT "code_examples_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_sync_log" ADD CONSTRAINT "erp_sync_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_contract_sovs" ADD CONSTRAINT "prime_contract_sovs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_potential_change_orders" ADD CONSTRAINT "prime_potential_change_orders_change_event_id_fkey" FOREIGN KEY ("change_event_id") REFERENCES "public"."change_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_potential_change_orders" ADD CONSTRAINT "prime_potential_change_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_potential_change_orders" ADD CONSTRAINT "prime_potential_change_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_event_line_items" ADD CONSTRAINT "change_event_line_items_change_event_id_fkey" FOREIGN KEY ("change_event_id") REFERENCES "public"."change_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pco_line_items" ADD CONSTRAINT "pco_line_items_change_event_line_item_id_fkey" FOREIGN KEY ("change_event_line_item_id") REFERENCES "public"."change_event_line_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pco_line_items" ADD CONSTRAINT "pco_line_items_pco_id_fkey" FOREIGN KEY ("pco_id") REFERENCES "public"."prime_potential_change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_contract_change_orders" ADD CONSTRAINT "prime_contract_change_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pcco_line_items" ADD CONSTRAINT "pcco_line_items_pcco_id_fkey" FOREIGN KEY ("pcco_id") REFERENCES "public"."prime_contract_change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pcco_line_items" ADD CONSTRAINT "pcco_line_items_pco_id_fkey" FOREIGN KEY ("pco_id") REFERENCES "public"."prime_potential_change_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_invoice_line_items" ADD CONSTRAINT "owner_invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."owner_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_invoices" ADD CONSTRAINT "owner_invoices_billing_period_id_fkey" FOREIGN KEY ("billing_period_id") REFERENCES "public"."billing_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_invoices" ADD CONSTRAINT "owner_invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."owner_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversations"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_metadata" ADD CONSTRAINT "document_metadata_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "document_rows" ADD CONSTRAINT "document_rows_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."document_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_insights" ADD CONSTRAINT "project_insights_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_items" ADD CONSTRAINT "chat_thread_items_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_attachments" ADD CONSTRAINT "chat_thread_attachments_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_feedback" ADD CONSTRAINT "chat_thread_feedback_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_attachment_files" ADD CONSTRAINT "chat_thread_attachment_files_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."chat_thread_attachments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_ball_in_court_employee_id_fkey" FOREIGN KEY ("ball_in_court_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_rfi_manager_employee_id_fkey" FOREIGN KEY ("rfi_manager_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_insights" ADD CONSTRAINT "document_insights_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "public"."document_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."document_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_chunks_id_fkey" FOREIGN KEY ("chunks_id") REFERENCES "public"."chunks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_log_equipment" ADD CONSTRAINT "daily_log_equipment_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_log_manpower" ADD CONSTRAINT "daily_log_manpower_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_log_manpower" ADD CONSTRAINT "daily_log_manpower_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_log_notes" ADD CONSTRAINT "daily_log_notes_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_forecasts" ADD CONSTRAINT "cost_forecasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_jobs" ADD CONSTRAINT "sub_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost_line_items" ADD CONSTRAINT "direct_cost_line_items_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost_line_items" ADD CONSTRAINT "direct_cost_line_items_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost_line_items" ADD CONSTRAINT "direct_cost_line_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost_line_items" ADD CONSTRAINT "direct_cost_line_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasting_curves" ADD CONSTRAINT "forecasting_curves_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasting_curves" ADD CONSTRAINT "forecasting_curves_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasting_curves" ADD CONSTRAINT "forecasting_curves_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_contracts" ADD CONSTRAINT "financial_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_contracts" ADD CONSTRAINT "financial_contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_contracts" ADD CONSTRAINT "financial_contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_contracts" ADD CONSTRAINT "financial_contracts_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_of_values" ADD CONSTRAINT "schedule_of_values_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_of_values" ADD CONSTRAINT "schedule_of_values_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "public"."commitments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_of_values" ADD CONSTRAINT "schedule_of_values_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sov_line_items" ADD CONSTRAINT "sov_line_items_sov_id_fkey" FOREIGN KEY ("sov_id") REFERENCES "public"."schedule_of_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vertical_markup" ADD CONSTRAINT "vertical_markup_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_architect_engineer_id_fkey" FOREIGN KEY ("architect_engineer_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_client_id_fkey" FOREIGN KEY ("owner_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_codes" ADD CONSTRAINT "cost_codes_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."cost_code_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_cost_codes" ADD CONSTRAINT "project_cost_codes_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_cost_codes" ADD CONSTRAINT "project_cost_codes_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_cost_codes" ADD CONSTRAINT "project_cost_codes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontract_sov_items" ADD CONSTRAINT "subcontract_sov_items_subcontract_id_fkey" FOREIGN KEY ("subcontract_id") REFERENCES "public"."subcontracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_contract_company_id_fkey" FOREIGN KEY ("contract_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_directory" ADD CONSTRAINT "project_directory_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_directory" ADD CONSTRAINT "project_directory_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_contracts" ADD CONSTRAINT "prime_contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_contracts" ADD CONSTRAINT "prime_contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prime_contracts" ADD CONSTRAINT "prime_contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontract_attachments" ADD CONSTRAINT "subcontract_attachments_subcontract_id_fkey" FOREIGN KEY ("subcontract_id") REFERENCES "public"."subcontracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontract_attachments" ADD CONSTRAINT "subcontract_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_views" ADD CONSTRAINT "budget_views_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_views" ADD CONSTRAINT "budget_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_view_columns" ADD CONSTRAINT "budget_view_columns_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "public"."budget_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_line_items" ADD CONSTRAINT "contract_line_items_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."prime_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_lines" ADD CONSTRAINT "change_order_lines_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "public"."change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_lines" ADD CONSTRAINT "change_order_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_lines" ADD CONSTRAINT "change_order_lines_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_lines" ADD CONSTRAINT "change_order_lines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_lines" ADD CONSTRAINT "change_order_lines_sub_job_id_fkey" FOREIGN KEY ("sub_job_id") REFERENCES "public"."sub_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_mod_lines" ADD CONSTRAINT "budget_mod_lines_budget_modification_id_fkey" FOREIGN KEY ("budget_modification_id") REFERENCES "public"."budget_modifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_mod_lines" ADD CONSTRAINT "budget_mod_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_mod_lines" ADD CONSTRAINT "budget_mod_lines_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_mod_lines" ADD CONSTRAINT "budget_mod_lines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_mod_lines" ADD CONSTRAINT "budget_mod_lines_sub_job_id_fkey" FOREIGN KEY ("sub_job_id") REFERENCES "public"."sub_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_code_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_default_curve_id_fkey" FOREIGN KEY ("default_curve_id") REFERENCES "public"."forecasting_curves"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_project_budget_code_id_fkey" FOREIGN KEY ("project_budget_code_id") REFERENCES "public"."project_budget_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_sub_job_id_fkey" FOREIGN KEY ("sub_job_id") REFERENCES "public"."sub_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_modifications" ADD CONSTRAINT "budget_modifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_modifications" ADD CONSTRAINT "budget_modifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_change_orders" ADD CONSTRAINT "contract_change_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_change_orders" ADD CONSTRAINT "contract_change_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."prime_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_change_orders" ADD CONSTRAINT "contract_change_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_user_access" ADD CONSTRAINT "document_user_access_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_user_access" ADD CONSTRAINT "document_user_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_group_access" ADD CONSTRAINT "document_group_access_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."document_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_group_access" ADD CONSTRAINT "document_group_access_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfi_assignees" ADD CONSTRAINT "rfi_assignees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfi_assignees" ADD CONSTRAINT "rfi_assignees_rfi_id_fkey" FOREIGN KEY ("rfi_id") REFERENCES "public"."rfis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fm_text_chunks_clause" ON "fm_text_chunks" USING btree ("clause_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_text_chunks_embedding" ON "fm_text_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_fm_text_chunks_keywords" ON "fm_text_chunks" USING gin ("search_keywords" array_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_text_chunks_page" ON "fm_text_chunks" USING btree ("page_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_text_chunks_requirements" ON "fm_text_chunks" USING gin ("extracted_requirements" array_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_text_chunks_topics" ON "fm_text_chunks" USING gin ("topics" array_ops);--> statement-breakpoint
CREATE INDEX "idx_project_budget_codes_active" ON "project_budget_codes" USING btree ("project_id" int8_ops,"is_active" bool_ops) WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX "idx_project_budget_codes_project_cost_code" ON "project_budget_codes" USING btree ("project_id" int8_ops,"cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_project_budget_codes_project_cost_type" ON "project_budget_codes" USING btree ("project_id" uuid_ops,"cost_type_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_project_budget_codes_project_id" ON "project_budget_codes" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_billing_periods_project" ON "billing_periods" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "budget_line_item_history_date_idx" ON "budget_line_item_history" USING btree ("performed_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "budget_line_item_history_event_idx" ON "budget_line_item_history" USING btree ("event_type" text_ops);--> statement-breakpoint
CREATE INDEX "budget_line_item_history_item_idx" ON "budget_line_item_history" USING btree ("budget_line_item_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "budget_line_item_history_project_idx" ON "budget_line_item_history" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_project_tasks_project" ON "project_tasks" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_project_tasks_status" ON "project_tasks" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_chunks_chunk_index" ON "chunks" USING btree ("document_id" int4_ops,"chunk_index" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chunks_content_trgm" ON "chunks" USING gin ("content" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_chunks_document_id" ON "chunks" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chunks_document_id_title" ON "chunks" USING btree ("document_id" text_ops,"document_title" text_ops);--> statement-breakpoint
CREATE INDEX "idx_chunks_embedding" ON "chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=1);--> statement-breakpoint
CREATE INDEX "fm_table_vectors_embedding_cosine_idx" ON "fm_table_vectors" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "fm_table_vectors_embedding_idx" ON "fm_table_vectors" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "fm_table_vectors_embedding_l2_idx" ON "fm_table_vectors" USING ivfflat ("embedding" vector_l2_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "meeting_segments_project_ids_gin_idx" ON "meeting_segments" USING gin ("project_ids" array_ops);--> statement-breakpoint
CREATE INDEX "meeting_segments_summary_embedding_idx" ON "meeting_segments" USING hnsw ("summary_embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "projects_created_idx" ON "user_projects" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "user_projects_lead_score_idx" ON "user_projects" USING btree ("lead_score" int4_ops);--> statement-breakpoint
CREATE INDEX "user_projects_status_idx" ON "user_projects" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "recommendations_priority_idx" ON "design_recommendations" USING btree ("priority_level" text_ops);--> statement-breakpoint
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submissions_created" ON "fm_form_submissions" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submissions_lead_score" ON "fm_form_submissions" USING btree ("lead_score" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submissions_status" ON "fm_form_submissions" USING btree ("lead_status" text_ops);--> statement-breakpoint
CREATE INDEX "fm_documents_embedding_idx" ON "fm_documents" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=50);--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "fm_documents" USING btree ("processing_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "fm_documents" USING btree ("document_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_documents_content_search" ON "fm_documents" USING gin (to_tsvector('english'::regconfig, content) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractor_projects_subcontractor_id" ON "subcontractor_projects" USING btree ("subcontractor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fm_global_tables_specs_gin" ON "fm_global_tables" USING gin ("sprinkler_specifications" jsonb_ops);--> statement-breakpoint
CREATE INDEX "fm_global_tables_tableid_idx" ON "fm_global_tables" USING btree ("table_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_global_tables_number" ON "fm_global_tables" USING btree ("table_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_asrs_type" ON "fm_global_tables" USING btree ("asrs_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_commodities" ON "fm_global_tables" USING gin ("commodity_types" array_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_number" ON "fm_global_tables" USING btree ("table_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_status" ON "fm_global_tables" USING btree ("extraction_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_system_type" ON "fm_global_tables" USING btree ("system_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_title_search" ON "fm_global_tables" USING gin (to_tsvector('english'::regconfig, title) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_tables_type_system" ON "fm_global_tables" USING btree ("asrs_type" text_ops,"system_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_created_at" ON "notes" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_project_id" ON "notes" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_sections_parent" ON "fm_sections" USING btree ("parent_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_sections_slug" ON "fm_sections" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_sections_sort" ON "fm_sections" USING btree ("sort_key" int4_ops);--> statement-breakpoint
CREATE INDEX "asrs_sections_number_idx" ON "asrs_sections" USING btree ("number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_asrs_sections_slug" ON "asrs_sections" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_asrs_sections_sort" ON "asrs_sections" USING btree ("sort_key" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_blocks_search" ON "fm_blocks" USING gin ("search_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_blocks_section" ON "fm_blocks" USING btree ("section_id" int4_ops,"ordinal" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_blocks_type" ON "fm_blocks" USING btree ("block_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_project_members_project" ON "project_members" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_project_members_project_user" ON "project_members" USING btree ("project_id" uuid_ops,"user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_project_members_user" ON "project_members" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_project_users_project_id" ON "project_users" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_project_users_user_id" ON "project_users" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_specifications_content_search" ON "specifications" USING gin (to_tsvector('english'::regconfig, content) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_specifications_project_id" ON "specifications" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_specifications_requirements" ON "specifications" USING gin ("requirements" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_specifications_section" ON "specifications" USING btree ("section_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_company_id" ON "contacts" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_history_session_id" ON "chat_history" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_history_user_id" ON "chat_history" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_processing_queue_document_id" ON "processing_queue" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_processing_queue_status" ON "processing_queue" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_line_history_budget_line_id" ON "budget_line_history" USING btree ("budget_line_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_line_history_changed_at" ON "budget_line_history" USING btree ("changed_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_line_history_project_id" ON "budget_line_history" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_initiatives_category" ON "initiatives" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_initiatives_keywords" ON "initiatives" USING gin ("keywords" array_ops);--> statement-breakpoint
CREATE INDEX "idx_initiatives_owner" ON "initiatives" USING btree ("owner" text_ops);--> statement-breakpoint
CREATE INDEX "idx_initiatives_status" ON "initiatives" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_approved_by" ON "contract_payments" USING btree ("approved_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_billing_period" ON "contract_payments" USING btree ("billing_period_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_created_at" ON "contract_payments" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_payment_date" ON "contract_payments" USING btree ("payment_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "contract_payments" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_billing_periods_billing_date" ON "contract_billing_periods" USING btree ("billing_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_billing_periods_contract" ON "contract_billing_periods" USING btree ("contract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_billing_periods_created_at" ON "contract_billing_periods" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_billing_periods_status" ON "contract_billing_periods" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "risks_embedding_idx" ON "risks" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "risks_project_ids_gin_idx" ON "risks" USING gin ("project_ids" array_ops);--> statement-breakpoint
CREATE INDEX "idx_submittals_metadata" ON "submittals" USING gin ("metadata" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_submittals_number" ON "submittals" USING btree ("submittal_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_submittals_project_id" ON "submittals" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_submittals_status" ON "submittals" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_submittals_submission_date" ON "submittals" USING btree ("submission_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_asrs_experience" ON "subcontractors" USING btree ("asrs_experience_years" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_company_name" ON "subcontractors" USING btree ("company_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_fm_certified" ON "subcontractors" USING btree ("fm_global_certified" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_service_areas" ON "subcontractors" USING gin ("service_areas" array_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_specialties" ON "subcontractors" USING gin ("specialties" array_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_status" ON "subcontractors" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractors_tier_level" ON "subcontractors" USING btree ("tier_level" text_ops);--> statement-breakpoint
CREATE INDEX "idx_submittal_documents_submittal_id" ON "submittal_documents" USING btree ("submittal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_submittal_documents_text_search" ON "submittal_documents" USING gin (to_tsvector('english'::regconfig, extracted_text) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_files_category" ON "files" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_files_project_id" ON "files" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_discrepancies_location" ON "discrepancies" USING gin ("location_in_doc" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_discrepancies_search" ON "discrepancies" USING gin (to_tsvector('english'::regconfig, (((title)::text || ' '::text) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_discrepancies_severity" ON "discrepancies" USING btree ("severity" text_ops);--> statement-breakpoint
CREATE INDEX "idx_discrepancies_status" ON "discrepancies" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_discrepancies_submittal_id" ON "discrepancies" USING btree ("submittal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_discrepancies_type" ON "discrepancies" USING btree ("discrepancy_type" text_ops);--> statement-breakpoint
CREATE INDEX "tasks_project_ids_gin_idx" ON "tasks" USING gin ("project_ids" array_ops);--> statement-breakpoint
CREATE INDEX "idx_reviews_due_date" ON "reviews" USING btree ("due_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_reviews_reviewer_id" ON "reviews" USING btree ("reviewer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_reviews_status" ON "reviews" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reviews_submittal_id" ON "reviews" USING btree ("submittal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_analysis_results" ON "ai_analysis_jobs" USING gin ("results" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_submittal_history_submittal_id" ON "submittal_history" USING btree ("submittal_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_submittal_notifications_unread" ON "submittal_notifications" USING btree ("user_id" bool_ops,"is_read" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_submittal_notifications_user_id" ON "submittal_notifications" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_vendors_company" ON "vendors" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_vendors_created_at" ON "vendors" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_vendors_is_active" ON "vendors" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_vendors_name" ON "vendors" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_views_company" ON "contract_views" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_views_is_default" ON "contract_views" USING btree ("is_default" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_views_is_shared" ON "contract_views" USING btree ("is_shared" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_views_user" ON "contract_views" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_snapshots_contract" ON "contract_snapshots" USING btree ("contract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_snapshots_created_by" ON "contract_snapshots" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_snapshots_date" ON "contract_snapshots" USING btree ("snapshot_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_documents_contract" ON "contract_documents" USING btree ("contract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_documents_is_current" ON "contract_documents" USING btree ("is_current_version" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_documents_type" ON "contract_documents" USING btree ("document_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_documents_uploaded_at" ON "contract_documents" USING btree ("uploaded_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_documents_uploaded_by" ON "contract_documents" USING btree ("uploaded_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_project_ids_gin_idx" ON "documents" USING gin ("project_ids" array_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_created_at" ON "documents" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_metadata" ON "documents" USING gin ("metadata" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_project_id" ON "documents" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_storage_object_id" ON "documents" USING btree ("storage_object_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fm_global_figures_claims_gin" ON "fm_global_figures" USING gin ("machine_readable_claims" jsonb_ops);--> statement-breakpoint
CREATE INDEX "fm_global_figures_num_idx" ON "fm_global_figures" USING btree ("figure_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_asrs_type" ON "fm_global_figures" USING btree ("asrs_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_container_type" ON "fm_global_figures" USING btree ("container_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_embedding" ON "fm_global_figures" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_keywords" ON "fm_global_figures" USING gin ("search_keywords" array_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_number" ON "fm_global_figures" USING btree ("figure_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_tables" ON "fm_global_figures" USING gin ("related_tables" array_ops);--> statement-breakpoint
CREATE INDEX "idx_figures_type" ON "fm_global_figures" USING btree ("figure_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_fm_global_figures_number" ON "fm_global_figures" USING btree ("figure_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_briefings_date" ON "project_briefings" USING btree ("generated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_briefings_project" ON "project_briefings" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_modification_lines_budget_line" ON "budget_modification_lines" USING btree ("budget_line_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_modification_lines_modification" ON "budget_modification_lines" USING btree ("budget_modification_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_lines_budget_line" ON "commitment_lines" USING btree ("budget_line_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_lines_commitment" ON "commitment_lines" USING btree ("commitment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_lines_cost_code" ON "commitment_lines" USING btree ("cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractor_contacts_subcontractor_id" ON "subcontractor_contacts" USING btree ("subcontractor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractor_documents_expiration" ON "subcontractor_documents" USING btree ("expiration_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractor_documents_subcontractor_id" ON "subcontractor_documents" USING btree ("subcontractor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontractor_documents_type" ON "subcontractor_documents" USING btree ("document_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_archived" ON "projects" USING btree ("archived" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_delivery_method" ON "projects" USING btree ("delivery_method" text_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_health_score" ON "projects" USING btree ("health_score" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_phase" ON "projects" USING btree ("phase" text_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_project_manager" ON "projects" USING btree ("project_manager" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_projects_project_number" ON "projects" USING btree ("project_number" text_ops) WHERE (project_number IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_projects_project_sector" ON "projects" USING btree ("project_sector" text_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_state" ON "projects" USING btree ("state" text_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_summary_updated" ON "projects" USING btree ("summary_updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_work_scope" ON "projects" USING btree ("work_scope" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sprinkler_configs_height" ON "fm_sprinkler_configs" USING btree ("ceiling_height_ft" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_sprinkler_configs_kfactor" ON "fm_sprinkler_configs" USING btree ("k_factor" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_sprinkler_configs_lookup" ON "fm_sprinkler_configs" USING btree ("table_id" text_ops,"ceiling_height_ft" numeric_ops,"k_factor" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_sprinkler_configs_table" ON "fm_sprinkler_configs" USING btree ("table_id" text_ops);--> statement-breakpoint
CREATE INDEX "parts_message_id_idx" ON "parts" USING btree ("messageId" text_ops);--> statement-breakpoint
CREATE INDEX "parts_message_id_order_idx" ON "parts" USING btree ("messageId" int4_ops,"order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_asrs_lookup" ON "asrs_decision_matrix" USING btree ("asrs_type" float8_ops,"container_type" float8_ops,"max_depth_ft" float8_ops,"max_spacing_ft" float8_ops);--> statement-breakpoint
CREATE INDEX "asrs_blocks_meta_gin" ON "asrs_blocks" USING gin ("meta" jsonb_ops);--> statement-breakpoint
CREATE INDEX "asrs_blocks_section_idx" ON "asrs_blocks" USING btree ("section_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "block_embeddings_source_text_fts" ON "asrs_blocks" USING gin (to_tsvector('english'::regconfig, source_text) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_asrs_blocks_section" ON "asrs_blocks" USING btree ("section_id" int4_ops,"ordinal" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_co_lines_budget_line" ON "commitment_change_order_lines" USING btree ("budget_line_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_co_lines_co" ON "commitment_change_order_lines" USING btree ("commitment_change_order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_cos_commitment" ON "commitment_change_orders" USING btree ("commitment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_commitment_cos_status" ON "commitment_change_orders" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_qto_items_project_id" ON "qto_items" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_qto_items_qto_id" ON "qto_items" USING btree ("qto_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_co_number" ON "change_orders" USING btree ("co_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_project_id" ON "change_orders" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_qtos_project_id" ON "qtos" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_co_costs_change_order_id" ON "change_order_costs" USING btree ("change_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_co_approvals_co_id" ON "change_order_approvals" USING btree ("change_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_attachments_project_id" ON "attachments" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_tasks_project_id" ON "schedule_tasks" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_tasks_schedule_id" ON "schedule_tasks" USING btree ("schedule_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_task_deps_task_id" ON "schedule_task_dependencies" USING btree ("task_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_resources_task_id" ON "schedule_resources" USING btree ("task_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_progress_task_id" ON "schedule_progress_updates" USING btree ("task_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_prospects_assigned_to" ON "prospects" USING btree ("assigned_to" text_ops);--> statement-breakpoint
CREATE INDEX "idx_prospects_industry" ON "prospects" USING btree ("industry" text_ops);--> statement-breakpoint
CREATE INDEX "idx_prospects_next_follow_up" ON "prospects" USING btree ("next_follow_up" date_ops);--> statement-breakpoint
CREATE INDEX "idx_prospects_status" ON "prospects" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "decisions_embedding_idx" ON "decisions" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "decisions_project_ids_gin_idx" ON "decisions" USING gin ("project_ids" array_ops);--> statement-breakpoint
CREATE INDEX "opportunities_client_idx" ON "opportunities" USING btree ("client_id" int8_ops);--> statement-breakpoint
CREATE INDEX "opportunities_embedding_idx" ON "opportunities" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=50);--> statement-breakpoint
CREATE INDEX "opportunities_metadata_idx" ON "opportunities" USING btree ("metadata_id" text_ops);--> statement-breakpoint
CREATE INDEX "opportunities_project_ids_gin_idx" ON "opportunities" USING gin ("project_ids" array_ops);--> statement-breakpoint
CREATE INDEX "opportunities_project_idx" ON "opportunities" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "opportunities_type_idx" ON "opportunities" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_screenshots_category" ON "procore_screenshots" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_screenshots_name" ON "procore_screenshots" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_screenshots_session" ON "procore_screenshots" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fireflies_ingestion_jobs_metadata_idx" ON "fireflies_ingestion_jobs" USING btree ("metadata_id" text_ops);--> statement-breakpoint
CREATE INDEX "fireflies_ingestion_jobs_stage_idx" ON "fireflies_ingestion_jobs" USING btree ("stage" text_ops);--> statement-breakpoint
CREATE INDEX "idx_components_screenshot" ON "procore_components" USING btree ("screenshot_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_components_type" ON "procore_components" USING btree ("component_type" text_ops);--> statement-breakpoint
CREATE INDEX "crawled_pages_embedding_idx" ON "crawled_pages" USING ivfflat ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_crawled_pages_metadata" ON "crawled_pages" USING gin ("metadata" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_crawled_pages_source_id" ON "crawled_pages" USING btree ("source_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_modules_category" ON "procore_modules" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_features_module" ON "procore_features" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_direct_costs_project" ON "direct_costs" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "code_examples_embedding_idx" ON "code_examples" USING ivfflat ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_code_examples_metadata" ON "code_examples" USING gin ("metadata" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_code_examples_source_id" ON "code_examples" USING btree ("source_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contract_sovs_contract" ON "prime_contract_sovs" USING btree ("contract_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pcos_change_event" ON "prime_potential_change_orders" USING btree ("change_event_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pcos_contract" ON "prime_potential_change_orders" USING btree ("contract_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pcos_project" ON "prime_potential_change_orders" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_change_event_line_items_event" ON "change_event_line_items" USING btree ("change_event_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_change_event_lines_event" ON "change_event_line_items" USING btree ("change_event_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_change_events_project" ON "change_events" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_change_events_status" ON "change_events" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_pco_line_items_pco" ON "pco_line_items" USING btree ("pco_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pccos_contract" ON "prime_contract_change_orders" USING btree ("contract_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pcco_line_items_pcco" ON "pcco_line_items" USING btree ("pcco_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_owner_invoice_line_items_invoice" ON "owner_invoice_line_items" USING btree ("invoice_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_owner_invoices_contract" ON "owner_invoices" USING btree ("contract_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_contract" ON "payment_transactions" USING btree ("contract_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_invoice" ON "payment_transactions" USING btree ("invoice_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_rag_pipeline_state_last_run" ON "rag_pipeline_state" USING btree ("last_run" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_rag_pipeline_state_pipeline_type" ON "rag_pipeline_state" USING btree ("pipeline_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_computed_session" ON "messages" USING btree ("computed_session_user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_session" ON "messages" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_category" ON "document_metadata" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_composite" ON "document_metadata" USING btree ("type" text_ops,"category" text_ops,"date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_content_fts" ON "document_metadata" USING gin (to_tsvector('english'::regconfig, content) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_date" ON "document_metadata" USING btree ("date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_fireflies_id" ON "document_metadata" USING btree ("fireflies_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_lower_title" ON "document_metadata" USING btree (lower(title) text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_participants" ON "document_metadata" USING gin (to_tsvector('english'::regconfig, participants) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_project_captured" ON "document_metadata" USING btree ("project_id" timestamptz_ops,"captured_at" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_document_metadata_type" ON "document_metadata" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_table_project_id" ON "document_metadata" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_metadata_content_hash" ON "document_metadata" USING btree ("content_hash" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_metadata_fireflies" ON "document_metadata" USING btree ("fireflies_id" text_ops) WHERE (fireflies_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_project_insights_project_captured" ON "project_insights" USING btree ("project_id" int4_ops,"captured_at" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_threads_created_at" ON "chat_threads" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_thread_items_thread_created" ON "chat_thread_items" USING btree ("thread_id" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_rfis_due_date" ON "rfis" USING btree ("due_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_rfis_number_project" ON "rfis" USING btree ("project_id" int8_ops,"number" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_rfis_project_id" ON "rfis" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_rfis_status" ON "rfis" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "document_chunks_embedding_idx" ON "document_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_document_chunks_content_hash" ON "document_chunks" USING btree ("content_hash" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_chunks_created_at" ON "document_chunks" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_document_chunks_document_id" ON "document_chunks" USING btree ("document_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_created_at" ON "document_insights" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_doc_title" ON "document_insights" USING gin (to_tsvector('english'::regconfig, doc_title) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_document_date" ON "document_insights" USING btree ("document_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_document_id" ON "document_insights" USING btree ("document_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_project_id" ON "document_insights" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_project_name" ON "document_insights" USING btree ("project_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_insights_type" ON "document_insights" USING btree ("insight_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insights_assignee" ON "document_insights" USING btree ("assignee" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insights_critical_path" ON "document_insights" USING btree ("critical_path_impact" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_insights_due_date" ON "document_insights" USING btree ("due_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_insights_resolved" ON "document_insights" USING btree ("resolved" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_insights_severity" ON "document_insights" USING btree ("severity" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_tasks_due_date" ON "ai_tasks" USING btree ("status" date_ops,"due_date" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_tasks_project_status" ON "ai_tasks" USING btree ("project_id" text_ops,"status" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ux_ingestion_jobs_fireflies" ON "ingestion_jobs" USING btree ("fireflies_id" text_ops) WHERE (fireflies_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_assigned_to" ON "ai_insights" USING btree ("assigned_to" text_ops) WHERE (assigned_to IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_chunks_id" ON "ai_insights" USING btree ("chunks_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_created_at" ON "ai_insights" USING btree ("created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_document_id" ON "ai_insights" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_due_date" ON "ai_insights" USING btree ("due_date" date_ops) WHERE (due_date IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_exact_quotes_search" ON "ai_insights" USING gin (to_tsvector('english'::regconfig, COALESCE((exact_quotes)::text tsvector_ops) WHERE (exact_quotes IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_exact_quotes_tsv" ON "ai_insights" USING gin (to_tsvector('english'::regconfig, COALESCE(exact_quotes_text, ' tsvector_ops) WHERE (exact_quotes_text IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_meeting_name" ON "ai_insights" USING btree ("meeting_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_project" ON "ai_insights" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_project_id" ON "ai_insights" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_project_name" ON "ai_insights" USING btree ("project_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_status" ON "ai_insights" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_insights_type" ON "ai_insights" USING btree ("insight_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sub_jobs_active" ON "sub_jobs" USING btree ("is_active" bool_ops) WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX "idx_sub_jobs_project" ON "sub_jobs" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_direct_cost_line_items_approved" ON "direct_cost_line_items" USING btree ("approved" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_direct_cost_line_items_budget" ON "direct_cost_line_items" USING btree ("budget_code_id" uuid_ops) WHERE (budget_code_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_direct_cost_line_items_cost_code" ON "direct_cost_line_items" USING btree ("cost_code_id" text_ops) WHERE (cost_code_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_direct_cost_line_items_date" ON "direct_cost_line_items" USING btree ("transaction_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_direct_cost_line_items_project" ON "direct_cost_line_items" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_forecasting_curves_active" ON "forecasting_curves" USING btree ("company_id" bool_ops,"is_active" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_forecasting_curves_company" ON "forecasting_curves" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_of_values_commitment" ON "schedule_of_values" USING btree ("commitment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_of_values_contract" ON "schedule_of_values" USING btree ("contract_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_of_values_status" ON "schedule_of_values" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_app_users_email" ON "app_users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_daily_recaps_date" ON "daily_recaps" USING btree ("recap_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_sov_line_items_cost_code" ON "sov_line_items" USING btree ("cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sov_line_items_sov" ON "sov_line_items" USING btree ("sov_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_vertical_markup_project" ON "vertical_markup" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_client_id" ON "contracts" USING btree ("client_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_erp_status" ON "contracts" USING btree ("erp_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_project_id" ON "contracts" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_contracts_status" ON "contracts" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "project_cost_codes_code_idx" ON "project_cost_codes" USING btree ("cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "project_cost_codes_project_idx" ON "project_cost_codes" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_commitments_project" ON "commitments" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_commitments_status" ON "commitments" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_commitments_vendor" ON "commitments" USING btree ("vendor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_sov_items_budget_code" ON "subcontract_sov_items" USING btree ("budget_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sov_items_sort_order" ON "subcontract_sov_items" USING btree ("subcontract_id" uuid_ops,"sort_order" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_sov_items_subcontract_id" ON "subcontract_sov_items" USING btree ("subcontract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontracts_company_id" ON "subcontracts" USING btree ("contract_company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontracts_contract_number" ON "subcontracts" USING btree ("contract_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontracts_created_at" ON "subcontracts" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontracts_project_id" ON "subcontracts" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_subcontracts_status" ON "subcontracts" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_project_directory_company" ON "project_directory" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_project_directory_project" ON "project_directory" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contracts_created_at" ON "prime_contracts" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contracts_created_by" ON "prime_contracts" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contracts_number" ON "prime_contracts" USING btree ("contract_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contracts_project" ON "prime_contracts" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contracts_status" ON "prime_contracts" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_prime_contracts_vendor" ON "prime_contracts" USING btree ("vendor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attachments_subcontract_id" ON "subcontract_attachments" USING btree ("subcontract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_views_default" ON "budget_views" USING btree ("project_id" bool_ops,"is_default" bool_ops) WHERE (is_default = true);--> statement-breakpoint
CREATE INDEX "idx_budget_views_project" ON "budget_views" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_view_columns_order" ON "budget_view_columns" USING btree ("view_id" uuid_ops,"display_order" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_view_columns_view" ON "budget_view_columns" USING btree ("view_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_line_items_contract" ON "contract_line_items" USING btree ("contract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_line_items_cost_code" ON "contract_line_items" USING btree ("cost_code_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_contract_line_items_created_at" ON "contract_line_items" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_co_lines_change_order" ON "change_order_lines" USING btree ("change_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_co_lines_cost_code" ON "change_order_lines" USING btree ("cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_co_lines_cost_type" ON "change_order_lines" USING btree ("cost_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_co_lines_project" ON "change_order_lines" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_mod_lines_cost_code" ON "budget_mod_lines" USING btree ("cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_mod_lines_cost_type" ON "budget_mod_lines" USING btree ("cost_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_mod_lines_mod" ON "budget_mod_lines" USING btree ("budget_modification_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_mod_lines_project" ON "budget_mod_lines" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_lines_cost_code" ON "budget_lines" USING btree ("cost_code_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_lines_cost_type" ON "budget_lines" USING btree ("cost_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_lines_project" ON "budget_lines" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_lines_project_budget_code_id" ON "budget_lines" USING btree ("project_budget_code_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_lines_sub_job" ON "budget_lines" USING btree ("sub_job_id" uuid_ops) WHERE (sub_job_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_budget_lines_updated_at" ON "budget_lines" USING btree ("updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_modifications_project" ON "budget_modifications" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_modifications_status" ON "budget_modifications" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_mods_project" ON "budget_modifications" USING btree ("project_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_budget_mods_status" ON "budget_modifications" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_approved_by" ON "contract_change_orders" USING btree ("approved_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_contract" ON "contract_change_orders" USING btree ("contract_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_created_at" ON "contract_change_orders" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_requested_by" ON "contract_change_orders" USING btree ("requested_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_change_orders_status" ON "contract_change_orders" USING btree ("status" text_ops);--> statement-breakpoint
CREATE VIEW "public"."cost_codes_with_division_title" AS (SELECT c.id, c.division_id, c.division_title, c.title, c.status, c.created_at, c.updated_at, d.title AS division_title_current FROM cost_codes c LEFT JOIN cost_code_divisions d ON c.division_id = d.id);--> statement-breakpoint
CREATE VIEW "public"."document_metadata_manual_only" AS (SELECT id, title, url, created_at, type, source, content, summary, participants, tags, category, fireflies_id, fireflies_link, project_id, project, date, duration_minutes, bullet_points, action_items, file_id, overview, description, status, access_level, captured_at, content_hash, participants_array, phase, audio, video FROM document_metadata WHERE fireflies_id ~~* '%MANUAL%'::text);--> statement-breakpoint
CREATE VIEW "public"."project_health_dashboard_no_summary" WITH (security_invoker = on) AS (SELECT id, name, current_phase, completion_percentage, health_score, health_status, summary_updated_at, CASE WHEN budget IS NOT NULL AND budget > 0::numeric AND budget_used IS NOT NULL THEN budget_used::numeric / budget::numeric * 100::numeric ELSE 0::numeric END AS budget_utilization, "est completion", ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id) AS total_insights_count, ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'critical'::text AND (ai.resolved = 0 OR ai.resolved IS NULL)) AS open_critical_items, ( SELECT count(*) AS count FROM documents d WHERE d.project_id = p.id AND d.created_at > (now() - '30 days'::interval)) AS recent_documents_count, ( SELECT max(d.created_at::date) AS max FROM documents d WHERE d.project_id = p.id) AS last_document_date FROM projects p WHERE name IS NOT NULL ORDER BY ( CASE WHEN health_score IS NULL THEN 999::numeric ELSE health_score END));--> statement-breakpoint
CREATE VIEW "public"."ai_insights_with_project" AS (SELECT ai.id, ai.project_id, ai.insight_type, ai.severity, ai.title, ai.description, ai.source_meetings, ai.confidence_score, ai.resolved, ai.created_at, ai.meeting_id, p.name AS project_name FROM ai_insights ai LEFT JOIN projects p ON ai.project_id = p.id);--> statement-breakpoint
CREATE VIEW "public"."figure_summary" AS (SELECT figure_number, title, normalized_summary, figure_type, asrs_type, container_type, CASE WHEN max_depth_ft IS NOT NULL THEN max_depth_ft || ' ft'::text ELSE 'Variable'::text END AS max_depth, CASE WHEN max_spacing_ft IS NOT NULL THEN max_spacing_ft || ' ft'::text ELSE 'Variable'::text END AS max_spacing, related_tables, page_number, array_to_string(search_keywords, ', '::text) AS keywords, array_length(search_keywords, 1) AS keyword_count FROM fm_global_figures ORDER BY figure_number);--> statement-breakpoint
CREATE VIEW "public"."ai_insights_today" WITH (security_invoker = on) AS (SELECT id, project_id, insight_type, severity, title, description, source_meetings, confidence_score, resolved, created_at, meeting_id, meeting_name, project_name, document_id, status, assigned_to, due_date, metadata, resolved_at, business_impact, assignee, dependencies, financial_impact, timeline_impact_days, stakeholders_affected, exact_quotes, numerical_data, urgency_indicators, cross_project_impact FROM ai_insights WHERE created_at::timestamp with time zone >= date_trunc('day'::text, now()) AND created_at::timestamp with time zone < (date_trunc('day'::text, now()) + '1 day'::interval));--> statement-breakpoint
CREATE VIEW "public"."project_health_dashboard" AS (SELECT id, name, current_phase, completion_percentage, health_score, health_status, summary, summary_updated_at, CASE WHEN budget IS NOT NULL AND budget > 0::numeric AND budget_used IS NOT NULL THEN budget_used::numeric / budget::numeric * 100::numeric ELSE 0::numeric END AS budget_utilization, "est completion", ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id) AS total_insights_count, ( SELECT count(*) AS count FROM ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'critical'::text AND (ai.resolved = 0 OR ai.resolved IS NULL)) AS open_critical_items, ( SELECT count(*) AS count FROM documents d WHERE d.project_id = p.id AND d.created_at > (now() - '30 days'::interval)) AS recent_documents_count, ( SELECT max(d.created_at::date) AS max FROM documents d WHERE d.project_id = p.id) AS last_document_date FROM projects p WHERE name IS NOT NULL ORDER BY ( CASE WHEN health_score IS NULL THEN 999::numeric ELSE health_score END));--> statement-breakpoint
CREATE VIEW "public"."documents_ordered_view" WITH (security_invoker = on) AS (SELECT id, title, file_date AS date, project_id, project, fireflies_id, created_at, updated_at FROM documents);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."contract_financial_summary_mv" AS (WITH original_sov AS ( SELECT prime_contract_sovs.contract_id, COALESCE(sum(prime_contract_sovs.line_amount), 0::numeric) AS original_contract_amount FROM prime_contract_sovs GROUP BY prime_contract_sovs.contract_id ), approved_pccos AS ( SELECT prime_contract_change_orders.contract_id, COALESCE(sum(pcco_line_items.line_amount), 0::numeric) AS approved_change_orders FROM prime_contract_change_orders JOIN pcco_line_items ON pcco_line_items.pcco_id = prime_contract_change_orders.id WHERE prime_contract_change_orders.status = 'Approved'::text GROUP BY prime_contract_change_orders.contract_id ), pending_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS pending_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Pending'::text GROUP BY prime_potential_change_orders.contract_id ), draft_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS draft_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Draft'::text GROUP BY prime_potential_change_orders.contract_id ), invoiced AS ( SELECT owner_invoices.contract_id, COALESCE(sum(owner_invoice_line_items.approved_amount), 0::numeric) AS invoiced_amount FROM owner_invoices JOIN owner_invoice_line_items ON owner_invoice_line_items.invoice_id = owner_invoices.id WHERE owner_invoices.status = 'Approved'::text GROUP BY owner_invoices.contract_id ), payments AS ( SELECT payment_transactions.contract_id, COALESCE(sum(payment_transactions.amount), 0::numeric) AS payments_received FROM payment_transactions GROUP BY payment_transactions.contract_id ) SELECT c.id AS contract_id, c.contract_number, c.client_id, c.project_id, c.title, c.status, c.erp_status, c.executed, c.private, COALESCE(os.original_contract_amount, 0::numeric) AS original_contract_amount, COALESCE(ap.approved_change_orders, 0::numeric) AS approved_change_orders, COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric) AS revised_contract_amount, COALESCE(pp.pending_change_orders, 0::numeric) AS pending_change_orders, COALESCE(dp.draft_change_orders, 0::numeric) AS draft_change_orders, COALESCE(inv.invoiced_amount, 0::numeric) AS invoiced_amount, COALESCE(pay.payments_received, 0::numeric) AS payments_received, CASE WHEN (COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric)) > 0::numeric THEN round(COALESCE(pay.payments_received, 0::numeric) / (COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric)) * 100::numeric, 2) ELSE 0::numeric END AS percent_paid, COALESCE(os.original_contract_amount, 0::numeric) + COALESCE(ap.approved_change_orders, 0::numeric) - COALESCE(pay.payments_received, 0::numeric) AS remaining_balance FROM contracts c LEFT JOIN original_sov os ON os.contract_id = c.id LEFT JOIN approved_pccos ap ON ap.contract_id = c.id LEFT JOIN pending_pcos pp ON pp.contract_id = c.id LEFT JOIN draft_pcos dp ON dp.contract_id = c.id LEFT JOIN invoiced inv ON inv.contract_id = c.id LEFT JOIN payments pay ON pay.contract_id = c.id);--> statement-breakpoint
CREATE VIEW "public"."figure_statistics" AS (SELECT 'Total Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures UNION ALL SELECT 'Shuttle ASRS Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.asrs_type = 'Shuttle'::text UNION ALL SELECT 'Mini-Load ASRS Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.asrs_type = 'Mini-Load'::text UNION ALL SELECT 'Sprinkler Layout Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.figure_type = 'Sprinkler Layout'::text UNION ALL SELECT 'Open-Top Container Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.container_type = 'Open-Top'::text UNION ALL SELECT 'Closed-Top Container Figures'::text AS metric, count(*)::text AS value FROM fm_global_figures WHERE fm_global_figures.container_type = 'Closed-Top'::text);--> statement-breakpoint
CREATE VIEW "public"."actionable_insights" AS (SELECT di.id, di.document_id, di.project_id, di.insight_type, di.title, di.description, di.confidence_score, di.generated_by, di.created_at, di.metadata, di.doc_title, di.severity, di.business_impact, di.assignee, di.due_date, di.financial_impact, di.urgency_indicators, di.resolved, di.source_meetings, di.dependencies, di.stakeholders_affected, di.exact_quotes, di.numerical_data, di.critical_path_impact, di.cross_project_impact, dm.title AS document_title, dm.type AS document_type, dm.date AS meeting_date, p.name AS project_name FROM document_insights di LEFT JOIN document_metadata dm ON di.document_id = dm.id LEFT JOIN projects p ON di.project_id = p.id WHERE di.resolved = false AND (di.severity::text = ANY (ARRAY['critical'::character varying, 'high'::character varying]::text[])) ORDER BY ( CASE di.severity WHEN 'critical'::text THEN 1 WHEN 'high'::text THEN 2 WHEN 'medium'::text THEN 3 WHEN 'low'::text THEN 4 ELSE NULL::integer END), di.due_date, di.confidence_score DESC);--> statement-breakpoint
CREATE VIEW "public"."subcontractors_summary" AS (SELECT s.id, s.company_name, s.primary_contact_name, s.primary_contact_email, s.specialties, s.service_areas, s.fm_global_certified, s.asrs_experience_years, s.status, s.tier_level, count(sp.id) AS total_projects, avg(sp.project_rating) AS avg_rating, sum( CASE WHEN sp.on_time THEN 1 ELSE 0 END)::numeric / count(sp.id)::numeric * 100::numeric AS on_time_percentage FROM subcontractors s LEFT JOIN subcontractor_projects sp ON s.id = sp.subcontractor_id GROUP BY s.id, s.company_name, s.primary_contact_name, s.primary_contact_email, s.specialties, s.service_areas, s.fm_global_certified, s.asrs_experience_years, s.status, s.tier_level);--> statement-breakpoint
CREATE VIEW "public"."document_metadata_view_no_summary" WITH (security_invoker = on) AS (SELECT title, date, project_id, project, fireflies_id, fireflies_link FROM document_metadata);--> statement-breakpoint
CREATE VIEW "public"."active_submittals" AS (SELECT s.id, s.project_id, s.specification_id, s.submittal_type_id, s.submittal_number, s.title, s.description, s.submitted_by, s.submitter_company, s.submission_date, s.required_approval_date, s.priority, s.status, s.current_version, s.total_versions, s.metadata, s.created_at, s.updated_at, p.name AS project_name, u.email AS submitted_by_email, st.name AS submittal_type_name, count(d.id) AS discrepancy_count, count( CASE WHEN d.severity::text = 'critical'::text THEN 1 ELSE NULL::integer END) AS critical_discrepancies FROM submittals s JOIN projects p ON s.project_id = p.id JOIN users u ON s.submitted_by = u.id JOIN submittal_types st ON s.submittal_type_id = st.id LEFT JOIN discrepancies d ON s.id = d.submittal_id AND d.status::text = 'open'::text WHERE s.status::text <> ALL (ARRAY['approved'::character varying, 'rejected'::character varying, 'superseded'::character varying]::text[]) GROUP BY s.id, p.name, u.email, st.name);--> statement-breakpoint
CREATE VIEW "public"."submittal_project_dashboard" AS (SELECT p.id, p.name, p.state AS status, count(s.id) AS total_submittals, count( CASE WHEN s.status::text = 'submitted'::text THEN 1 ELSE NULL::integer END) AS pending_submittals, count( CASE WHEN s.status::text = 'under_review'::text THEN 1 ELSE NULL::integer END) AS under_review, count( CASE WHEN s.status::text = 'approved'::text THEN 1 ELSE NULL::integer END) AS approved_submittals, count( CASE WHEN s.status::text = 'requires_revision'::text THEN 1 ELSE NULL::integer END) AS needs_revision, count(d.id) AS total_discrepancies, count( CASE WHEN d.severity::text = 'critical'::text THEN 1 ELSE NULL::integer END) AS critical_discrepancies, avg(EXTRACT(days FROM COALESCE(r.completed_at, now()) - s.submission_date)) AS avg_review_time_days FROM projects p LEFT JOIN submittals s ON p.id = s.project_id LEFT JOIN discrepancies d ON s.id = d.submittal_id AND d.status::text = 'open'::text LEFT JOIN reviews r ON s.id = r.submittal_id AND r.review_type::text = 'final'::text GROUP BY p.id, p.name, p.state);--> statement-breakpoint
CREATE VIEW "public"."project_issue_summary" AS (SELECT p.id AS project_id, p.name AS project_name, count(i.id) AS total_issues, sum(i.total_cost) AS total_cost, round(avg(i.total_cost), 2) AS avg_cost_per_issue FROM projects p LEFT JOIN issues i ON p.id = i.project_id GROUP BY p.id, p.name ORDER BY (sum(i.total_cost)) DESC NULLS LAST);--> statement-breakpoint
CREATE VIEW "public"."cost_by_category" AS (SELECT category, count(*) AS issue_count, sum(total_cost) AS total_cost, round(avg(total_cost), 2) AS avg_cost FROM issues GROUP BY category ORDER BY (sum(total_cost)) DESC NULLS LAST);--> statement-breakpoint
CREATE VIEW "public"."procore_capture_summary" AS (SELECT m.category, m.name AS module_name, m.display_name, m.priority, m.complexity, count(DISTINCT s.id) AS screenshot_count, max(s.captured_at) AS last_captured FROM procore_modules m LEFT JOIN procore_screenshots s ON s.name ~~ (('%'::text || m.name) || '%'::text) GROUP BY m.category, m.name, m.display_name, m.priority, m.complexity ORDER BY m.category, m.priority);--> statement-breakpoint
CREATE VIEW "public"."procore_rebuild_estimate" AS (SELECT category, count(*) AS module_count, sum( CASE WHEN priority = 'must_have'::text THEN estimated_build_weeks ELSE 0 END) AS must_have_weeks, sum( CASE WHEN priority = 'nice_to_have'::text THEN estimated_build_weeks ELSE 0 END) AS nice_to_have_weeks, sum(estimated_build_weeks) AS total_weeks FROM procore_modules WHERE priority <> 'skip'::text GROUP BY category ORDER BY category);--> statement-breakpoint
CREATE VIEW "public"."project_with_manager" AS (SELECT p.id, p.created_at, p.name, p."job number", p."start date", p."est completion", p."est revenue", p."est profit", p.address, p.onedrive, p.phase, p.state, p.client_id, p.category, p.aliases, p.team_members, p.current_phase, p.completion_percentage, p.budget, p.budget_used, p.client, p.summary, p.summary_metadata, p.summary_updated_at, p.health_score, p.health_status, p.access, p.archived, p.archived_by, p.archived_at, p.erp_system, p.erp_last_job_cost_sync, p.erp_last_direct_cost_sync, p.erp_sync_status, p.project_manager, e.id AS manager_id, (e.first_name || ' '::text) || e.last_name AS manager_name, e.email AS manager_email FROM projects p LEFT JOIN employees e ON e.id = p.project_manager);--> statement-breakpoint
CREATE VIEW "public"."contract_financial_summary" AS (WITH original_sov AS ( SELECT prime_contract_sovs.contract_id, COALESCE(sum(prime_contract_sovs.line_amount), 0::numeric) AS original_contract_amount FROM prime_contract_sovs GROUP BY prime_contract_sovs.contract_id ), approved_pccos AS ( SELECT prime_contract_change_orders.contract_id, COALESCE(sum(pcco_line_items.line_amount), 0::numeric) AS approved_change_orders FROM prime_contract_change_orders JOIN pcco_line_items ON pcco_line_items.pcco_id = prime_contract_change_orders.id WHERE prime_contract_change_orders.status = 'Approved'::text GROUP BY prime_contract_change_orders.contract_id ), pending_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS pending_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Pending'::text GROUP BY prime_potential_change_orders.contract_id ), draft_pcos AS ( SELECT prime_potential_change_orders.contract_id, COALESCE(sum(pco_line_items.line_amount), 0::numeric) AS draft_change_orders FROM prime_potential_change_orders JOIN pco_line_items ON pco_line_items.pco_id = prime_potential_change_orders.id WHERE prime_potential_change_orders.status = 'Draft'::text GROUP BY prime_potential_change_orders.contract_id ), invoiced AS ( SELECT owner_invoices.contract_id, COALESCE(sum(owner_invoice_line_items.approved_amount), 0::numeric) AS invoiced_amount FROM owner_invoices JOIN owner_invoice_line_items ON owner_invoice_line_items.invoice_id = owner_invoices.id WHERE owner_invoices.status = 'Approved'::text GROUP BY owner_invoices.contract_id ), payments AS ( SELECT payment_transactions.contract_id, COALESCE(sum(payment_transactions.amount), 0::numeric) AS payments_received FROM payment_transactions GROUP BY payment_transactions.contract_id ) SELECT c.id AS contract_id, c.contract_number, c.client_id, c.title, c.status, c.erp_status, c.executed, c.private, os.original_contract_amount, ap.approved_change_orders, os.original_contract_amount + ap.approved_change_orders AS revised_contract_amount, pp.pending_change_orders, dp.draft_change_orders, inv.invoiced_amount, pay.payments_received, CASE WHEN (os.original_contract_amount + ap.approved_change_orders) > 0::numeric THEN round(pay.payments_received / (os.original_contract_amount + ap.approved_change_orders) * 100::numeric, 2) ELSE 0::numeric END AS percent_paid, os.original_contract_amount + ap.approved_change_orders - pay.payments_received AS remaining_balance FROM contracts c LEFT JOIN original_sov os ON os.contract_id = c.id LEFT JOIN approved_pccos ap ON ap.contract_id = c.id LEFT JOIN pending_pcos pp ON pp.contract_id = c.id LEFT JOIN draft_pcos dp ON dp.contract_id = c.id LEFT JOIN invoiced inv ON inv.contract_id = c.id LEFT JOIN payments pay ON pay.contract_id = c.id);--> statement-breakpoint
CREATE VIEW "public"."project_activity_view" AS (SELECT p.id AS project_id, p.name, COALESCE(count(DISTINCT dm.id), 0::bigint) AS meeting_count, COALESCE(count(DISTINCT CASE WHEN t.status = ANY (ARRAY['open'::text, 'in_progress'::text]) THEN t.id ELSE NULL::uuid END), 0::bigint) AS open_tasks, max(dm.captured_at) AS last_meeting_at, max(t.updated_at) AS last_task_update FROM projects p LEFT JOIN document_metadata dm ON dm.project_id = p.id LEFT JOIN ai_tasks t ON t.project_id = p.id GROUP BY p.id, p.name);--> statement-breakpoint
CREATE VIEW "public"."open_tasks_view" AS (SELECT t.id, t.project_id, t.source_document_id, t.title, t.description, t.assignee, t.status, t.due_date, t.created_by, t.metadata, t.created_at, t.updated_at, p.name AS project_name, dm.title AS source_document_title FROM ai_tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN document_metadata dm ON dm.id = t.source_document_id WHERE t.status = ANY (ARRAY['open'::text, 'in_progress'::text]));--> statement-breakpoint
CREATE VIEW "public"."sov_line_items_with_percentage" AS (SELECT sli.id, sli.sov_id, sli.line_number, sli.description, sli.cost_code_id, sli.scheduled_value, sli.created_at, sli.updated_at, CASE WHEN sov.total_amount > 0::numeric THEN round(sli.scheduled_value / sov.total_amount * 100::numeric, 2) ELSE 0::numeric END AS percentage FROM sov_line_items sli JOIN schedule_of_values sov ON sov.id = sli.sov_id);--> statement-breakpoint
CREATE VIEW "public"."subcontracts_with_totals" AS (SELECT s.id, s.contract_number, s.contract_company_id, s.title, s.status, s.executed, s.default_retainage_percent, s.description, s.inclusions, s.exclusions, s.start_date, s.estimated_completion_date, s.actual_completion_date, s.contract_date, s.signed_contract_received_date, s.issued_on_date, s.is_private, s.non_admin_user_ids, s.allow_non_admin_view_sov_items, s.invoice_contact_ids, s.project_id, s.created_by, s.created_at, s.updated_at, COALESCE(sov_totals.total_amount, 0::numeric) AS total_sov_amount, COALESCE(sov_totals.total_billed, 0::numeric) AS total_billed_to_date, COALESCE(sov_totals.total_amount, 0::numeric) - COALESCE(sov_totals.total_billed, 0::numeric) AS total_amount_remaining, COALESCE(sov_totals.line_item_count, 0::bigint) AS sov_line_count, COALESCE(att_count.count, 0::bigint) AS attachment_count, c.name AS company_name, c.type AS company_type FROM subcontracts s LEFT JOIN ( SELECT subcontract_sov_items.subcontract_id, sum(subcontract_sov_items.amount) AS total_amount, sum(subcontract_sov_items.billed_to_date) AS total_billed, count(*) AS line_item_count FROM subcontract_sov_items GROUP BY subcontract_sov_items.subcontract_id) sov_totals ON s.id = sov_totals.subcontract_id LEFT JOIN ( SELECT subcontract_attachments.subcontract_id, count(*) AS count FROM subcontract_attachments GROUP BY subcontract_attachments.subcontract_id) att_count ON s.id = att_count.subcontract_id LEFT JOIN companies c ON s.contract_company_id = c.id);--> statement-breakpoint
CREATE VIEW "public"."v_budget_lines" AS (SELECT id, project_id, sub_job_id, cost_code_id, cost_type_id, description, original_amount, created_by, created_at, updated_at, COALESCE(( SELECT sum(bml.amount) AS sum FROM budget_mod_lines bml JOIN budget_modifications bm ON bml.budget_modification_id = bm.id WHERE bm.status = 'approved'::text AND bml.project_id = bl.project_id AND COALESCE(bml.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND bml.cost_code_id = bl.cost_code_id AND bml.cost_type_id = bl.cost_type_id), 0::numeric) AS budget_mod_total, COALESCE(( SELECT sum(col.amount) AS sum FROM change_order_lines col JOIN change_orders co ON col.change_order_id = co.id WHERE co.status = 'approved'::text AND col.project_id = bl.project_id AND COALESCE(col.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND col.cost_code_id = bl.cost_code_id AND col.cost_type_id = bl.cost_type_id), 0::numeric) AS approved_co_total, original_amount + COALESCE(( SELECT sum(bml.amount) AS sum FROM budget_mod_lines bml JOIN budget_modifications bm ON bml.budget_modification_id = bm.id WHERE bm.status = 'approved'::text AND bml.project_id = bl.project_id AND COALESCE(bml.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND bml.cost_code_id = bl.cost_code_id AND bml.cost_type_id = bl.cost_type_id), 0::numeric) + COALESCE(( SELECT sum(col.amount) AS sum FROM change_order_lines col JOIN change_orders co ON col.change_order_id = co.id WHERE co.status = 'approved'::text AND col.project_id = bl.project_id AND COALESCE(col.sub_job_id, '00000000-0000-0000-0000-000000000000'::uuid) = bl.sub_job_key AND col.cost_code_id = bl.cost_code_id AND col.cost_type_id = bl.cost_type_id), 0::numeric) AS revised_budget FROM budget_lines bl);--> statement-breakpoint
CREATE POLICY "Users can read text chunks" ON "fm_text_chunks" AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "project_budget_codes_insert" ON "project_budget_codes" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "project_budget_codes_select" ON "project_budget_codes" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "project_budget_codes_update" ON "project_budget_codes" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "project_budget_codes_delete" ON "project_budget_codes" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view billing periods" ON "billing_periods" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can manage billing periods" ON "billing_periods" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "nods_page" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "sync_status" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Service role has full access to project_tasks" ON "project_tasks" AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "project_tasks" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow public read access" ON "fm_table_vectors" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "employees" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow public to view employees" ON "employees" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Allow authenticated users to insert employees" ON "employees" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow authenticated users to update employees" ON "employees" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow authenticated users to delete employees" ON "employees" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow public access on projects" ON "user_projects" AS PERMISSIVE FOR ALL TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public access on recommendations" ON "design_recommendations" AS PERMISSIVE FOR ALL TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public access on cost_factors" ON "cost_factors" AS PERMISSIVE FOR ALL TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public access on asrs_configurations" ON "asrs_configurations" AS PERMISSIVE FOR ALL TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public read access on fm_sections" ON "fm_sections" AS PERMISSIVE FOR SELECT TO public USING ((is_visible = true));--> statement-breakpoint
CREATE POLICY "Allow public read access on fm_blocks" ON "fm_blocks" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "project_members_select_own" ON "project_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));--> statement-breakpoint
CREATE POLICY "project_members_insert_for_authenticated" ON "project_members" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "project_members_update_own" ON "project_members" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "project_members_admin_update" ON "project_members" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "budget_line_history_select_for_authenticated" ON "budget_line_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "budget_line_history_insert_for_authenticated" ON "budget_line_history" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can view payments in their projects" ON "contract_payments" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_payments.contract_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create payments" ON "contract_payments" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update payments" ON "contract_payments" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete payments" ON "contract_payments" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view billing periods in their projects" ON "contract_billing_periods" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_billing_periods.contract_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create billing periods" ON "contract_billing_periods" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update billing periods" ON "contract_billing_periods" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete billing periods" ON "contract_billing_periods" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Authenticated users can manage submittals" ON "submittals" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Authenticated users can view subcontractors" ON "subcontractors" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Authenticated users can insert subcontractors" ON "subcontractors" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Authenticated users can update subcontractors" ON "subcontractors" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow authenticated insert" ON "files" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow public read" ON "files" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Allow authenticated delete" ON "files" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can view their own requests" ON "requests" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Admins can view all requests" ON "requests" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can insert requests" ON "requests" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Deny delete for requests" ON "requests" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own profile" ON "user_profiles" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Only admins can change admin status" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Admins can view all profiles" ON "user_profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update all profiles" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Deny delete for user_profiles" ON "user_profiles" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can update own profile" ON "users" AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can view own profile" ON "users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Public profiles are viewable by everyone." ON "profiles" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can insert their own profile." ON "profiles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own profile." ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "nods_page_section" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can view vendors in their company" ON "vendors" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM companies
  WHERE ((companies.id = vendors.company_id) AND (EXISTS ( SELECT 1
           FROM project_members
          WHERE (project_members.user_id = auth.uid())))))));--> statement-breakpoint
CREATE POLICY "Editors can create vendors" ON "vendors" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update vendors" ON "vendors" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete vendors" ON "vendors" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own views" ON "contract_views" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can view shared views in their company" ON "contract_views" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can create their own views" ON "contract_views" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their own views" ON "contract_views" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their own views" ON "contract_views" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view snapshots in their projects" ON "contract_snapshots" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_snapshots.contract_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create snapshots" ON "contract_snapshots" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete snapshots" ON "contract_snapshots" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view documents in their projects" ON "contract_documents" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_documents.contract_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can upload documents" ON "contract_documents" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update documents" ON "contract_documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete documents" ON "contract_documents" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "documents" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Service role has full access" ON "documents" AS PERMISSIVE FOR ALL TO "service_role";--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "documents" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Enable update for authenticated users" ON "documents" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Enable delete for authenticated users" ON "documents" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Figures are viewable by authenticated users" ON "fm_global_figures" AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "Figures are viewable by anonymous users" ON "fm_global_figures" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view budget modification lines" ON "budget_modification_lines" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "Users can view commitment lines" ON "commitment_lines" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "clients" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "projects_select_for_members" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "projects_insert_authenticated" ON "projects" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "projects_select_member_unarchived" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "projects_update_unarchive_admin" ON "projects" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "projects_update_for_members" ON "projects" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can view commitment change order lines" ON "commitment_change_order_lines" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "Users can view commitment change orders" ON "commitment_change_orders" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (commitments c
     JOIN project_members pm ON ((pm.project_id = c.project_id)))
  WHERE ((c.id = commitment_change_orders.commitment_id) AND (pm.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create commitment change orders" ON "commitment_change_orders" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Allow public read access to crawled_pages" ON "crawled_pages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public read access to sources" ON "sources" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can view direct costs in their projects" ON "direct_costs" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = direct_costs.project_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create direct costs" ON "direct_costs" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Allow public read access to code_examples" ON "code_examples" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can view change event line items" ON "change_event_line_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (change_events ce
     JOIN project_members pm ON ((pm.project_id = ce.project_id)))
  WHERE ((ce.id = change_event_line_items.change_event_id) AND (pm.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create change event line items" ON "change_event_line_items" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view change events in their projects" ON "change_events" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = change_events.project_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create change events" ON "change_events" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update all conversations" ON "conversations" AS PERMISSIVE FOR UPDATE TO public USING (is_admin());--> statement-breakpoint
CREATE POLICY "Admins can insert conversations" ON "conversations" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Deny delete for conversations" ON "conversations" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own conversations" ON "conversations" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can insert their own conversations" ON "conversations" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their own conversations" ON "conversations" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can view all conversations" ON "conversations" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own messages" ON "messages" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = computed_session_user_id));--> statement-breakpoint
CREATE POLICY "Users can insert messages in their conversations" ON "messages" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can view all messages" ON "messages" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can insert messages" ON "messages" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Deny delete for messages" ON "messages" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "zapier_access_policy" ON "document_metadata" AS PERMISSIVE FOR ALL TO "zapier" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "zapier_full_access" ON "document_metadata" AS PERMISSIVE FOR ALL TO "zapier";--> statement-breakpoint
CREATE POLICY "team_update" ON "document_metadata" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "admin_all_access" ON "document_metadata" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "leadership_update" ON "document_metadata" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "leadership_access" ON "document_metadata" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "leadership_insert" ON "document_metadata" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "leadership_delete" ON "document_metadata" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "team_access" ON "document_metadata" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "team_insert" ON "document_metadata" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "users_can_read_docs" ON "document_metadata" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "document_chunks" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable write access for authenticated users" ON "document_chunks" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Allow anon users to view ai_insights" ON "ai_insights" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow authenticated users full access to ai_insights" ON "ai_insights" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "ai_insights_select_project_visible" ON "ai_insights" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "sub_jobs_read" ON "sub_jobs" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "sub_jobs_write" ON "sub_jobs" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "direct_cost_line_items_read" ON "direct_cost_line_items" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "direct_cost_line_items_write" ON "direct_cost_line_items" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Allow authenticated users select" ON "companies" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can view SOVs for their projects" ON "schedule_of_values" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can manage SOVs for their projects" ON "schedule_of_values" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Service role can manage all users" ON "app_users" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Users can read own data" ON "app_users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Service role can insert users" ON "app_users" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own data" ON "app_users" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Individuals can create todos." ON "todos" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Individuals can view their own todos. " ON "todos" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Individuals can update their own todos." ON "todos" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Individuals can delete their own todos." ON "todos" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view SOV line items" ON "sov_line_items" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can manage SOV line items" ON "sov_line_items" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view vertical markup" ON "vertical_markup" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can manage vertical markup" ON "vertical_markup" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view commitments in their projects" ON "commitments" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = commitments.project_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create commitments" ON "commitments" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update commitments" ON "commitments" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view SOV items" ON "subcontract_sov_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (subcontracts s
     JOIN project_users pu ON ((pu.project_id = s.project_id)))
  WHERE ((s.id = subcontract_sov_items.subcontract_id) AND (pu.user_id = auth.uid()) AND ((s.is_private = false) OR (auth.uid() = ANY (s.non_admin_user_ids)) OR ((s.allow_non_admin_view_sov_items = true) AND (auth.uid() = ANY (s.non_admin_user_ids))))))));--> statement-breakpoint
CREATE POLICY "Users can manage SOV items" ON "subcontract_sov_items" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view subcontracts for their projects" ON "subcontracts" AS PERMISSIVE FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM project_users pu
  WHERE ((pu.project_id = subcontracts.project_id) AND (pu.user_id = auth.uid())))) OR (is_private = false) OR ((is_private = true) AND (auth.uid() = ANY (non_admin_user_ids)))));--> statement-breakpoint
CREATE POLICY "Users can create subcontracts for their projects" ON "subcontracts" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update subcontracts for their projects" ON "subcontracts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete subcontracts for their projects" ON "subcontracts" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view project directory" ON "project_directory" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can manage project directory" ON "project_directory" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view contracts in their projects" ON "prime_contracts" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM project_members
  WHERE ((project_members.project_id = prime_contracts.project_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create contracts" ON "prime_contracts" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update contracts" ON "prime_contracts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete contracts" ON "prime_contracts" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view attachments" ON "subcontract_attachments" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (subcontracts s
     JOIN project_users pu ON ((pu.project_id = s.project_id)))
  WHERE ((s.id = subcontract_attachments.subcontract_id) AND (pu.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Users can manage attachments" ON "subcontract_attachments" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "budget_views_select_policy" ON "budget_views" AS PERMISSIVE FOR SELECT TO public USING ((project_id IN ( SELECT p.id
   FROM (projects p
     JOIN project_users pu ON ((p.id = pu.project_id)))
  WHERE (pu.user_id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "budget_views_insert_policy" ON "budget_views" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "budget_views_update_policy" ON "budget_views" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "budget_views_delete_policy" ON "budget_views" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "budget_view_columns_select_policy" ON "budget_view_columns" AS PERMISSIVE FOR SELECT TO public USING ((view_id IN ( SELECT bv.id
   FROM ((budget_views bv
     JOIN projects p ON ((bv.project_id = p.id)))
     JOIN project_users pu ON ((p.id = pu.project_id)))
  WHERE (pu.user_id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "budget_view_columns_insert_policy" ON "budget_view_columns" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "budget_view_columns_update_policy" ON "budget_view_columns" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "budget_view_columns_delete_policy" ON "budget_view_columns" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view line items in their projects" ON "contract_line_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_line_items.contract_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create line items" ON "contract_line_items" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update line items" ON "contract_line_items" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete line items" ON "contract_line_items" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "change_order_lines_select" ON "change_order_lines" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "change_order_lines_insert" ON "change_order_lines" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "change_order_lines_update" ON "change_order_lines" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "change_order_lines_delete" ON "change_order_lines" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "budget_mod_lines_select" ON "budget_mod_lines" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "budget_mod_lines_insert" ON "budget_mod_lines" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "budget_mod_lines_update" ON "budget_mod_lines" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "budget_mod_lines_delete" ON "budget_mod_lines" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "budget_lines_select" ON "budget_lines" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "budget_lines_insert" ON "budget_lines" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "budget_lines_update" ON "budget_lines" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "budget_lines_delete" ON "budget_lines" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "budget_modifications_select" ON "budget_modifications" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));--> statement-breakpoint
CREATE POLICY "budget_modifications_insert" ON "budget_modifications" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "budget_modifications_update" ON "budget_modifications" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "budget_modifications_delete" ON "budget_modifications" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view budget modifications in their projects" ON "budget_modifications" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Editors can create budget modifications" ON "budget_modifications" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update budget modifications" ON "budget_modifications" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view change orders in their projects" ON "contract_change_orders" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (prime_contracts
     JOIN project_members ON ((project_members.project_id = prime_contracts.project_id)))
  WHERE ((prime_contracts.id = contract_change_orders.contract_id) AND (project_members.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Editors can create change orders" ON "contract_change_orders" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Editors can update change orders" ON "contract_change_orders" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can delete change orders" ON "contract_change_orders" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Admins manage document_user_access" ON "document_user_access" AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'admin'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));--> statement-breakpoint
CREATE POLICY "Admins manage document_group_access" ON "document_group_access" AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'admin'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));
*/