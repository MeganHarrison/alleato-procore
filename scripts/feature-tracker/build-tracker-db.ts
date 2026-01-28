#!/usr/bin/env npx tsx
/**
 * Build Feature Tracker Database
 *
 * This script:
 * 1. Parses all crawled Procore pages
 * 2. Extracts metadata (URLs, components, etc.)
 * 3. Parses the Supabase types file
 * 4. Creates a SQLite database with everything organized
 *
 * Usage:
 *   npx tsx tools/feature-tracker/build-tracker-db.ts
 */

import Database from 'better-sqlite3';
import { readdir, readFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '../..');
const PLANS_DIR = join(PROJECT_ROOT, 'apps/docs/pages/PLANS');
const TYPES_FILE = join(PROJECT_ROOT, 'frontend/src/types/database.types.ts');
const DB_PATH = join(__dirname, 'tracker.db');

// Feature metadata - priority and descriptions
const FEATURE_METADATA: Record<string, { priority: string; description: string }> = {
  'budget': { priority: 'critical', description: 'Project budget tracking, cost codes, and financial overview' },
  'budget-forecasting': { priority: 'high', description: 'Budget projections and forecasting' },
  'change-events': { priority: 'critical', description: 'Potential changes before they become change orders' },
  'change-orders': { priority: 'critical', description: 'Contract modifications and change management' },
  'commitments': { priority: 'critical', description: 'Subcontracts and purchase orders' },
  'direct-costs': { priority: 'critical', description: 'Labor, materials, equipment tracking' },
  'invoicing': { priority: 'critical', description: 'Billing and payment applications' },
  'prime-contracts': { priority: 'critical', description: 'Owner contracts (GC perspective)' },
  'daily-logs': { priority: 'high', description: 'Daily field reports and logs' },
  'rfis': { priority: 'high', description: 'Requests for Information' },
  'submittals': { priority: 'high', description: 'Document submittals and approvals' },
  'meetings': { priority: 'medium', description: 'Meeting management and minutes' },
  'schedule': { priority: 'medium', description: 'Project scheduling and timeline' },
  'scheduling': { priority: 'medium', description: 'Schedule management' },
  'punch-list': { priority: 'medium', description: 'Deficiency tracking and closeout' },
  'directory': { priority: 'medium', description: 'Companies, contacts, and users' },
  'drawings': { priority: 'low', description: 'Drawing management' },
  'specifications': { priority: 'low', description: 'Project specifications' },
  'photos': { priority: 'low', description: 'Photo documentation' },
  'emails': { priority: 'low', description: 'Email integration' },
  'forms': { priority: 'low', description: 'Custom forms framework' },
};

// Pages to skip (noise)
const SKIP_PATTERNS = [
  /^\d{15,}$/,           // Numbered IDs like 562949953443325
  /_dropdown_\d+$/,      // Dropdown captures
  /^procore-support/,    // Support docs (different purpose)
];

interface PageMetadata {
  url?: string;
  actualUrl?: string;
  title?: string;
  viewName?: string;
  parentPage?: string;
  dropdownIndex?: number;
  analysis?: {
    components?: {
      buttons?: number;
      forms?: number;
      tables?: number;
    };
    tables?: Array<{ headers?: string[]; rows?: number }>;
    buttons?: Array<{ text: string }>;
    forms?: Array<{ fields: Array<{ name: string; type: string; required?: boolean }> }>;
  };
  buttons?: Array<{ text: string }>;
  forms?: Array<{ fields: Array<{ name: string; type: string; required?: boolean }> }>;
  tables?: Array<{ columns?: string[]; headers?: string[] }>;
}

function shouldSkipPage(pageName: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(pageName));
}

