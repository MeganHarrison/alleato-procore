#!/usr/bin/env npx tsx
/**
 * apply-migration.ts
 *
 * Checks whether the procore_pages table exists in Supabase and outputs
 * the CREATE TABLE SQL if it doesn't. Also verifies that procore_features
 * has all required columns (slug, priority, status, page_count).
 *
 * Requires SUPABASE_SERVICE_KEY env var.
 *
 * Usage: SUPABASE_SERVICE_KEY=... npx tsx apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.log('\nTo get your service key:');
  console.log('1. Go to https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/settings/api');
  console.log('2. Copy the "service_role" key (NOT the anon key)');
  console.log('3. Run: SUPABASE_SERVICE_KEY=your_key npx tsx apply-migration.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  return !error;
}

async function main() {
  console.log('Checking if procore_pages table exists...');

  const exists = await checkTableExists('procore_pages');

  if (exists) {
    console.log('✓ procore_pages table already exists');
  } else {
    console.log('✗ procore_pages table does not exist');
    console.log('\nTo create it, run this SQL in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/sql/new');
    console.log('\n--- Copy everything below this line ---\n');
    console.log(`
CREATE TABLE IF NOT EXISTS procore_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES procore_features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  page_type TEXT CHECK(page_type IN ('list', 'detail', 'form', 'modal', 'tab', 'dashboard', 'settings', 'report', 'other')),
  procore_url TEXT,
  screenshot_path TEXT,
  dom_path TEXT,
  metadata_path TEXT,
  alleato_route TEXT,
  alleato_url TEXT,
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'needs_review', 'complete', 'blocked')),
  implementation_notes TEXT,
  button_count INTEGER,
  form_field_count INTEGER,
  table_column_count INTEGER,
  linear_issue_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to procore_features
ALTER TABLE procore_features
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS procore_tool_url TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS match_score NUMERIC,
  ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_procore_pages_feature ON procore_pages(feature_id);
CREATE INDEX IF NOT EXISTS idx_procore_pages_status ON procore_pages(status);

-- RLS
ALTER TABLE procore_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "procore_pages_select" ON procore_pages FOR SELECT TO authenticated USING (true);
CREATE POLICY "procore_pages_insert" ON procore_pages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "procore_pages_update" ON procore_pages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "procore_pages_delete" ON procore_pages FOR DELETE TO authenticated USING (true);
    `);
  }

  // Check procore_features columns
  console.log('\n\nChecking procore_features columns...');
  const { data: features, error } = await supabase
    .from('procore_features')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error checking procore_features:', error.message);
  } else if (features && features.length > 0) {
    const cols = Object.keys(features[0]);
    console.log('Current columns:', cols.join(', '));

    const needed = ['slug', 'priority', 'status', 'page_count'];
    const missing = needed.filter(n => !cols.includes(n));

    if (missing.length > 0) {
      console.log('Missing columns:', missing.join(', '));
    } else {
      console.log('✓ All required columns exist');
    }
  }
}

main().catch(console.error);
