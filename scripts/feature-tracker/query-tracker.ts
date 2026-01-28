#!/usr/bin/env npx tsx
/**
 * query-tracker.ts
 *
 * CLI tool for querying the local SQLite feature tracker database.
 * Supports listing features, pages, tables, and schema; viewing page
 * details with Procore URLs and screenshot paths; and exporting to
 * CSV or JSON.
 *
 * Usage:
 *   npx tsx query-tracker.ts features              # List all features
 *   npx tsx query-tracker.ts pages <feature>       # List pages for a feature
 *   npx tsx query-tracker.ts view <feature> [page] # Full details with URLs
 *   npx tsx query-tracker.ts tables                # List all Supabase tables
 *   npx tsx query-tracker.ts schema <table>        # Show table schema
 *   npx tsx query-tracker.ts mapping               # Show feature-table mappings
 *   npx tsx query-tracker.ts export-csv            # Export pages to CSV
 *   npx tsx query-tracker.ts export-json           # Export everything to JSON
 */

import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'tracker.db');
const db = new Database(DB_PATH, { readonly: true });

function printTable(rows: Record<string, unknown>[], columns?: string[]) {
  if (rows.length === 0) {
    console.log('No results');
    return;
  }

  const cols = columns || Object.keys(rows[0]);

  // Calculate column widths
  const widths: Record<string, number> = {};
  for (const col of cols) {
    widths[col] = Math.max(
      col.length,
      ...rows.map(r => String(r[col] ?? '').length)
    );
    widths[col] = Math.min(widths[col], 50); // Cap at 50 chars
  }

  // Header
  const header = cols.map(c => c.padEnd(widths[c])).join(' | ');
  console.log(header);
  console.log(cols.map(c => '-'.repeat(widths[c])).join('-+-'));

  // Rows
  for (const row of rows) {
    const line = cols.map(c => {
      const val = String(row[c] ?? '').substring(0, 50);
      return val.padEnd(widths[c]);
    }).join(' | ');
    console.log(line);
  }

  console.log(`\n(${rows.length} rows)`);
}

function listFeatures() {
  const rows = db.prepare(`
    SELECT
      slug,
      name,
      priority,
      status,
      COALESCE(match_score, 0) as match_score,
      (SELECT COUNT(*) FROM procore_pages WHERE feature_id = f.id) as pages
    FROM procore_features f
    ORDER BY
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      name
  `).all();

  console.log('\n📦 PROCORE FEATURES\n');
  printTable(rows as Record<string, unknown>[], ['slug', 'name', 'priority', 'status', 'pages']);
}

function listPages(featureSlug?: string) {
  let query = `
    SELECT
      p.slug,
      p.name,
      p.page_type,
      p.status,
      CASE WHEN p.procore_url IS NOT NULL THEN '✓' ELSE '' END as has_url,
      CASE WHEN p.screenshot_path IS NOT NULL THEN '✓' ELSE '' END as has_screenshot
    FROM procore_pages p
  `;

  const params: string[] = [];

  if (featureSlug) {
    query += ' WHERE p.feature_id = ?';
    params.push(featureSlug);
  }

  query += ' ORDER BY p.feature_id, p.name';

  const rows = db.prepare(query).all(...params);

  console.log(`\n📄 PROCORE PAGES${featureSlug ? ` (${featureSlug})` : ''}\n`);
  printTable(rows as Record<string, unknown>[], ['slug', 'name', 'page_type', 'status', 'has_url', 'has_screenshot']);
}

function listTables() {
  const rows = db.prepare(`
    SELECT
      id as table_name,
      table_type,
      column_count,
      (SELECT GROUP_CONCAT(f.slug, ', ')
       FROM feature_table_mapping m
       JOIN procore_features f ON f.id = m.feature_id
       WHERE m.table_id = t.id) as features
    FROM supabase_tables t
    ORDER BY id
  `).all();

  console.log('\n🗄️ SUPABASE TABLES\n');
  printTable(rows as Record<string, unknown>[], ['table_name', 'table_type', 'column_count', 'features']);
}

