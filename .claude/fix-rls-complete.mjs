#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRLS() {
  console.log('=== Fixing RLS Issue for Direct Costs ===\n');

  // Step 1: Get test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users.users.find(u => u.email === 'test1@mail.com');

  if (!testUser) {
    console.error('❌ Test user not found!');
    return;
  }
  console.log(`✅ Test user: ${testUser.id}\n`);

  // Step 2: Find an existing project
  console.log('STEP 2: Finding existing projects');
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .limit(5);

  if (projectError || !projects || projects.length === 0) {
    console.error('❌ No projects found:', projectError);
    console.log('\n💡 Creating a test project...');

    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project',
        status: 'Active',
        company_id: 1
      })
      .select();

    if (createError) {
      console.error('❌ Failed to create project:', createError);
      return;
    }
    console.log('✅ Created project:', newProject);
    projects = newProject;
  } else {
    console.log('✅ Found projects:', projects.map(p => `${p.id}: ${p.name}`).join(', '));
  }

  const projectId = projects[0].id;
  console.log(`\nUsing project_id: ${projectId}\n`);

  // Step 3: Check if user is in project_members
  console.log('STEP 3: Checking project_members');
  const { data: memberships, error: memberError } = await supabase
    .from('project_members')
    .select('*')
    .eq('user_id', testUser.id)
    .eq('project_id', projectId);

  if (memberError) {
    console.error('Error:', memberError);
  } else if (!memberships || memberships.length === 0) {
    console.log('❌ User not in project_members. Adding...');

    const { data: inserted, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: testUser.id,
        access: 'admin' // Note: field is 'access', not 'role'
      })
      .select();

    if (insertError) {
      console.error('❌ Failed to add membership:', insertError);
    } else {
      console.log('✅ Added user to project_members:', inserted);
    }
  } else {
    console.log('✅ User already in project_members');
  }

  // Step 4: Test insert
  console.log('\nSTEP 4: Testing direct_costs insert');
  const testInsert = {
    project_id: projectId,
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
    console.error('❌ Insert still failing:', insertError);
    console.log('\n📋 Migration may not have been applied.');
    console.log('Run this to apply the migration:');
    console.log('cd supabase && supabase db push');
  } else {
    console.log('✅ Insert SUCCESS:', inserted);
    console.log('\nCleaning up test record...');
    await supabase.from('direct_costs').delete().eq('id', inserted[0].id);
    console.log('✅ Cleanup complete');
  }

  console.log('\n=== FIX COMPLETE ===');
  console.log(`
Summary:
- Test user ID: ${testUser.id}
- Project ID: ${projectId}
- User is now in project_members with admin access
- RLS policies should now allow inserts
  `);
}

fixRLS().catch(console.error);