function inferPageType(pageName: string, metadata: PageMetadata): string {
  const name = pageName.toLowerCase();

  if (name.includes('list') || name.includes('all')) return 'list';
  if (name.includes('detail') || name.includes('view')) return 'detail';
  if (name.includes('form') || name.includes('create') || name.includes('new') || name.includes('edit')) return 'form';
  if (name.includes('modal')) return 'modal';
  if (name.includes('tab')) return 'tab';
  if (name.includes('dashboard')) return 'dashboard';
  if (name.includes('settings') || name.includes('config')) return 'settings';
  if (name.includes('report')) return 'report';

  // Check metadata for clues
  if (metadata.forms && metadata.forms.length > 0) return 'form';
  if (metadata.tables && metadata.tables.length > 0) return 'list';

  return 'other';
}

function humanizeName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function findCrawlFolders(featurePath: string): Promise<string[]> {
  const entries = await readdir(featurePath);
  const crawlFolders: string[] = [];

  for (const entry of entries) {
    if (entry.includes('crawl') && !entry.endsWith('.md')) {
      const fullPath = join(featurePath, entry);
      if (!existsSync(fullPath)) continue;
      try {
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          crawlFolders.push(fullPath);
        }
      } catch {
        // Skip if can't stat
      }
    }
  }

  return crawlFolders;
}