function showSchema(tableName: string) {
  const columns = db.prepare(`
    SELECT
      column_name,
      data_type,
      CASE WHEN is_nullable THEN 'YES' ELSE 'NO' END as nullable,
      CASE WHEN is_primary_key THEN 'PK' ELSE '' END as pk,
      CASE WHEN is_foreign_key THEN references_table || '.' || references_column ELSE '' END as fk
    FROM supabase_columns
    WHERE table_id = ?
    ORDER BY column_name
  `).all(tableName);

  if (columns.length === 0) {
    console.log(`Table '${tableName}' not found`);
    return;
  }

  console.log(`\n📋 SCHEMA: ${tableName}\n`);
  printTable(columns as Record<string, unknown>[]);
}

function showMapping() {
  const rows = db.prepare(`
    SELECT
      f.slug as feature,
      f.priority,
      t.id as table_name,
      m.relationship_type as rel_type,
      t.column_count as columns
    FROM feature_table_mapping m
    JOIN procore_features f ON f.id = m.feature_id
    JOIN supabase_tables t ON t.id = m.table_id
    ORDER BY f.slug, m.relationship_type
  `).all();

  console.log('\n🔗 FEATURE → TABLE MAPPING\n');
  printTable(rows as Record<string, unknown>[]);
}

function exportCsv() {
  const rows = db.prepare(`
    SELECT
      p.id,
      f.name as feature,
      f.priority as feature_priority,
      p.name as page_name,
      p.slug as page_slug,
      p.page_type,
      p.status,
      p.procore_url,
      p.screenshot_path,
      p.alleato_route,
      p.button_count,
      p.form_field_count,
      p.table_column_count,
      p.implementation_notes
    FROM procore_pages p
    JOIN procore_features f ON f.id = p.feature_id
    ORDER BY f.priority, f.name, p.name
  `).all() as Record<string, unknown>[];

  if (rows.length === 0) {
    console.log('No data to export');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\n');

  const outPath = join(__dirname, 'pages-export.csv');
  writeFileSync(outPath, csv);
  console.log(`✓ Exported ${rows.length} pages to ${outPath}`);
}

function exportJson() {
  const features = db.prepare(`
    SELECT * FROM procore_features ORDER BY priority, name
  `).all();

  const pages = db.prepare(`
    SELECT * FROM procore_pages ORDER BY feature_id, name
  `).all();

  const tables = db.prepare(`
    SELECT * FROM supabase_tables ORDER BY id
  `).all();

  const mappings = db.prepare(`
    SELECT * FROM feature_table_mapping
  `).all();

  const data = {
    exportedAt: new Date().toISOString(),
    features,
    pages,
    tables,
    mappings,
    stats: {
      featureCount: features.length,
      pageCount: pages.length,
      tableCount: tables.length,
    }
  };

  const outPath = join(__dirname, 'tracker-export.json');
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`✓ Exported to ${outPath}`);
}

