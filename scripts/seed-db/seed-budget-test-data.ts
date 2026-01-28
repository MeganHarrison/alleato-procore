#!/usr/bin/env tsx

/**
 * Seed Budget Test Data - Simplified Version
 *
 * Creates realistic test data for budget modal testing using actual database schema.
 *
 * Usage:
 *   npx tsx scripts/seed-budget-test-data.ts [project-id]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get project ID from args or use default
const PROJECT_ID = parseInt(process.argv[2]) || 118;
const CLIENT_ID = 5; // Ulta Beauty

console.log(`\n🌱 Seeding budget test data for project ${PROJECT_ID}...\n`);

/**
 * 1. Create Prime Contract
 */
async function seedPrimeContract() {
  console.log('📝 Creating Prime Contract...');

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      project_id: PROJECT_ID,
      client_id: CLIENT_ID,
      contract_number: 'PC-001-SEED',
      title: 'Main Construction Contract - SEED DATA',
      status: 'approved',
      executed: true,
      original_contract_amount: 5000000.00,
      approved_change_orders: 70000.00,
      revised_contract_amount: 5070000.00,
      pending_change_orders: 18000.00,
      draft_change_orders: 0,
      invoiced_amount: 1250000.00,
      payments_received: 1125000.00,
      remaining_balance: 3945000.00,
      retention_percentage: 10.00,
      default_retainage: 10.00,
      description: 'Primary prime contract for construction - TEST DATA',
      start_date: '2024-02-01',
      estimated_completion_date: '2025-12-31'
    })
    .select()
    .single();

  if (error) {
    console.error('  ❌ Error:', error.message);
    return null;
  }

  console.log(`  ✅ Created contract ID: ${data.id}\n`);
  return data;
}

/**
 * 2. Create Prime Contract Change Orders
 */
async function seedPrimeContractChangeOrders(contractId: number) {
  console.log('📋 Creating Prime Contract Change Orders...');

  const changeOrders = [
    {
      contract_id: contractId,
      pcco_number: 'PCO-001-SEED',
      title: 'Site Preparation Changes',
      status: 'approved',
      total_amount: 25000.00,
      approved_at: '2024-03-15',
      executed: true
    },
    {
      contract_id: contractId,
      pcco_number: 'PCO-002-SEED',
      title: 'MEP System Upgrades',
      status: 'approved',
      total_amount: 45000.00,
      approved_at: '2024-04-20',
      executed: true
    },
    {
      contract_id: contractId,
      pcco_number: 'PCO-003-SEED',
      title: 'Structural Modifications',
      status: 'pending',
      total_amount: 18000.00,
      approved_at: null,
      executed: false
    }
  ];

  const { data, error} = await supabase
    .from('prime_contract_change_orders')
    .insert(changeOrders)
    .select();

  if (error) {
    console.error('  ❌ Error:', error.message);
    return [];
  }

  console.log(`  ✅ Created ${data.length} change orders\n`);
  return data;
}

/**
 * 3. Create Commitments (Subcontracts)
 */
async function seedCommitments() {
  console.log('🤝 Creating Commitments...');

  const commitments = [
    {
      project_id: PROJECT_ID,
      client_id: CLIENT_ID,
      commitment_number: 'SUB-001-SEED',
      title: 'Concrete Subcontract - SEED DATA',
      vendor_name: 'ABC Concrete Co',
      type: 'subcontract',
      status: 'approved',
      executed: true,
      original_amount: 450000.00,
      approved_change_orders: 12000.00,
      revised_amount: 462000.00,
      invoiced_amount: 125000.00,
      payments_made: 112500.00,
      retention_held: 12500.00,
      start_date: '2024-02-15'
    },
    {
      project_id: PROJECT_ID,
      client_id: CLIENT_ID,
      commitment_number: 'SUB-002-SEED',
      title: 'Electrical Subcontract - SEED DATA',
      vendor_name: 'Power Electric LLC',
      type: 'subcontract',
      status: 'approved',
      executed: true,
      original_amount: 285000.00,
      approved_change_orders: 8500.00,
      revised_amount: 293500.00,
      invoiced_amount: 75000.00,
      payments_made: 67500.00,
      retention_held: 7500.00,
      start_date: '2024-03-10'
    },
    {
      project_id: PROJECT_ID,
      client_id: CLIENT_ID,
      commitment_number: 'PO-001-SEED',
      title: 'Steel Purchase Order - SEED DATA',
      vendor_name: 'Steel Suppliers Inc',
      type: 'purchase_order',
      status: 'approved',
      executed: true,
      original_amount: 320000.00,
      approved_change_orders: 0,
      revised_amount: 320000.00,
      invoiced_amount: 65000.00,
      payments_made: 65000.00,
      retention_held: 0,
      start_date: '2024-03-01'
    }
  ];

  const { data, error } = await supabase
    .from('commitments')
    .insert(commitments)
    .select();

  if (error) {
    console.error('  ❌ Error:', error.message);
    return [];
  }

  console.log(`  ✅ Created ${data.length} commitments\n`);
  return data;
}

