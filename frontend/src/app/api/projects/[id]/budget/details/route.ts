import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
          code,
          name
        ),
        cost_code_types (
          code,
          name
        )
      `
      )
      .eq('project_id', projectId);

    if (!budgetError && budgetLines) {
      budgetLines.forEach((line) => {
        const costCode = line.cost_codes as unknown as { code: string; name: string } | null;

        details.push({
          id: `budget-${line.id}`,
          budgetCode: costCode ? `${costCode.code}` : '',
          budgetCodeDescription: costCode ? costCode.name : '',
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
          code,
          name
        )
      `
      )
      .eq('project_id', projectId)
      .eq('budget_modifications.status', 'approved');

    if (!modsError && budgetMods) {
      budgetMods.forEach((mod) => {
        const costCode = mod.cost_codes as unknown as { code: string; name: string } | null;
        const modification = mod.budget_modifications as unknown as { number: string; title: string };

        details.push({
          id: `mod-${mod.id}`,
          budgetCode: costCode ? costCode.code : '',
          budgetCodeDescription: costCode ? costCode.name : '',
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
          code,
          name
        )
      `
      )
      .eq('project_id', projectId)
      .in('budget_modifications.status', ['pending', 'draft']);

    if (!pendingModsError && pendingMods) {
      pendingMods.forEach((mod) => {
        const costCode = mod.cost_codes as unknown as { code: string; name: string } | null;
        const modification = mod.budget_modifications as unknown as { number: string; title: string };

        details.push({
          id: `pending-mod-${mod.id}`,
          budgetCode: costCode ? costCode.code : '',
          budgetCodeDescription: costCode ? costCode.name : '',
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

    // 5. Fetch Commitments (approved & complete)
    const { data: commitmentLines, error: commitmentsError } = await supabase
      .from('commitment_lines')
      .select(
        `
        id,
        amount,
        description,
        cost_code_id,
        commitments!inner (
          status,
          commitment_number,
          project_id,
          vendors (
            name
          )
        ),
        cost_codes (
          code,
          name
        )
      `
      )
      .in('commitments.status', ['approved', 'complete'])
      .eq('commitments.project_id', projectId);

    if (!commitmentsError && commitmentLines) {
      commitmentLines.forEach((line) => {
        const costCode = line.cost_codes as unknown as { code: string; name: string } | null;
        const commitment = line.commitments as unknown as {
          commitment_number: string;
          vendors: { name: string } | null;
        };

        details.push({
          id: `commitment-${line.id}`,
          budgetCode: costCode ? costCode.code : '',
          budgetCodeDescription: costCode ? costCode.name : '',
          vendor: commitment?.vendors?.name || '',
          item: commitment ? commitment.commitment_number : '',
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
          code,
          name
        )
      `
      )
      .eq('commitment_change_orders.status', 'approved')
      .eq('commitment_change_orders.commitments.project_id', projectId);

    if (!commitmentCOsError && commitmentCOs) {
      commitmentCOs.forEach((co) => {
        const costCode = co.cost_codes as unknown as { code: string; name: string } | null;
        const changeOrder = co.commitment_change_orders as unknown as {
          change_order_number: string;
          commitments: {
            commitment_number: string;
            vendors: { name: string } | null;
          };
        };

        details.push({
          id: `commitment-co-${co.id}`,
          budgetCode: costCode ? costCode.code : '',
          budgetCodeDescription: costCode ? costCode.name : '',
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
        amount,
        description,
        cost_code_id,
        change_events!inner (
          event_number,
          title,
          project_id
        ),
        cost_codes (
          code,
          name
        )
      `
      )
      .eq('change_events.project_id', projectId);

    if (!changeEventsError && changeEventLines) {
      changeEventLines.forEach((line) => {
        const costCode = line.cost_codes as unknown as { code: string; name: string } | null;
        const event = line.change_events as unknown as { event_number: string; title: string };

        details.push({
          id: `change-event-${line.id}`,
          budgetCode: costCode ? costCode.code : '',
          budgetCodeDescription: costCode ? costCode.name : '',
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
        cost_code_id,
        vendors (
          name
        ),
        cost_codes (
          code,
          name
        )
      `
      )
      .eq('project_id', projectId)
      .eq('status', 'approved');

    if (!directCostsError && directCosts) {
      directCosts.forEach((cost) => {
        const costCode = cost.cost_codes as unknown as { code: string; name: string } | null;
        const vendor = cost.vendors as unknown as { name: string } | null;

        details.push({
          id: `direct-cost-${cost.id}`,
          budgetCode: costCode ? costCode.code : '',
          budgetCodeDescription: costCode ? costCode.name : '',
          vendor: vendor?.name || '',
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