function viewPage(featureSlug: string, pageSlug?: string) {
  if (!pageSlug) {
    // Show all pages for this feature with full details
    const rows = db.prepare(`
      SELECT
        p.slug,
        p.name,
        p.page_type,
        p.procore_url,
        p.screenshot_path
      FROM procore_pages p
      WHERE p.feature_id = ?
      ORDER BY p.name
    `).all(featureSlug) as Array<{
      slug: string;
      name: string;
      page_type: string;
      procore_url: string | null;
      screenshot_path: string | null;
    }>;

    if (rows.length === 0) {
      console.log(`No pages found for feature '${featureSlug}'`);
      console.log(`\nAvailable features:`);
      const features = db.prepare(`SELECT slug FROM procore_features ORDER BY slug`).all() as Array<{slug: string}>;
      features.forEach(f => console.log(`  - ${f.slug}`));
      return;
    }

    console.log(`\n📄 ${featureSlug.toUpperCase()} - ${rows.length} PAGES\n`);
    console.log('=' .repeat(80));

    for (const row of rows) {
      console.log(`\n📌 ${row.name} (${row.page_type})`);
      console.log(`   Slug: ${row.slug}`);
      if (row.procore_url) {
        console.log(`   Procore URL: ${row.procore_url}`);
      }
      if (row.screenshot_path) {
        console.log(`   Screenshot: ${row.screenshot_path}`);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log(`\nTo view a specific page: npx tsx query-tracker.ts view ${featureSlug} <slug>`);
  } else {
    // Show single page detail
    const row = db.prepare(`
      SELECT
        p.*,
        f.name as feature_name
      FROM procore_pages p
      JOIN procore_features f ON f.id = p.feature_id
      WHERE p.feature_id = ? AND p.slug = ?
    `).get(featureSlug, pageSlug) as Record<string, unknown> | undefined;

    if (!row) {
      console.log(`Page '${pageSlug}' not found in feature '${featureSlug}'`);
      return;
    }

    console.log(`\n📄 PAGE DETAILS\n`);
    console.log('=' .repeat(80));
    console.log(`Feature:     ${row.feature_name}`);
    console.log(`Page:        ${row.name}`);
    console.log(`Type:        ${row.page_type}`);
    console.log(`Status:      ${row.status}`);
    console.log('');
    if (row.procore_url) {
      console.log(`Procore URL: ${row.procore_url}`);
    }
    if (row.screenshot_path) {
      console.log(`Screenshot:  ${row.screenshot_path}`);
    }
    if (row.dom_path) {
      console.log(`DOM HTML:    ${row.dom_path}`);
    }
    if (row.metadata_path) {
      console.log(`Metadata:    ${row.metadata_path}`);
    }
    console.log('=' .repeat(80));

    if (row.screenshot_path) {
      console.log(`\n💡 Open screenshot: open "${row.screenshot_path}"`);
    }
  }
}

function showHelp() {
  console.log(`
Feature Tracker Query Tool

Usage:
  npx tsx query-tracker.ts <command> [args]

Commands:
  features              List all Procore features with status
  pages [feature]       List pages (optionally filter by feature)
  view <feature> [page] Show full details with URLs & paths you can open
  tables                List all Supabase tables
  schema <table>        Show columns for a table
  mapping               Show feature → table mappings
  export-csv            Export all pages to CSV
  export-json           Export everything to JSON

Examples:
  npx tsx query-tracker.ts features
  npx tsx query-tracker.ts view prime-contracts        # See all pages with URLs
  npx tsx query-tracker.ts view prime-contracts create # See specific page
  npx tsx query-tracker.ts schema prime_contracts
`);
}

// Main
const [, , command, arg] = process.argv;

const [, , , , arg2] = process.argv;

switch (command) {
  case 'features':
    listFeatures();
    break;
  case 'pages':
    listPages(arg);
    break;
  case 'view':
    if (!arg) {
      console.log('Usage: query-tracker.ts view <feature> [page]');
      console.log('\nAvailable features:');
      const features = db.prepare(`SELECT slug FROM procore_features ORDER BY slug`).all() as Array<{slug: string}>;
      features.forEach(f => console.log(`  - ${f.slug}`));
      process.exit(1);
    }
    viewPage(arg, arg2);
    break;
  case 'tables':
    listTables();
    break;
  case 'schema':
    if (!arg) {
      console.log('Usage: query-tracker.ts schema <table_name>');
      process.exit(1);
    }
    showSchema(arg);
    break;
  case 'mapping':
    showMapping();
    break;
  case 'export-csv':
    exportCsv();
    break;
  case 'export-json':
    exportJson();
    break;
  default:
    showHelp();
}

db.close();
