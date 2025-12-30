'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { UNITS_OF_MEASURE } from '@/constants/budget';
import { BudgetCodeSelector, CreateBudgetCodeModal } from './components';
import {
  type ProjectCostCode,
  type BudgetLineItem,
  createEmptyLineItem,
  formatCostCodeLabel,
} from './types';

export default function BudgetSetupPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [projectCostCodes, setProjectCostCodes] = useState<ProjectCostCode[]>([]);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([createEmptyLineItem()]);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);

  // Load active project cost codes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from('project_budget_codes')
          .select(
            `
            id,
            cost_code_id,
            cost_type_id,
            is_active,
            cost_codes!inner (
              id,
              title,
              division_title
            ),
            cost_code_types (
              id,
              code,
              description
            )
          `
          )
          .eq('project_id', parseInt(projectId, 10))
          .eq('is_active', true)
          .order('cost_code_id', { ascending: true });

        if (error) throw error;

        const validCostCodes =
          (data as unknown as ProjectCostCode[])?.filter((cc) => cc.cost_type_id) || [];
        setProjectCostCodes(validCostCodes);
      } catch (error) {
        console.error('Error loading project cost codes:', error);
        toast.error('Failed to load project cost codes');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [projectId]);

  const refreshProjectCostCodes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('project_budget_codes')
      .select(
        `
        id,
        cost_code_id,
        cost_type_id,
        is_active,
        cost_codes!inner ( id, title, division_title ),
        cost_code_types ( id, code, description )
      `
      )
      .eq('project_id', parseInt(projectId, 10))
      .eq('is_active', true)
      .order('cost_code_id', { ascending: true });

    if (data) {
      const validCostCodes =
        (data as unknown as ProjectCostCode[])?.filter((cc) => cc.cost_type_id) || [];
      setProjectCostCodes(validCostCodes);
      return validCostCodes;
    }
    return [];
  }, [projectId]);

  const handleAddRow = useCallback(() => {
    const newItem = createEmptyLineItem();
    setLineItems((prev) => [...prev, newItem]);
    // Focus the budget code selector of the new row after render
    setTimeout(() => {
      const newRowButton = document.querySelector(
        `[data-row-id="${newItem.id}"] button`
      ) as HTMLButtonElement | null;
      newRowButton?.focus();
    }, 0);
  }, []);

  const handleRemoveRow = (id: string) => {
    if (lineItems.length === 1) {
      toast.error('At least one line item is required');
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleBudgetCodeSelect = (rowId: string, costCode: ProjectCostCode) => {
    const label = formatCostCodeLabel(costCode);

    setLineItems(
      lineItems.map((item) =>
        item.id === rowId
          ? {
              ...item,
              projectCostCodeId: costCode.id,
              costCodeLabel: label,
              qty: item.qty || '1',
            }
          : item
      )
    );
    setOpenPopoverId(null);
  };

  const handleFieldChange = (id: string, field: keyof BudgetLineItem, value: string) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Auto-calculate amount when qty or unitCost changes
        if (field === 'qty' || field === 'unitCost') {
          const qty = parseFloat(field === 'qty' ? value : item.qty) || 0;
          const unitCost = parseFloat(field === 'unitCost' ? value : item.unitCost) || 0;
          updated.amount = (qty * unitCost).toFixed(2);
        }

        return updated;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRow();
    }
  };

  const handleCreateBudgetCodeSuccess = async (budgetCodeId: string) => {
    const refreshedCodes = await refreshProjectCostCodes();

    // Auto-populate the pending row with the newly created budget code
    if (pendingRowId && budgetCodeId) {
      const newCode = refreshedCodes.find((cc) => cc.id === budgetCodeId);
      if (newCode) {
        handleBudgetCodeSelect(pendingRowId, newCode);
      }
    }

    setPendingRowId(null);
    toast.success('Budget code created successfully');
  };

  const handleSubmit = async () => {
    // Validate that all rows have a budget code selected
    const invalidRows = lineItems.filter((item) => !item.projectCostCodeId);
    if (invalidRows.length > 0) {
      toast.error('Please select a budget code for all line items');
      return;
    }

    // Validate that all selected cost codes have a cost type
    const missingCostType = lineItems.filter((item) => {
      const costCode = projectCostCodes.find((cc) => cc.id === item.projectCostCodeId);
      return !costCode?.cost_type_id;
    });
    if (missingCostType.length > 0) {
      toast.error('All selected budget codes must have a cost type');
      return;
    }

    try {
      setLoading(true);

      const formattedLineItems = lineItems.map((item) => {
        const costCode = projectCostCodes.find((cc) => cc.id === item.projectCostCodeId);
        return {
          costCodeId: costCode?.cost_code_id || '',
          costType: costCode?.cost_type_id ?? null,
          amount: item.amount || '0',
          description: null,
          qty: item.qty || null,
          uom: item.uom || null,
          unitCost: item.unitCost || null,
        };
      });

      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItems: formattedLineItems }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        throw new Error(result.error || 'Failed to create budget lines');
      }

      toast.success(`Successfully created ${lineItems.length} budget line(s)`);
      router.push(`/${projectId}/budget`);
    } catch (error) {
      console.error('Error creating budget lines:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create budget lines');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/${projectId}/budget`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Budget
              </Button>

              <div className="mt-2">
                <h1 className="text-2xl font-semibold mb-2">Add Budget Line Items</h1>
                <p className="text-sm text-gray-600">Add new line items to your project budget</p>
              </div>
            </div>

            {/* Action Buttons - Hidden on mobile */}
            <div className="hidden sm:flex sm:items-center sm:gap-3">
              <Button variant="outline" onClick={handleAddRow}>
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
              <Button onClick={handleSubmit} disabled={loading || lineItems.length === 0}>
                {loading
                  ? 'Creating...'
                  : `Create ${lineItems.length} Line Item${lineItems.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border bg-white shadow-sm">
          {/* Summary Bar */}
          <div className="border-b bg-gray-50 px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-sm">
              <span className="font-medium text-gray-700">
                {lineItems.length} Line Item{lineItems.length !== 1 ? 's' : ''}
              </span>
              <span className="font-semibold text-gray-900">
                Total: $
                {totalAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="border-b bg-white px-4 py-3 flex items-center gap-4">
                <div className="flex-1 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Budget Code
                </div>
                <div className="w-16 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qty
                </div>
                <div className="w-20 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  UOM
                </div>
                <div className="w-28 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit Cost
                </div>
                <div className="w-28 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </div>
                <div className="w-10 text-center text-xs font-medium uppercase tracking-wider text-gray-500">

                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-200 bg-white">
                {loadingData ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    Loading project cost codes...
                  </div>
                ) : lineItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No line items. Click &quot;Add Row&quot; to get started.
                  </div>
                ) : (
                  lineItems.map((row) => (
                    <div key={row.id} data-row-id={row.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                      <div className="flex-1">
                        <BudgetCodeSelector
                          projectCostCodes={projectCostCodes}
                          selectedLabel={row.costCodeLabel}
                          onSelect={(costCode) => handleBudgetCodeSelect(row.id, costCode)}
                          onCreateNew={() => {
                            setPendingRowId(row.id);
                            setOpenPopoverId(null);
                            setShowCreateCodeModal(true);
                          }}
                          open={openPopoverId === row.id}
                          onOpenChange={(open) => setOpenPopoverId(open ? row.id : null)}
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          placeholder="0"
                          value={row.qty}
                          onChange={(e) => handleFieldChange(row.id, 'qty', e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full text-right"
                        />
                      </div>
                      <div className="w-20">
                        <UomSelect
                          value={row.uom}
                          onValueChange={(value) => handleFieldChange(row.id, 'uom', value)}
                          className="w-full"
                        />
                      </div>
                      <div className="w-28">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                            $
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={row.unitCost}
                            onChange={(e) => handleFieldChange(row.id, 'unitCost', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-7 text-right"
                          />
                        </div>
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          value={row.amount}
                          className="w-full bg-gray-50 text-right"
                          disabled
                        />
                      </div>
                      <div className="w-10 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <MobileLineItemCards
            lineItems={lineItems}
            projectCostCodes={projectCostCodes}
            loadingData={loadingData}
            openPopoverId={openPopoverId}
            onPopoverOpenChange={(id, open) => setOpenPopoverId(open ? id : null)}
            onBudgetCodeSelect={handleBudgetCodeSelect}
            onFieldChange={handleFieldChange}
            onRemoveRow={handleRemoveRow}
            onCreateNew={(rowId) => {
              setPendingRowId(rowId);
              setOpenPopoverId(null);
              setShowCreateCodeModal(true);
            }}
            onAddRow={handleAddRow}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>

      {/* Create Budget Code Modal */}
      <CreateBudgetCodeModal
        open={showCreateCodeModal}
        onOpenChange={setShowCreateCodeModal}
        projectId={projectId}
        onSuccess={handleCreateBudgetCodeSuccess}
      />
    </div>
  );
}

// Extracted UOM Select component to avoid repetition
function UomSelect({
  value,
  onValueChange,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className || 'w-28'}>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {UNITS_OF_MEASURE.map((uom) => (
          <SelectItem key={uom.code} value={uom.code}>
            {uom.code} - {uom.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Mobile card view component
function MobileLineItemCards({
  lineItems,
  projectCostCodes,
  loadingData,
  openPopoverId,
  onPopoverOpenChange,
  onBudgetCodeSelect,
  onFieldChange,
  onRemoveRow,
  onCreateNew,
  onAddRow,
  onSubmit,
  loading,
}: {
  lineItems: BudgetLineItem[];
  projectCostCodes: ProjectCostCode[];
  loadingData: boolean;
  openPopoverId: string | null;
  onPopoverOpenChange: (id: string, open: boolean) => void;
  onBudgetCodeSelect: (rowId: string, costCode: ProjectCostCode) => void;
  onFieldChange: (id: string, field: keyof BudgetLineItem, value: string) => void;
  onRemoveRow: (id: string) => void;
  onCreateNew: (rowId: string) => void;
  onAddRow: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddRow();
    }
  };
  if (loadingData) {
    return (
      <div className="sm:hidden text-center y-8 px-4">
        Loading project cost codes...
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div className="sm:hidden text-center py-8 px-4">
        No line items. Click &quot;Add Row&quot; to get started.
      </div>
    );
  }

  return (
    <div className="sm:hidden space-y-4 p-4">
      {lineItems.map((row, index) => (
        <div
          key={row.id}
          className="p-4 space-y-3 bg-white"
        >
          {/* Card Header */}
          <div className="flex justify-between items-start">
            <span>Line {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveRow(row.id)}
              disabled={lineItems.length === 1}
              className="touch-target -mr-2 -mt-2"
            >
              <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-600" />
            </Button>
          </div>

          {/* Budget Code Selector */}
          <div>
            <Label>
              Budget Code <span className="text-red-500">*</span>
            </Label>
            <BudgetCodeSelector
              projectCostCodes={projectCostCodes}
              selectedLabel={row.costCodeLabel}
              onSelect={(costCode) => onBudgetCodeSelect(row.id, costCode)}
              onCreateNew={() => onCreateNew(row.id)}
              open={openPopoverId === row.id}
              onOpenChange={(open) => onPopoverOpenChange(row.id, open)}
              className="w-full touch-target"
            />
          </div>

          {/* 2-Column Grid: Qty + UOM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Qty</Label>
              <Input
                type="number"
                value={row.qty}
                onChange={(e) => onFieldChange(row.id, 'qty', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full touch-target"
              />
            </div>
            <div>
              <Label>UOM</Label>
              <UomSelect
                value={row.uom}
                onValueChange={(value) => onFieldChange(row.id, 'uom', value)}
                className="w-full touch-target"
              />
            </div>
          </div>

          {/* 2-Column Grid: Unit Cost + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                  $
                </span>
                <Input
                  type="number"
                  value={row.unitCost}
                  onChange={(e) => onFieldChange(row.id, 'unitCost', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full touch-target pl-7"
                />
              </div>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={row.amount}
                className="w-full touch-target bg-gray-50"
                disabled
              />
            </div>
          </div>
        </div>
      ))}

      {/* Mobile Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onAddRow}
          variant="outline"
          className="w-full touch-target flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Line Item
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading || lineItems.length === 0}
          className="w-full touch-target"
        >
          {loading
            ? 'Creating...'
            : `Create ${lineItems.length} Line Item${lineItems.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
