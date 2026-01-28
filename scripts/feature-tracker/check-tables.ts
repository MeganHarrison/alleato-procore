/**
 * check-tables.ts
 *
 * Verifies that required Supabase tables (procore_features, procore_pages)
 * exist and are accessible. Prints column names for procore_features.
 *
 * Usage: npx tsx check-tables.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgveqfnpkxvzbnnwuled.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTQxNjYsImV4cCI6MjA3MDgzMDE2Nn0.g56kDPUokoJpWY7vXd3GTMXpOc4WFOU0hDVWfGMZtO8'
);

async function main() {
  // Check procore_features
  const { data: features, error: featErr } = await supabase
    .from('procore_features')
    .select('*')
    .limit(1);

  if (featErr) {
    console.log('procore_features: ERROR -', featErr.message);
  } else {
    const cols = features && features.length > 0 ? Object.keys(features[0]) : [];
    console.log('procore_features: EXISTS');
    console.log('  Columns:', cols.join(', '));
  }

  // Check procore_pages
  const { data: pages, error: pageErr } = await supabase
    .from('procore_pages')
    .select('*')
    .limit(1);

  if (pageErr) {
    console.log('procore_pages: ERROR -', pageErr.message);
  } else {
    console.log('procore_pages: EXISTS');
  }
}

main();
