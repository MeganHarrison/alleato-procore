"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Budget Detail Type represents the different types of line items
 * that can appear in the Budget Detail tab
 */
export type DetailType =
  | "original_budget"
  | "budget_changes"
  | "forecast_to_complete"
  | "prime_contract_change_orders"
  | "commitments"
  | "commitment_change_orders"
  | "change_events"
  | "direct_costs";

/**
 * Budget Detail Line Item represents a single row in the Budget Detail tab
 */
export interface BudgetDetailLineItem {
  id: string;
  budgetCode: string;
  budgetCodeDescription: string;
  vendor?: string;
  item?: string; // Associated item like change event
  detailType: DetailType;
  description?: string;

  // Amounts for different columns (Procore Standard Budget View)
  originalBudgetAmount?: number;
  budgetChanges?: number;
  pendingBudgetChanges?: number;
  approvedCOs?: number;
  committedCosts?: number;
  pendingCostChanges?: number;
  directCosts?: number;
  forecastToComplete?: number;
}

interface BudgetDetailsTableProps {
  data: BudgetDetailLineItem[];
  loading?: boolean;
}

const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const getDetailTypeLabel = (type: DetailType): string => {
  const labels: Record<DetailType, string> = {
    original_budget: "Original Budget",
    budget_changes: "Budget Changes",
    forecast_to_complete: "Forecast to Complete",
    prime_contract_change_orders: "Prime Contract Change Orders",
    commitments: "Commitments",
    commitment_change_orders: "Commitment Change Orders",
    change_events: "Change Events",
    direct_costs: "Direct Costs",
  };
  return labels[type];
};

export function BudgetDetailsTable({ data, loading }: BudgetDetailsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading budget details...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No budget details found</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background shadow-sm">
      <div className="overflow-x-auto scrollbar-hide">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="font-semibold">Budget Code</TableHead>
              <TableHead className="font-semibold">Vendor</TableHead>
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold">Detail Type</TableHead>
              <TableHead className="font-semibold text-right">
                Original Budget Amount
              </TableHead>
              <TableHead className="font-semibold text-right">
                Budget Changes
              </TableHead>
              <TableHead className="font-semibold text-right">
                Pending Budget Changes
              </TableHead>
              <TableHead className="font-semibold text-right">
                Approved COs
              </TableHead>
              <TableHead className="font-semibold text-right">
                Committed Costs
              </TableHead>
              <TableHead className="font-semibold text-right">
                Pending Cost Changes
              </TableHead>
              <TableHead className="font-semibold text-right">
                Direct Costs
              </TableHead>
              <TableHead className="font-semibold text-right">
                Forecast to Complete
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  "hover:bg-muted",
                  item.detailType === "original_budget" && "font-medium",
                )}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.budgetCode}</span>
                    {item.budgetCodeDescription && (
                      <span className="text-sm text-muted-foreground">
                        {item.budgetCodeDescription}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{item.vendor || "-"}</TableCell>
                <TableCell className="text-sm">{item.item || "-"}</TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {getDetailTypeLabel(item.detailType)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.originalBudgetAmount)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.budgetChanges)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.pendingBudgetChanges)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.approvedCOs)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.committedCosts)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.pendingCostChanges)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.directCosts)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.forecastToComplete)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
