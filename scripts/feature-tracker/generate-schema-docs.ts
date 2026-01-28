#!/usr/bin/env npx tsx
/**
 * generate-schema-docs.ts
 *
 * Reads the local SQLite tracker database and generates a comprehensive
 * markdown document (SCHEMA-DOCUMENTATION.md) that compares the current
 * Supabase schema against Procore UI requirements from crawled data.
 * Includes calculated field recommendations and schema issue callouts.
 *
 * Usage: npx tsx generate-schema-docs.ts
 */

import Database from 'better-sqlite3';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'tracker.db');
const PROJECT_ROOT = join(__dirname, '../..');
const TYPES_FILE = join(PROJECT_ROOT, 'frontend/src/types/database.types.ts');

const db = new Database(DB_PATH, { readonly: true });

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  priority: string;
}

interface TableInfo {
  id: string;
  table_type: string;
  column_count: number;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
}

// Map features to their primary tables with schema recommendations
const SCHEMA_RECOMMENDATIONS: Record<string, {
  tables: string[];
  missingColumns?: string[];
  wrongColumns?: string[];
  calculatedFields?: string[];
  notes?: string;
}> = {
  'prime-contracts': {
    tables: ['prime_contracts', 'prime_contract_sovs', 'contract_line_items', 'owner_invoices', 'prime_contract_change_orders'],
    missingColumns: [
      'executed_at (TIMESTAMP) - When contract was signed/executed',
    ],
    wrongColumns: [
      'vendor_id should be client_id - Prime contracts are WITH clients/owners, not vendors',
      'revised_contract_value should be CALCULATED, not stored',
    ],
    calculatedFields: [
      'revised_contract_value = original_contract_value + SUM(approved_change_orders)',
      'approved_cos = SUM(change_orders WHERE status = approved)',
      'pending_cos = SUM(change_orders WHERE status = pending)',
      'invoiced = SUM(owner_invoices.amount)',
      'payments_received = SUM(payment_transactions.amount)',
      'percent_paid = payments_received / revised_contract_value * 100',
      'remaining_balance = revised_contract_value - payments_received',
    ],
    notes: 'Critical: This is one of the most complex features. The current schema stores redundant data and uses wrong entity relationships.'
  },
  'commitments': {
    tables: ['subcontracts', 'purchase_orders', 'subcontract_sov_items', 'purchase_order_sov_items', 'commitment_change_order_lines'],
    calculatedFields: [
      'revised_contract_value = original_value + approved_cos',
      'remaining_to_invoice = revised_contract_value - invoiced_amount',
      'percent_complete = invoiced_amount / revised_contract_value * 100',
    ],
  },
  'budget': {
    tables: ['budget_lines', 'budget_modifications', 'budget_mod_lines', 'budget_views', 'v_budget_lines'],
    calculatedFields: [
      'revised_budget = original_budget + budget_modifications',
      'committed = SUM(commitments WHERE budget_code matches)',
      'actual_costs = SUM(direct_costs) + SUM(invoiced_commitments)',
      'projected_cost = actual_costs + remaining_commitments',
      'over_under = revised_budget - projected_cost',
      'percent_complete = actual_costs / revised_budget * 100',
    ],
  },
  'change-events': {
    tables: ['change_events', 'change_event_line_items', 'change_event_approvals', 'change_event_attachments'],
    calculatedFields: [
      'total_amount = SUM(line_items.amount)',
      'rom_total = SUM(line_items.rom_amount)',
    ],
  },
  'change-orders': {
    tables: ['change_orders', 'change_order_lines', 'change_order_costs', 'change_order_approvals'],
    calculatedFields: [
      'total_amount = SUM(line_items.amount)',
      'approved_amount = total_amount WHERE status = approved',
    ],
  },
  'direct-costs': {
    tables: ['direct_costs', 'direct_cost_line_items'],
    calculatedFields: [
      'total_amount = SUM(line_items.amount)',
    ],
  },
  'invoicing': {
    tables: ['invoices', 'owner_invoices', 'owner_invoice_line_items', 'payment_transactions'],
    calculatedFields: [
      'total_billed = SUM(line_items.amount)',
      'retention_amount = total_billed * retention_percent',
      'net_amount = total_billed - retention_amount',
      'balance_due = net_amount - payments_received',
    ],
  },
};

