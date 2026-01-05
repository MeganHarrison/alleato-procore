#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgveqfnpkxvzbnnwuled.supabase.co',
  'sb_secret_fDpzY_Eu0StzNOZsVKegRQ_d-G5k-Jf'
);

async function checkSchemas() {
  console.log('\n🔍 Checking table schemas...\n');

  // Check prime_contract_change_orders
  const { data: co, error: coError } = await supabase
    .from('prime_contract_change_orders')
    .select('*')
    .limit(1);

  console.log('prime_contract_change_orders columns:', Object.keys(co?.[0] || {}));
  if (coError) console.log('  Error:', coError.message);

  // Check commitments
  const { data: comm, error: commError } = await supabase
    .from('commitments')
    .select('*')
    .limit(1);

  console.log('\ncommitments columns:', Object.keys(comm?.[0] || {}));
  if (commError) console.log('  Error:', commError.message);

  // Check direct_costs
  const { data: dc, error: dcError } = await supabase
    .from('direct_costs')
    .select('*')
    .limit(1);

  console.log('\ndirect_costs columns:', Object.keys(dc?.[0] || {}));
  if (dcError) console.log('  Error:', dcError.message);

  // Check budget_modifications
  const { data: bm, error: bmError } = await supabase
    .from('budget_modifications')
    .select('*')
    .limit(1);

  console.log('\nbudget_modifications columns:', Object.keys(bm?.[0] || {}));
  if (bmError) console.log('  Error:', bmError.message);
}

checkSchemas();