async function parseMetadata(metadataPath: string): Promise<PageMetadata | null> {
  try {
    const content = await readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function parseSupabaseTypes(typesContent: string): Map<string, { columns: string[]; type: string }> {
  const tables = new Map<string, { columns: string[]; type: string }>();

  // Match table definitions in the Tables section
  const tablesMatch = typesContent.match(/Tables: \{([\s\S]*?)\n    \}/);
  if (tablesMatch) {
    const tablesSection = tablesMatch[1];

    // Find each table
    const tableRegex = /(\w+): \{\s*Row: \{([^}]+)\}/g;
    let match;

    while ((match = tableRegex.exec(tablesSection)) !== null) {
      const tableName = match[1];
      const rowContent = match[2];

      // Extract column names
      const columns: string[] = [];
      const columnRegex = /(\w+):/g;
      let colMatch;
      while ((colMatch = columnRegex.exec(rowContent)) !== null) {
        columns.push(colMatch[1]);
      }

      tables.set(tableName, { columns, type: 'table' });
    }
  }

  // Match views
  const viewsMatch = typesContent.match(/Views: \{([\s\S]*?)\n    \}/);
  if (viewsMatch) {
    const viewsSection = viewsMatch[1];
    const viewRegex = /(\w+): \{\s*Row: \{([^}]+)\}/g;
    let match;

    while ((match = viewRegex.exec(viewsSection)) !== null) {
      const viewName = match[1];
      const rowContent = match[2];

      const columns: string[] = [];
      const columnRegex = /(\w+):/g;
      let colMatch;
      while ((colMatch = columnRegex.exec(rowContent)) !== null) {
        columns.push(colMatch[1]);
      }

      tables.set(viewName, { columns, type: 'view' });
    }
  }

  return tables;
}

async function main() {
  console.log('Building Feature Tracker Database...\n');

  // Initialize database
  const db = new Database(DB_PATH);

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log('✓ Database schema created\n');

  // Parse Supabase types
  console.log('Parsing Supabase types...');
  const typesContent = readFileSync(TYPES_FILE, 'utf-8');
  const supabaseTables = parseSupabaseTypes(typesContent);
  console.log(`✓ Found ${supabaseTables.size} tables/views\n`);

  // Insert Supabase tables
  const insertTable = db.prepare(`
    INSERT OR REPLACE INTO supabase_tables (id, table_type, column_count)
    VALUES (?, ?, ?)
  `);

  const insertColumn = db.prepare(`
    INSERT OR IGNORE INTO supabase_columns (table_id, column_name, data_type, is_nullable)
    VALUES (?, ?, 'unknown', true)
  `);

  for (const [tableName, info] of supabaseTables) {
    insertTable.run(tableName, info.type, info.columns.length);
    for (const col of info.columns) {
      insertColumn.run(tableName, col);
    }
  }
  console.log(`✓ Inserted ${supabaseTables.size} Supabase tables\n`);

  // Process features
  console.log('Processing features...');
  const featureEntries = await readdir(PLANS_DIR);

  const insertFeature = db.prepare(`
    INSERT OR REPLACE INTO procore_features (id, name, slug, description, priority, status)
    VALUES (?, ?, ?, ?, ?, 'not_started')
  `);

  const insertPage = db.prepare(`
    INSERT OR REPLACE INTO procore_pages (
      id, feature_id, name, slug, page_type,
      procore_url, screenshot_path, dom_path, metadata_path,
      button_count, form_field_count, table_column_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComponent = db.prepare(`
    INSERT INTO page_components (page_id, component_type, name, procore_label, data_type, is_required)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalPages = 0;
  let skippedPages = 0;

  for (const entry of featureEntries.sort()) {
    const featurePath = join(PLANS_DIR, entry);
    const featureStats = await stat(featurePath);

    if (!featureStats.isDirectory()) continue;
    if (entry === 'procore-support-docs') continue; // Skip support docs

    const featureSlug = entry;
    const featureName = humanizeName(entry);
    const meta = FEATURE_METADATA[entry] || { priority: 'medium', description: '' };

    // Insert feature
    insertFeature.run(
      featureSlug,
      featureName,
      featureSlug,
      meta.description,
      meta.priority
    );

    // Find crawl folders
    const crawlFolders = await findCrawlFolders(featurePath);

    for (const crawlFolder of crawlFolders) {
      const pagesPath = join(crawlFolder, 'pages');

      if (!existsSync(pagesPath)) continue;

      const pages = await readdir(pagesPath);

      for (const pageName of pages) {
        // Skip noise pages
        if (shouldSkipPage(pageName)) {
          skippedPages++;
          continue;
        }

        const pagePath = join(pagesPath, pageName);
        const pageStats = await stat(pagePath);

        if (!pageStats.isDirectory()) continue;

        const screenshotPath = join(pagePath, 'screenshot.png');
        const domPath = join(pagePath, 'dom.html');
        const metadataPath = join(pagePath, 'metadata.json');

        // Skip if no screenshot (not a real page capture)
        if (!existsSync(screenshotPath)) continue;

        const metadata = await parseMetadata(metadataPath);

        const pageId = `${featureSlug}/${pageName}`;
        const pageType = inferPageType(pageName, metadata || {});
        const procoreUrl = metadata?.actualUrl || metadata?.url || null;

        // Count components
        let buttonCount = 0;
        let formFieldCount = 0;
        let tableColumnCount = 0;

        if (metadata) {
          // Buttons
          if (metadata.analysis?.components?.buttons) {
            buttonCount = metadata.analysis.components.buttons;
          } else if (metadata.buttons) {
            buttonCount = metadata.buttons.length;
          }

          // Forms
          if (metadata.forms) {
            for (const form of metadata.forms) {
              if (form.fields) {
                formFieldCount += form.fields.length;
              }
            }
          }

          // Tables
          if (metadata.tables) {
            for (const table of metadata.tables) {
              const cols = table.columns || table.headers || [];
              tableColumnCount += cols.length;
            }
          }
        }

        // Insert page
        insertPage.run(
          pageId,
          featureSlug,
          humanizeName(pageName),
          pageName,
          pageType,
          procoreUrl,
          existsSync(screenshotPath) ? screenshotPath : null,
          existsSync(domPath) ? domPath : null,
          existsSync(metadataPath) ? metadataPath : null,
          buttonCount,
          formFieldCount,
          tableColumnCount
        );

        totalPages++;

        // Insert components
        if (metadata) {
          // Buttons
          const buttons = metadata.buttons || [];
          for (const btn of buttons) {
            if (btn.text) {
              insertComponent.run(pageId, 'button', btn.text, btn.text, null, false);
            }
          }

          // Form fields
          const forms = metadata.forms || [];
          for (const form of forms) {
            if (form.fields) {
              for (const field of form.fields) {
                insertComponent.run(
                  pageId,
                  'form_field',
                  field.name,
                  field.name,
                  field.type || 'text',
                  field.required || false
                );
              }
            }
          }

          // Table columns
          const tables = metadata.tables || [];
          for (const table of tables) {
            const cols = table.columns || table.headers || [];
            for (const col of cols) {
              if (col) {
                insertComponent.run(pageId, 'table_column', col, col, null, false);
              }
            }
          }
        }
      }
    }

    console.log(`  ✓ ${featureName}`);
  }

  console.log(`\n✓ Processed ${totalPages} pages (skipped ${skippedPages} noise pages)\n`);

  // Create feature-table mappings based on naming conventions
  console.log('Creating feature-table mappings...');

  const featureTableMappings: Array<[string, string, string]> = [
    ['budget', 'budget_lines', 'primary'],
    ['budget', 'budget_modifications', 'supporting'],
    ['budget', 'budget_views', 'supporting'],
    ['budget', 'v_budget_lines', 'supporting'],
    ['change-events', 'change_events', 'primary'],
    ['change-events', 'change_event_line_items', 'supporting'],
    ['change-events', 'change_event_approvals', 'supporting'],
    ['change-orders', 'change_orders', 'primary'],
    ['change-orders', 'change_order_lines', 'supporting'],
    ['commitments', 'subcontracts', 'primary'],
    ['commitments', 'purchase_orders', 'primary'],
    ['commitments', 'commitments_unified', 'supporting'],
    ['direct-costs', 'direct_costs', 'primary'],
    ['direct-costs', 'direct_cost_line_items', 'supporting'],
    ['invoicing', 'invoices', 'primary'],
    ['invoicing', 'owner_invoices', 'primary'],
    ['invoicing', 'owner_invoice_line_items', 'supporting'],
    ['prime-contracts', 'prime_contracts', 'primary'],
    ['prime-contracts', 'prime_contract_sovs', 'supporting'],
    ['prime-contracts', 'contract_line_items', 'supporting'],
    ['rfis', 'rfis', 'primary'],
    ['submittals', 'submittals', 'primary'],
    ['meetings', 'meetings', 'primary'],
    ['daily-logs', 'daily_logs', 'primary'],
    ['schedule', 'schedule_tasks', 'primary'],
    ['directory', 'companies', 'primary'],
    ['directory', 'contacts', 'primary'],
  ];

  const insertMapping = db.prepare(`
    INSERT OR IGNORE INTO feature_table_mapping (feature_id, table_id, relationship_type)
    VALUES (?, ?, ?)
  `);

  for (const [featureId, tableId, relType] of featureTableMappings) {
    if (supabaseTables.has(tableId)) {
      insertMapping.run(featureId, tableId, relType);
    }
  }

  console.log('✓ Created feature-table mappings\n');

  // Print summary
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM procore_features) as features,
      (SELECT COUNT(*) FROM procore_pages) as pages,
      (SELECT COUNT(*) FROM page_components) as components,
      (SELECT COUNT(*) FROM supabase_tables) as tables,
      (SELECT COUNT(*) FROM supabase_columns) as columns
  `).get() as { features: number; pages: number; components: number; tables: number; columns: number };

  console.log('='.repeat(50));
  console.log('DATABASE SUMMARY');
  console.log('='.repeat(50));
  console.log(`Features:   ${stats.features}`);
  console.log(`Pages:      ${stats.pages}`);
  console.log(`Components: ${stats.components}`);
  console.log(`Tables:     ${stats.tables}`);
  console.log(`Columns:    ${stats.columns}`);
  console.log('='.repeat(50));
  console.log(`\nDatabase saved to: ${DB_PATH}`);

  db.close();
}

main().catch(console.error);