function generateSchemaDoc(): string {
  const features = db.prepare(`
    SELECT * FROM procore_features
    WHERE priority IN ('critical', 'high')
    ORDER BY
      CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
      name
  `).all() as Feature[];

  let doc = `# Alleato-Procore Database Schema Documentation

> Auto-generated from feature tracker database
> Generated: ${new Date().toISOString()}

## Overview

This document provides:
1. Current Supabase schema for each feature
2. Procore UI requirements (from crawled pages)
3. Calculated fields that should be views, not stored columns
4. Recommended schema changes

---

## Table of Contents

${features.map(f => `- [${f.name}](#${f.slug})`).join('\n')}
- [Full Table List](#full-table-list)

---

`;

  for (const feature of features) {
    const recommendations = SCHEMA_RECOMMENDATIONS[feature.slug];

    // Get related tables
    const tables = db.prepare(`
      SELECT t.id, t.table_type, t.column_count
      FROM supabase_tables t
      JOIN feature_table_mapping m ON m.table_id = t.id
      WHERE m.feature_id = ?
      ORDER BY m.relationship_type, t.id
    `).all(feature.id) as TableInfo[];

    // Get page count
    const pageCount = db.prepare(`
      SELECT COUNT(*) as count FROM procore_pages WHERE feature_id = ?
    `).get(feature.id) as { count: number };

    doc += `## ${feature.name} {#${feature.slug}}

**Priority:** ${feature.priority.toUpperCase()}
**Description:** ${feature.description || 'No description'}
**Crawled Pages:** ${pageCount.count}

### Related Tables

`;

    if (tables.length === 0 && recommendations?.tables) {
      doc += `*No tables currently mapped. Recommended tables:*\n`;
      for (const t of recommendations.tables) {
        doc += `- \`${t}\`\n`;
      }
    } else {
      for (const table of tables) {
        doc += `#### \`${table.id}\`

**Type:** ${table.table_type}
**Columns:** ${table.column_count}

| Column | Type | Notes |
|--------|------|-------|
`;

        const columns = db.prepare(`
          SELECT column_name, data_type, is_nullable
          FROM supabase_columns
          WHERE table_id = ?
          ORDER BY column_name
        `).all(table.id) as ColumnInfo[];

        for (const col of columns) {
          const nullable = col.is_nullable ? 'nullable' : 'required';
          doc += `| ${col.column_name} | ${col.data_type} | ${nullable} |\n`;
        }

        doc += '\n';
      }
    }

    // Add recommendations
    if (recommendations) {
      if (recommendations.missingColumns && recommendations.missingColumns.length > 0) {
        doc += `### Missing Columns

${recommendations.missingColumns.map(c => `- ❌ ${c}`).join('\n')}

`;
      }

      if (recommendations.wrongColumns && recommendations.wrongColumns.length > 0) {
        doc += `### Schema Issues

${recommendations.wrongColumns.map(c => `- ⚠️ ${c}`).join('\n')}

`;
      }

      if (recommendations.calculatedFields && recommendations.calculatedFields.length > 0) {
        doc += `### Calculated Fields (Should be VIEWs)

These fields should NOT be stored - they should be calculated in database views:

| Field | Formula |
|-------|---------|
${recommendations.calculatedFields.map(f => {
  const [field, ...formula] = f.split(' = ');
  return `| \`${field.trim()}\` | \`${formula.join(' = ').trim()}\` |`;
}).join('\n')}

`;
      }

      if (recommendations.notes) {
        doc += `### Notes

${recommendations.notes}

`;
      }
    }

    doc += `---

`;
  }

  // Full table list
  doc += `## Full Table List

All tables in the Supabase schema:

| Table | Type | Columns | Features |
|-------|------|---------|----------|
`;

  const allTables = db.prepare(`
    SELECT
      t.id,
      t.table_type,
      t.column_count,
      (SELECT GROUP_CONCAT(f.slug, ', ')
       FROM feature_table_mapping m
       JOIN procore_features f ON f.id = m.feature_id
       WHERE m.table_id = t.id) as features
    FROM supabase_tables t
    ORDER BY t.id
  `).all() as (TableInfo & { features: string | null })[];

  for (const table of allTables) {
    doc += `| \`${table.id}\` | ${table.table_type} | ${table.column_count} | ${table.features || '-'} |\n`;
  }

  doc += `

---

## How to Use This Document

1. **Review each feature section** to understand the current schema
2. **Check calculated fields** - these should be views, not stored columns
3. **Note schema issues** - wrong relationships, missing columns
4. **Create migrations** to fix issues
5. **Update types** after migrations: \`npx supabase gen types typescript ...\`

## Recommended Action Items

1. Create database views for calculated fields
2. Fix the \`prime_contracts.vendor_id\` → \`client_id\` issue
3. Ensure \`revised_contract_value\` is calculated, not stored
4. Add missing columns identified above
5. Set up proper foreign key relationships

---

*This document should be regenerated after schema changes.*
`;

  return doc;
}

function main() {
  console.log('Generating schema documentation...\n');

  const doc = generateSchemaDoc();

  const outPath = join(__dirname, 'SCHEMA-DOCUMENTATION.md');
  writeFileSync(outPath, doc);

  console.log(`✓ Generated: ${outPath}`);

  // Also save to main documentation folder
  const docPath = join(PROJECT_ROOT, 'documentation', 'SCHEMA-DOCUMENTATION.md');
  writeFileSync(docPath, doc);
  console.log(`✓ Copied to: ${docPath}`);
}

main();

db.close();
