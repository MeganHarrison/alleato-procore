#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
  console.log('=== Diagnosing RLS Issue ===\n');

  // Step 1: Get test user ID
  console.log('STEP 1: Finding test user (test1@mail.com)');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const testUser = users.users.find(u => u.email === 'test1@mail.com');
  if (!testUser) {
    console.error('❌ Test user not found!');
    return;
  }

  console.log(`✅ Test user found: ${testUser.id}\n`);

  // Step 2: Check if user is in project_members for project 1
  console.log('STEP 2: Checking project_members for project_id=1');
  const { data: memberships, error: memberError } = await supabase
    .from('project_members')
    .select('*')
    .eq('user_id', testUser.id)
    .eq('project_id', 1);

  if (memberError) {
    console.error('Error checking memberships:', memberError);
  } else if (!memberships || memberships.length === 0) {
    console.error('❌ User is NOT in project_members for project_id=1');
    console.log('\n🔧 FIX: Adding user to project_members...\n');

    // Add user to project_members
    const { data: inserted, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: 1,
        user_id: testUser.id,
        role: 'admin'
      })
      .select();

    if (insertError) {
      console.error('❌ Failed to add user to project_members:', insertError);
      console.log('\n💡 Try manual SQL:');
      console.log(`INSERT INTO project_members (project_id, user_id, role)`);
      console.log(`VALUES (1, '${testUser.id}', 'admin');`);
    } else {
      console.log('✅ User added to project_members:', inserted);
    }
  } else {
    console.log('✅ User is already in project_members:', memberships);
  }

  // Step 3: Verify RLS policies exist
  console.log('\nSTEP 3: Checking RLS policies on direct_costs');
  const { data: policies, error: policyError } = await supabase.rpc('execute_custom_sql', {
    query: `
      SELECT policyname, cmd
      FROM pg_policies
      WHERE tablename = 'direct_costs';
    `
  });

  if (policyError) {
    console.log('⚠️  Could not query policies directly:', policyError.message);
    console.log('Assuming policies exist from migration file.\n');
  } else {
    console.log('Policies found:', policies);
  }

  // Step 4: Test insert with service role (should work)
  console.log('\nSTEP 4: Testing insert with service role (bypasses RLS)');
  const testInsert = {
    project_id: 1,
    cost_type: 'Expense',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    description: 'RLS Test Insert',
    total_amount: 100.00,
    created_by_user_id: testUser.id,
    updated_by_user_id: testUser.id
  };

  const { data: inserted, error: insertError } = await supabase
    .from('direct_costs')
    .insert(testInsert)
    .select();

  if (insertError) {
    console.error('❌ Insert failed even with service role:', insertError);
  } else {
    console.log('✅ Insert succeeded with service role:', inserted);
    console.log('\nCleaning up test record...');
    await supabase.from('direct_costs').delete().eq('id', inserted[0].id);
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===');
}

diagnose().catch(console.error);
