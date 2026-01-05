import * as React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Inline } from "@/components/ui/inline"
import { UomSelect } from "./UomSelect"
import { BudgetCodeSelector } from "@/app/[projectId]/budget/setup/components"
import type { BudgetLineItem, ProjectCostCode } from "@/app/[projectId]/budget/setup/types"

interface BudgetLineItemRowProps {
  item: BudgetLineItem
  projectCostCodes: ProjectCostCode[]
  isPopoverOpen: boolean
  onPopoverOpenChange: (open: boolean) => void
  onBudgetCodeSelect: (costCode: ProjectCostCode) => void
  onFieldChange: (field: keyof BudgetLineItem, value: string) => void
  onRemove: () => void
  onCreateNew: () => void
  canRemove: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

/**
 * BudgetLineItemRow - Desktop table row for budget line item
 * Part of the budget setup table component
 */
export function BudgetLineItemRow({
  item,
  projectCostCodes,
  isPopoverOpen,
  onPopoverOpenChange,
  onBudgetCodeSelect,
  onFieldChange,
  onRemove,
  onCreateNew,
  canRemove,
  onKeyDown,
}: BudgetLineItemRowProps) {
  return (
    <div className="px-4 py-3 hover:bg-gray-50">
      <Inline gap="md" align="center">
        {/* Budget Code Selector */}
        <div className="flex-1">
          <BudgetCodeSelector
            projectCostCodes={projectCostCodes}
            selectedLabel={item.costCodeLabel}
            onSelect={onBudgetCodeSelect}
            onCreateNew={onCreateNew}
            open={isPopoverOpen}
            onOpenChange={onPopoverOpenChange}
          />
        </div>

        {/* Quantity */}
        <div className="w-16">
          <Input
            type="number"
            placeholder="0"
            value={item.qty}
            onChange={(e) => onFieldChange("qty", e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full text-right"
          />
        </div>

        {/* Unit of Measure */}
        <div className="w-20">
          <UomSelect
            value={item.uom}
            onValueChange={(value) => onFieldChange("uom", value)}
            className="w-full"
          />
        </div>

        {/* Unit Cost */}
        <div className="w-28">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
              $
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={item.unitCost}
              onChange={(e) => onFieldChange("unitCost", e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full pl-7 text-right"
            />
          </div>
        </div>

        {/* Amount (calculated, disabled) */}
        <div className="w-28">
          <Input
            type="number"
            value={item.amount}
            className="w-full bg-gray-50 text-right"
            disabled
          />
        </div>

        {/* Delete Button */}
        <div className="w-10 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={!canRemove}
          >
            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
          </Button>
        </div>
      </Inline>
    </div>
  )
}
