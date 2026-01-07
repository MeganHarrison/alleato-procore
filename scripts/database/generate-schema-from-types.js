#!/usr/bin/env node

/**
 * Generate Schema Documentation from TypeScript Database Types
 *
 * Reads: frontend/src/types/database.types.ts
 * Creates:
 *   1. SUPABASE_SCHEMA_QUICK_REF.json
 *   2. SUPABASE_SCHEMA_DOCUMENTATION.md
 *
 * These files are then used by generate-schema-docs.js to create
 * the detailed documentation in documentation/docs/database/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const typesPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'types', 'database.types.ts');
const outputJsonPath = path.join(__dirname, '..', 'SUPABASE_SCHEMA_QUICK_REF.json');
const outputMdPath = path.join(__dirname, '..', 'SUPABASE_SCHEMA_DOCUMENTATION.md');

console.log('📖 Reading database types from:', typesPath);

// Read the TypeScript file
const typesContent = fs.readFileSync(typesPath, 'utf8');

// Extract table definitions using regex
// Match pattern: tableName: { Row: { field: type ... } }
const tableRegex = /(\w+):\s*\{\s*Row:\s*\{([^}]+)\}/g;
const fieldRegex = /(\w+):\s*([^;\n]+)/g;

const tables = {};
let match;

// Parse each table
while ((match = tableRegex.exec(typesContent)) !== null) {
  const tableName = match[1];
  const rowContent = match[2];

  const columns = [];
  const columnDetails = {};
  let fieldMatch;

  // Parse each field in the Row type
  while ((fieldMatch = fieldRegex.exec(rowContent)) !== null) {
    const columnName = fieldMatch[1];
    let columnType = fieldMatch[2].trim();

    // Clean up the type
    columnType = columnType.replace(/\s*\|\s*null/g, ''); // Remove "| null"
    columnType = columnType.trim();

    columns.push(columnName);

    // Determine if nullable
    const isNullable = fieldMatch[2].includes('| null');

    // Map TypeScript types to PostgreSQL types
    let pgType = 'unknown';
    if (columnType === 'string') pgType = 'text';
    else if (columnType === 'number') pgType = 'numeric';
    else if (columnType === 'boolean') pgType = 'boolean';
    else if (columnType === 'Json') pgType = 'jsonb';
    else if (columnType.includes('string')) pgType = 'text';
    else if (columnType.includes('number')) pgType = 'numeric';

    columnDetails[columnName] = {
      type: pgType,
      nullable: isNullable
    };
  }

  if (columns.length > 0) {
    tables[tableName] = {
      column_count: columns.length,
      columns: columns.sort(),
      column_details: columnDetails
    };
  }
}

console.log(`✅ Found ${Object.keys(tables).length} tables`);

// Generate timestamp
const timestamp = new Date().toISOString().split('T')[0];

// Create Quick Reference JSON
const quickRef = {
  generated: timestamp,
  table_count: Object.keys(tables).length,
  tables: tables
};

fs.writeFileSync(outputJsonPath, JSON.stringify(quickRef, null, 2));
console.log('✅ Generated:', outputJsonPath);

// Create Full Documentation MD
let documentation = `# Supabase Schema Documentation\n\n`;
documentation += `**Generated:** ${timestamp}\n`;
documentation += `**Source:** frontend/src/types/database.types.ts\n`;
documentation += `**Total Tables:** ${Object.keys(tables).length}\n\n`;
documentation += `---\n\n`;

// Sort tables alphabetically
const sortedTableNames = Object.keys(tables).sort();

sortedTableNames.forEach(tableName => {
  const tableInfo = tables[tableName];

  documentation += `## Table: \`${tableName}\`\n\n`;
  documentation += `**Column Count:** ${tableInfo.column_count}\n\n`;
  documentation += `### Columns\n\n`;
  documentation += `| Column | Type | Nullable |\n`;
  documentation += `|--------|------|----------|\n`;

  tableInfo.columns.forEach(columnName => {
    const details = tableInfo.column_details[columnName];
    const nullable = details.nullable ? '✓' : '';
    documentation += `| \`${columnName}\` | ${details.type} | ${nullable} |\n`;
  });

  documentation += `\n---\n\n`;
});

fs.writeFileSync(outputMdPath, documentation);
console.log('✅ Generated:', outputMdPath);

console.log('\n🎉 Schema source files generated!');
console.log('   Next step: npm run schema:docs');
