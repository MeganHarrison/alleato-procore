#!/usr/bin/env tsx

/**
 * Seed Budget Test Data
 *
 * Creates realistic test data for budget modal testing:
 * - Prime Contracts with change orders
 * - Commitments (subcontracts & purchase orders)
 * - Direct costs (invoices, expenses, labor)
 * - Budget modifications (transfers between cost codes)
 * - Change events and change orders
 *
 * Usage:
 *   npx tsx scripts/seed-budget-data.ts [project-id]
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../frontend/src/types/database.types';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get project ID from args or use default
const PROJECT_ID = parseInt(process.argv[2]) || 118;

console.log(`🌱 Seeding budget test data for project ${PROJECT_ID}...`);

/**
 * Helper function to generate realistic dates
 */
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

/**
 * Helper function to generate random amounts
 */
function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * 1. Create Prime Contract
 */
async function seedPrimeContract() {
  console.log('\n📝 Creating Prime Contract...');

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      project_id: PROJECT_ID,
      title: 'Main Construction Contract',
      contract_number: 'PC-001',
      vendor_id: null, // Owner contract
      contract_type: 'prime',
      status: 'approved',
      contract_amount: 5000000.00,
      executed_date: '2024-01-15',
      start_date: '2024-02-01',
      completion_date: '2025-12-31',
      description: 'Primary contract for construction project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating prime contract:', error);
    return null;
  }

  console.log('✅ Prime Contract created:', contract.id);
  return contract;
}

/**
 * 2. Create Change Orders for Prime Contract
 */
