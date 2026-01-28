import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

/**
 * ENV
 */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PROCORE_MODULE,
  CRAWL_ROOT_DIR = "./procore-crawls"
} = process.env;

if (!PROCORE_MODULE) {
  throw new Error("Missing PROCORE_MODULE env var (e.g. scheduling)");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Paths
 */
const MODULE_DIR = path.join(CRAWL_ROOT_DIR, PROCORE_MODULE);
const SPEC_DIR = path.join(MODULE_DIR, "spec");

await fs.ensureDir(SPEC_DIR);

/**
 * Fetch promoted domain commands
 */
async function loadCommands() {
  const { data, error } = await supabase
    .from("app_commands")
    .select("*")
    .eq("module", PROCORE_MODULE)
    .order("command_key");

  if (error) throw error;
  return data;
}

/**
 * Generate COMMANDS.md
 */
function generateCommandsMd(commands) {
  let md = `# ${PROCORE_MODULE.toUpperCase()} — Domain Commands\n\n`;
  md += `This file lists all promoted domain commands derived from Procore behavior.\n\n`;

  md += `| Command Key | Label | Description | Action Count |\n`;
  md += `|------------|-------|-------------|--------------|\n`;

  for (const c of commands) {
    md += `| ${c.command_key} | ${c.label} | ${c.description || ""} | ${c.action_count || 0} |\n`;
  }

  return md;
}

/**
 * Generate FORMS.md
 */
function generateFormsMd(commands) {
  let md = `# ${PROCORE_MODULE.toUpperCase()} — UI Forms\n\n`;
  md += `This document defines all UI forms required to implement the ${PROCORE_MODULE} module.\n\n`;

  for (const c of commands) {
    md += `## ${c.label}\n\n`;
    md += `**Command:** \`${c.command_key}\`\n\n`;

    md += `| Field | Label | Type | Required | Source Table | Notes |\n`;
    md += `|------|-------|------|----------|--------------|-------|\n`;

    // We intentionally leave fields blank — this becomes an explicit design task
    md += `|  |  |  |  |  |  |\n\n`;
  }

  return md;
}

/**
 * Generate schema.sql
 * (Authoritative, no prose)
 */
function generateSchemaSql() {
  return `-- ${PROCORE_MODULE.toUpperCase()} DOMAIN SCHEMA
-- Generated from Procore command analysis

create table app_schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  name text not null,
  start_date date,
  finish_date date,
  duration_days int,
  percent_complete int,
  status text,
  created_at timestamptz default now()
);

create table app_schedule_dependencies (
  id uuid primary key default gen_random_uuid(),
  predecessor_task_id uuid references app_schedule_tasks(id),
  successor_task_id uuid references app_schedule_tasks(id),
  dependency_type text not null,
  lag_days int default 0
);

create table app_schedule_deadlines (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references app_schedule_tasks(id),
  deadline_date date not null,
  created_at timestamptz default now()
);
`;
}

/**
 * README.md
 */
function generateReadme() {
  return `# ${PROCORE_MODULE.toUpperCase()} Spec

This folder contains all generated specification artifacts for the
**${PROCORE_MODULE}** Procore module.

## Files

- \`COMMANDS.md\` — Domain command reference
- \`FORMS.md\` — UI form requirements
- \`schema.sql\` — Authoritative database schema

All files are auto-generated and safe to regenerate.

## Implementation Plan

For the comprehensive implementation plan, run \`/prp-create ${PROCORE_MODULE}\`
which generates a full PRP with HTML output at \`PRPs/${PROCORE_MODULE}/\`.
`;
}

/**
 * Main
 */
(async function run() {
  console.log(`📘 Generating spec for module: ${PROCORE_MODULE}`);

  const commands = await loadCommands();

  await fs.writeFile(
    path.join(SPEC_DIR, "COMMANDS.md"),
    generateCommandsMd(commands)
  );

  await fs.writeFile(
    path.join(SPEC_DIR, "FORMS.md"),
    generateFormsMd(commands)
  );

  await fs.writeFile(
    path.join(SPEC_DIR, "schema.sql"),
    generateSchemaSql()
  );

  await fs.writeFile(
    path.join(SPEC_DIR, "README.md"),
    generateReadme()
  );

  console.log("✅ Spec artifacts generated");
})();