/**
 * 4. Create Direct Costs
 */
async function seedDirectCosts() {
  console.log('💰 Creating Direct Costs...');

  const costs = [
    {
      project_id: PROJECT_ID,
      cost_type: 'invoice',
      vendor_name: 'ABC Concrete Co',
      invoice_number: 'INV-001-SEED',
      description: 'Concrete pour - Foundation slab',
      amount: 45000.00,
      invoice_date: '2024-04-15',
      received_date: '2024-04-16',
      status: 'approved',
      cost_code: '03-1000'
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'invoice',
      vendor_name: 'Steel Suppliers Inc',
      invoice_number: 'INV-002-SEED',
      description: 'Structural steel delivery - Phase 1',
      amount: 65000.00,
      invoice_date: '2024-05-01',
      received_date: '2024-05-02',
      status: 'approved',
      cost_code: '05-1200'
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'expense',
      vendor_name: 'Equipment Rental Co',
      invoice_number: 'EXP-001-SEED',
      description: 'Crane rental - May 2024',
      amount: 12500.00,
      invoice_date: '2024-05-15',
      received_date: '2024-05-15',
      status: 'approved',
      cost_code: '01-5000'
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'expense',
      vendor_name: 'Safety Supply Inc',
      invoice_number: 'EXP-002-SEED',
      description: 'PPE and safety equipment',
      amount: 3200.00,
      invoice_date: '2024-06-01',
      received_date: '2024-06-01',
      status: 'approved',
      cost_code: '01-3000'
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'labor',
      vendor_name: 'Internal Labor',
      invoice_number: 'PAY-001-SEED',
      description: 'Project Manager - May 2024',
      amount: 13600.00,
      invoice_date: '2024-05-31',
      received_date: '2024-05-31',
      status: 'approved',
      cost_code: '01-1000'
    }
  ];

  const { data, error } = await supabase
    .from('direct_costs')
    .insert(costs)
    .select();

  if (error) {
    console.error('  ❌ Error:', error.message);
    return [];
  }

  console.log(`  ✅ Created ${data.length} direct costs\n`);
  return data;
}

/**
 * 5. Create Budget Modifications
 */
async function seedBudgetModifications() {
  console.log('🔄 Creating Budget Modifications...');

  const modifications = [
    {
      project_id: PROJECT_ID,
      from_cost_code: '01-1000',
      to_cost_code: '03-1000',
      amount: 15000.00,
      notes: 'Transfer from General Conditions to Concrete - SEED DATA',
      modification_date: '2024-04-01',
      status: 'approved',
      approved_by: 'Project Manager'
    },
    {
      project_id: PROJECT_ID,
      from_cost_code: '03-1000',
      to_cost_code: '04-2000',
      amount: 8500.00,
      notes: 'Transfer from Concrete to Masonry - SEED DATA',
      modification_date: '2024-05-15',
      status: 'approved',
      approved_by: 'Project Manager'
    },
    {
      project_id: PROJECT_ID,
      from_cost_code: '04-2000',
      to_cost_code: '01-1000',
      amount: 5000.00,
      notes: 'Transfer from Masonry back to General Conditions - SEED DATA',
      modification_date: '2024-06-01',
      status: 'approved',
      approved_by: 'Project Manager'
    }
  ];

  const { data, error } = await supabase
    .from('budget_modifications')
    .insert(modifications)
    .select();

  if (error) {
    console.error('  ❌ Error:', error.message);
    return [];
  }

  console.log(`  ✅ Created ${data.length} budget modifications\n`);
  return data;
}

/**
 * Main seeding function
 */
async function main() {
  try {
    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', PROJECT_ID)
      .single();

    if (projectError || !project) {
      console.error(`❌ Project ${PROJECT_ID} not found`);
      console.error(projectError);
      process.exit(1);
    }

    console.log(`📁 Project: ${project.name} (ID: ${project.id})\n`);

    // Run all seeding functions
    const contract = await seedPrimeContract();

    if (contract) {
      await seedPrimeContractChangeOrders(contract.id);
    }

    await seedCommitments();
    await seedDirectCosts();
    await seedBudgetModifications();

    console.log('✨ Seed data creation complete!\n');
    console.log('📊 Summary:');
    console.log('  ✅ Prime Contract: PC-001-SEED');
    console.log('  ✅ Change Orders: 3 (2 approved, 1 pending)');
    console.log('  ✅ Commitments: 3 (2 subcontracts, 1 PO)');
    console.log('  ✅ Direct Costs: 5 items');
    console.log('  ✅ Budget Modifications: 3 transfers');
    console.log('\n🎯 Test data ready for budget modals!');
    console.log('\n💡 Next steps:');
    console.log('  1. Open budget page for project', PROJECT_ID);
    console.log('  2. Click on "Approved COs" values to see change orders');
    console.log('  3. Click on "Budget Mods" values to see modifications');
    console.log('  4. Click on "JTD Cost Detail" to see direct costs');
    console.log('  5. Test creating new budget line items\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeder
main();