async function seedChangeOrders(contractId: number) {
  console.log('\n📋 Creating Change Orders...');

  const changeOrders = [
    {
      contract_id: contractId,
      project_id: PROJECT_ID,
      number: 'CO-001',
      title: 'Site Preparation Changes',
      description: 'Additional excavation and grading work required',
      status: 'approved',
      amount: 25000.00,
      approved_date: '2024-03-15',
      created_at: new Date().toISOString()
    },
    {
      contract_id: contractId,
      project_id: PROJECT_ID,
      number: 'CO-002',
      title: 'MEP System Upgrades',
      description: 'Upgraded HVAC and electrical systems per owner request',
      status: 'approved',
      amount: 45000.00,
      approved_date: '2024-04-20',
      created_at: new Date().toISOString()
    },
    {
      contract_id: contractId,
      project_id: PROJECT_ID,
      number: 'CO-003',
      title: 'Structural Modifications',
      description: 'Additional steel reinforcement',
      status: 'pending',
      amount: 18000.00,
      approved_date: null,
      created_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('change_orders')
    .insert(changeOrders)
    .select();

  if (error) {
    console.error('❌ Error creating change orders:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} change orders`);
  return data;
}

/**
 * 3. Create Change Order Line Items
 */
async function seedChangeOrderLineItems(changeOrders: any[]) {
  console.log('\n📊 Creating Change Order Line Items...');

  const lineItems = [];

  // CO-001 line items (Site Preparation)
  if (changeOrders[0]) {
    lineItems.push(
      {
        change_order_id: changeOrders[0].id,
        project_id: PROJECT_ID,
        cost_code_id: 1, // Assuming cost code exists
        description: 'Additional excavation - 500 CY',
        quantity: 500,
        unit_price: 35.00,
        amount: 17500.00,
        created_at: new Date().toISOString()
      },
      {
        change_order_id: changeOrders[0].id,
        project_id: PROJECT_ID,
        cost_code_id: 1,
        description: 'Grading and compaction',
        quantity: 1,
        unit_price: 7500.00,
        amount: 7500.00,
        created_at: new Date().toISOString()
      }
    );
  }

  // CO-002 line items (MEP Upgrades)
  if (changeOrders[1]) {
    lineItems.push(
      {
        change_order_id: changeOrders[1].id,
        project_id: PROJECT_ID,
        cost_code_id: 2,
        description: 'HVAC system upgrade',
        quantity: 1,
        unit_price: 28000.00,
        amount: 28000.00,
        created_at: new Date().toISOString()
      },
      {
        change_order_id: changeOrders[1].id,
        project_id: PROJECT_ID,
        cost_code_id: 2,
        description: 'Electrical panel replacement',
        quantity: 1,
        unit_price: 17000.00,
        amount: 17000.00,
        created_at: new Date().toISOString()
      }
    );
  }

  if (lineItems.length === 0) return [];

  const { data, error } = await supabase
    .from('change_order_line_items')
    .insert(lineItems)
    .select();

  if (error) {
    console.error('❌ Error creating change order line items:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} change order line items`);
  return data;
}

/**
 * 4. Create Commitments (Subcontracts & Purchase Orders)
 */
async function seedCommitments() {
  console.log('\n🤝 Creating Commitments...');

  const commitments = [
    {
      project_id: PROJECT_ID,
      title: 'Concrete Subcontract',
      commitment_number: 'SUB-001',
      vendor_name: 'ABC Concrete Co',
      type: 'subcontract',
      status: 'approved',
      amount: 450000.00,
      executed_date: '2024-02-15',
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      title: 'Steel Purchase Order',
      commitment_number: 'PO-001',
      vendor_name: 'Steel Suppliers Inc',
      type: 'purchase_order',
      status: 'approved',
      amount: 320000.00,
      executed_date: '2024-03-01',
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      title: 'Electrical Subcontract',
      commitment_number: 'SUB-002',
      vendor_name: 'Power Electric LLC',
      type: 'subcontract',
      status: 'approved',
      amount: 285000.00,
      executed_date: '2024-03-10',
      created_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('commitments')
    .insert(commitments)
    .select();

  if (error) {
    console.error('❌ Error creating commitments:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} commitments`);
  return data;
}

/**
 * 5. Create Direct Costs (Invoices & Expenses)
 */
async function seedDirectCosts() {
  console.log('\n💰 Creating Direct Costs...');

  const costs = [
    // Invoices
    {
      project_id: PROJECT_ID,
      cost_type: 'invoice',
      vendor_name: 'ABC Concrete Co',
      invoice_number: 'INV-001',
      description: 'Concrete pour - Foundation',
      amount: 45000.00,
      invoice_date: '2024-04-15',
      received_date: '2024-04-16',
      cost_code_id: 1,
      status: 'approved',
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'invoice',
      vendor_name: 'Steel Suppliers Inc',
      invoice_number: 'INV-002',
      description: 'Structural steel delivery',
      amount: 65000.00,
      invoice_date: '2024-05-01',
      received_date: '2024-05-02',
      cost_code_id: 2,
      status: 'approved',
      created_at: new Date().toISOString()
    },
    // Expenses
    {
      project_id: PROJECT_ID,
      cost_type: 'expense',
      vendor_name: 'Equipment Rental Co',
      invoice_number: 'EXP-001',
      description: 'Crane rental - May 2024',
      amount: 12500.00,
      invoice_date: '2024-05-15',
      received_date: '2024-05-15',
      cost_code_id: 1,
      status: 'approved',
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'expense',
      vendor_name: 'Safety Supply Inc',
      invoice_number: 'EXP-002',
      description: 'PPE and safety equipment',
      amount: 3200.00,
      invoice_date: '2024-06-01',
      received_date: '2024-06-01',
      cost_code_id: 1,
      status: 'approved',
      created_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('direct_costs')
    .insert(costs)
    .select();

  if (error) {
    console.error('❌ Error creating direct costs:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} direct costs`);
  return data;
}

/**
 * 6. Create Budget Modifications
 */
async function seedBudgetModifications() {
  console.log('\n🔄 Creating Budget Modifications...');

  const modifications = [
    {
      project_id: PROJECT_ID,
      from_cost_code_id: 1,
      to_cost_code_id: 2,
      amount: 15000.00,
      description: 'Transfer from Site Work to Concrete',
      modification_date: '2024-04-01',
      approved_by: 'Project Manager',
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      from_cost_code_id: 2,
      to_cost_code_id: 3,
      amount: 8500.00,
      description: 'Transfer from Concrete to Masonry',
      modification_date: '2024-05-15',
      approved_by: 'Project Manager',
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      from_cost_code_id: 3,
      to_cost_code_id: 1,
      amount: 5000.00,
      description: 'Transfer from Masonry to Site Work',
      modification_date: '2024-06-01',
      approved_by: 'Project Manager',
      created_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('budget_modifications')
    .insert(modifications)
    .select();

  if (error) {
    console.error('❌ Error creating budget modifications:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} budget modifications`);
  return data;
}

/**
 * 7. Create Labor Costs (Payroll)
 */
async function seedLaborCosts() {
  console.log('\n👷 Creating Labor Costs...');

  const laborCosts = [
    {
      project_id: PROJECT_ID,
      cost_type: 'labor',
      employee_name: 'John Smith',
      description: 'Project Manager - May 2024',
      hours: 160,
      hourly_rate: 85.00,
      amount: 13600.00,
      pay_date: '2024-05-31',
      cost_code_id: 1,
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'labor',
      employee_name: 'Jane Doe',
      description: 'Site Superintendent - May 2024',
      hours: 160,
      hourly_rate: 75.00,
      amount: 12000.00,
      pay_date: '2024-05-31',
      cost_code_id: 1,
      created_at: new Date().toISOString()
    },
    {
      project_id: PROJECT_ID,
      cost_type: 'labor',
      employee_name: 'Mike Johnson',
      description: 'Carpenter - May 2024',
      hours: 160,
      hourly_rate: 45.00,
      amount: 7200.00,
      pay_date: '2024-05-31',
      cost_code_id: 2,
      created_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('labor_costs')
    .insert(laborCosts)
    .select();

  if (error) {
    console.error('❌ Error creating labor costs:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} labor cost entries`);
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
      process.exit(1);
    }

    console.log(`\n📁 Project: ${project.name} (ID: ${project.id})`);

    // Run all seeding functions
    const contract = await seedPrimeContract();

    if (contract) {
      const changeOrders = await seedChangeOrders(contract.id);
      await seedChangeOrderLineItems(changeOrders);
    }

    await seedCommitments();
    await seedDirectCosts();
    await seedBudgetModifications();
    await seedLaborCosts();

    console.log('\n✨ Seed data creation complete!');
    console.log('\n📊 Summary:');
    console.log('  - Prime Contract with change orders');
    console.log('  - Commitments (subcontracts & POs)');
    console.log('  - Direct Costs (invoices & expenses)');
    console.log('  - Budget Modifications');
    console.log('  - Labor Costs (payroll)');
    console.log('\n🎯 You can now test budget modals with realistic data!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeder
main();
