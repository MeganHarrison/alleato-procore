#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_fDpzY_Eu0StzNOZsVKegRQ_d-G5k-Jf';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
  console.log('🔍 Checking database schema...\n');

  const tables = [
    'projects',
    'contracts',
    'contract_line_items',
    'change_orders',
    'change_order_line_items',
    'commitments',
    'commitment_line_items',
    'direct_costs',
    'budget_modifications',
    'labor_costs',
    'budget_lines',
    'cost_codes'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table as any)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: exists`);
    }
  }
}

checkTables();
