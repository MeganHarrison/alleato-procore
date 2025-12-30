import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { BudgetDetailLineItem, DetailType } from '@/components/budget/budget-details-table';

interface BudgetDetailParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/budget/details
 *
 * Fetches budget detail line items for the Budget Detail tab
 * Aggregates data from:
 * - budget_lines (original budget)
 * - budget_modifications (budget changes)
 * - contract_change_orders (prime contract COs)
 * - commitments (committed costs)
 * - commitment_change_orders (commitment COs)
 * - change_events (change events)
 * - direct_costs (direct costs)
 */
export async function GET(
  request: NextRequest,
  { params }: BudgetDetailParams
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    const supabase = createServiceClient();

    const details: BudgetDetailLineItem[] = [];

    // 1. Fetch Original Budget items
    const { data: budgetLines, error: budgetError } = await supabase
      .from('budget_lines')
      .select(
        `
        id,
        original_amount,
        description,
        cost_code_id,
        cost_type_id,
        cost_codes (
          id,
          title
        )
      `
      )
      .eq('project_id', projectId);

    if (budgetError) {
      console.error('Budget lines error:', budgetError);
    } else {
      console.warn(`Budget lines query returned ${budgetLines?.length || 0} rows for project ${projectId}`);
    }

    if (!budgetError && budgetLines) {
      budgetLines.forEach((line) => {
        const costCode = line.cost_codes as unknown as { id: string; title: string | null } | null;

        details.push({
          id: `budget-${line.id}`,
          budgetCode: line.cost_code_id || costCode?.id || '',
          budgetCodeDescription: costCode?.title || '',
          detailType: 'original_budget' as DetailType,
          description: line.description || '',
          originalBudgetAmount: Number(line.original_amount) || 0,
        });
      });
    }

    // 2. Fetch Budget Modifications (approved)
    const { data: budgetMods, error: modsError } = await supabase
      .from('budget_mod_lines')
      .select(
        `
        id,
        amount,
        description,
        cost_code_id,
        budget_modifications!inner (
          status,
          number,
          title
        ),
        cost_codes (
          id,
          title
        )
      `
      )
      .eq('project_id', projectId)
      .eq('budget_modifications.status', 'approved');

    if (!modsError && budgetMods) {
      budgetMods.forEach((mod) => {
        const costCode = mod.cost_codes as unknown as { id: string; title: string | null } | null;
        const modification = mod.budget_modifications as unknown as { number: string; title: string };

        details.push({
          id: `mod-${mod.id}`,
          budgetCode: mod.cost_code_id || costCode?.id || '',
          budgetCodeDescription: costCode?.title || '',
          item: modification ? `${modification.number} - ${modification.title}` : '',
          detailType: 'budget_changes' as DetailType,
          description: mod.description || '',
          budgetChanges: Number(mod.amount) || 0,
        });
      });
    }

    // 3. Fetch Pending Budget Modifications
    const { data: pendingMods, error: pendingModsError } = await supabase
      .from('budget_mod_lines')
      .select(
        `
        id,
        amount,
        description,
        cost_code_id,
        budget_modifications!inner (
          status,
          number,
          title
        ),
        cost_codes (
          id,
          title
        )
      `
      )
      .eq('project_id', projectId)
      .in('budget_modifications.status', ['pending', 'draft']);

    if (!pendingModsError && pendingMods) {
      pendingMods.forEach((mod) => {
        const costCode = mod.cost_codes as unknown as { id: string; title: string | null } | null;
        const modification = mod.budget_modifications as unknown as { number: string; title: string };

        details.push({
          id: `pending-mod-${mod.id}`,
          budgetCode: mod.cost_code_id || costCode?.id || '',
          budgetCodeDescription: costCode?.title || '',
          item: modification ? `${modification.number} - ${modification.title}` : '',
          detailType: 'budget_changes' as DetailType,
          description: mod.description || '',
          pendingBudgetChanges: Number(mod.amount) || 0,
        });
      });
    }

    // 4. Fetch Prime Contract Change Orders (approved)
    const { data: contractCOs, error: contractCOsError } = await supabase
      .from('contract_change_orders')
      .select(
        `
        id,
        amount,
        description,
        change_order_number,
        prime_contracts!inner (
          contract_number
        )
      `
      )
      .eq('prime_contracts.project_id', projectId)
      .eq('status', 'approved');

    if (!contractCOsError && contractCOs) {
      contractCOs.forEach((co) => {
        const contract = co.prime_contracts as unknown as { contract_number: string };

        details.push({
          id: `contract-co-${co.id}`,
          budgetCode: contract ? contract.contract_number : '',
          budgetCodeDescription: 'Prime Contract',
          item: `CO ${co.change_order_number}`,
          detailType: 'prime_contract_change_orders' as DetailType,
          description: co.description || '',
          approvedCOs: Number(co.amount) || 0,
        });
      });
    }

    // 5. Fetch Subcontract SOV Items (committed costs)
    const { data: subcontractSovItems, error: subcontractsError } = await supabase
      .from('subcontract_sov_items')
      .select(
        `
        id,
        amount,
        description,
        budget_code,
        subcontracts!inner (
          status,
          contract_number,
          project_id,
          companies (
            name
          )
        )
      `
      )
      .in('subcontracts.status', ['approved', 'complete', 'Draft'])
      .eq('subcontracts.project_id', projectId);

    if (!subcontractsError && subcontractSovItems) {
      subcontractSovItems.forEach((line) => {
        const subcontract = line.subcontracts as unknown as {
          contract_number: string;
          companies: { name: string } | null;
        };

        details.push({
          id: `subcontract-${line.id}`,
          budgetCode: line.budget_code || '',
          budgetCodeDescription: '',
          vendor: subcontract?.companies?.name || '',
          item: subcontract ? subcontract.contract_number : '',
          detailType: 'commitments' as DetailType,
          description: line.description || '',
          committedCosts: Number(line.amount) || 0,
        });
      });
    }

    // 5b. Fetch Purchase Order SOV Items (committed costs)
    const { data: poSovItems, error: poError } = await supabase
      .from('purchase_order_sov_items')
      .select(
        `
        id,
        amount,
        description,
        budget_code,
        purchase_orders!inner (
          status,
          contract_number,
          project_id,
          companies (
            name
          )
        )
      `
      )
      .in('purchase_orders.status', ['approved', 'complete', 'Draft'])
      .eq('purchase_orders.project_id', projectId);

    if (!poError && poSovItems) {
      poSovItems.forEach((line) => {
        const purchaseOrder = line.purchase_orders as unknown as {
          contract_number: string;
          companies: { name: string } | null;
        };

        details.push({
          id: `po-${line.id}`,
          budgetCode: line.budget_code || '',
          budgetCodeDescription: '',
          vendor: purchaseOrder?.companies?.name || '',
          item: purchaseOrder ? purchaseOrder.contract_number : '',
          detailType: 'commitments' as DetailType,
          description: line.description || '',
          committedCosts: Number(line.amount) || 0,
        });
      });
    }

    // 6. Fetch Commitment Change Orders (approved)
    const { data: commitmentCOs, error: commitmentCOsError } = await supabase
      .from('commitment_change_order_lines')
      .select(
        `
        id,
        amount,
        description,
        cost_code_id,
        commitment_change_orders!inner (
          status,
          change_order_number,
          commitments!inner (
            commitment_number,
            project_id,
            vendors (
              name
            )
          )
        ),
        cost_codes (
          id,
          title
        )
      `
      )
      .eq('commitment_change_orders.status', 'approved')
      .eq('commitment_change_orders.commitments.project_id', projectId);

    if (!commitmentCOsError && commitmentCOs) {
      commitmentCOs.forEach((co) => {
        const costCode = co.cost_codes as unknown as { id: string; title: string | null } | null;
        const changeOrder = co.commitment_change_orders as unknown as {
          change_order_number: string;
          commitments: {
            commitment_number: string;
            vendors: { name: string } | null;
          };
        };

        details.push({
          id: `commitment-co-${co.id}`,
          budgetCode: co.cost_code_id || costCode?.id || '',
          budgetCodeDescription: costCode?.title || '',
          vendor: changeOrder?.commitments?.vendors?.name || '',
          item: `CO ${changeOrder?.change_order_number || ''}`,
          detailType: 'commitment_change_orders' as DetailType,
          description: co.description || '',
          approvedCOs: Number(co.amount) || 0,
        });
      });
    }

    // 7. Fetch Change Events
    const { data: changeEventLines, error: changeEventsError } = await supabase
      .from('change_event_line_items')
      .select(
        `
        id,
        description,
        cost_code,
        final_amount,
        change_events!inner (
          event_number,
          title,
          project_id
        )
      `
      )
      .eq('change_events.project_id', projectId);

    if (!changeEventsError && changeEventLines) {
      changeEventLines.forEach((line) => {
        const event = line.change_events as unknown as { event_number: string; title: string };

        details.push({
          id: `change-event-${line.id}`,
          budgetCode: line.cost_code || '',
          budgetCodeDescription: '',
          item: event ? `${event.event_number} - ${event.title}` : '',
          detailType: 'change_events' as DetailType,
          description: line.description || '',
        });
      });
    }

    // 8. Fetch Direct Costs (approved)
    const { data: directCosts, error: directCostsError } = await supabase
      .from('direct_costs')
      .select(
        `
        id,
        amount,
        description,
        budget_item_id,
        vendor_id
      `
      )
      .eq('project_id', projectId);

    if (!directCostsError && directCosts) {
      directCosts.forEach((cost) => {
        details.push({
          id: `direct-cost-${cost.id}`,
          budgetCode: cost.budget_item_id || '',
          budgetCodeDescription: '',
          vendor: cost.vendor_id || '',
          detailType: 'direct_costs' as DetailType,
          description: cost.description || '',
          directCosts: Number(cost.amount) || 0,
        });
      });
    }

    // Calculate Forecast to Complete for each budget line
    // Forecast to Complete = Revised Budget - (Committed Costs + Direct Costs)
    const budgetLineMap = new Map<string, {
      revisedBudget: number;
      committedCosts: number;
      directCosts: number;
    }>();

    details.forEach((detail) => {
      if (!budgetLineMap.has(detail.budgetCode)) {
        budgetLineMap.set(detail.budgetCode, {
          revisedBudget: 0,
          committedCosts: 0,
          directCosts: 0,
        });
      }

      const summary = budgetLineMap.get(detail.budgetCode)!;

      if (detail.detailType === 'original_budget') {
        summary.revisedBudget += detail.originalBudgetAmount || 0;
      }
      if (detail.detailType === 'budget_changes') {
        summary.revisedBudget += detail.budgetChanges || 0;
      }
      if (detail.detailType === 'prime_contract_change_orders') {
        summary.revisedBudget += detail.approvedCOs || 0;
      }
      if (detail.detailType === 'commitments') {
        summary.committedCosts += detail.committedCosts || 0;
      }
      if (detail.detailType === 'direct_costs') {
        summary.directCosts += detail.directCosts || 0;
      }
    });

    // Add Forecast to Complete rows
    budgetLineMap.forEach((summary, budgetCode) => {
      const forecastToComplete = summary.revisedBudget - (summary.committedCosts + summary.directCosts);

      details.push({
        id: `forecast-${budgetCode}`,
        budgetCode,
        budgetCodeDescription: 'Forecast',
        detailType: 'forecast_to_complete' as DetailType,
        forecastToComplete,
      });
    });

    console.warn(`Budget Details API returning ${details.length} total rows for project ${projectId}`);

    return NextResponse.json({
      details,
      count: details.length,
    });
  } catch (error) {
    console.error('Error fetching budget details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
