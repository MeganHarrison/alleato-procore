'use client';

import { useState, useEffect } from 'react';
import { BaseModal, ModalBody, ModalFooter } from './BaseModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Grid, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OriginalBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  costCode: string;
  budgetLineId: string;
  currentData?: {
    calculationMethod: 'unit_price' | 'lump_sum';
    unitQty: number;
    uom: string;
    unitCost: number;
    originalBudget: number;
  };
  onSave: (data: any) => Promise<void>;
}

/**
 * OriginalBudgetModal - Edit original budget amount
 *
 * Features:
 * - Two tabs: Original Budget (edit) and History (read-only)
 * - Calculation: Original Budget = Unit Qty × Unit Cost
 * - Real-time calculation updates
 * - Mobile responsive layout
 * - Matches Procore design
 */
export function OriginalBudgetModal({
  isOpen,
  onClose,
  costCode,
  budgetLineId,
  currentData,
  onSave
}: OriginalBudgetModalProps) {
  const [activeTab, setActiveTab] = useState<'budget' | 'history'>('budget');
  const [calculationMethod, setCalculationMethod] = useState<'unit_price' | 'lump_sum'>(
    currentData?.calculationMethod || 'unit_price'
  );
  const [unitQty, setUnitQty] = useState<string>(currentData?.unitQty?.toString() || '');
  const [uom, setUom] = useState<string>(currentData?.uom || '');
  const [unitCost, setUnitCost] = useState<string>(currentData?.unitCost?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate original budget in real-time
  const originalBudget = calculationMethod === 'unit_price'
    ? (parseFloat(unitQty) || 0) * (parseFloat(unitCost) || 0)
    : parseFloat(unitCost) || 0; // For lump sum, unitCost is the total

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCalculationMethod(currentData?.calculationMethod || 'unit_price');
      setUnitQty(currentData?.unitQty?.toString() || '');
      setUom(currentData?.uom || '');
      setUnitCost(currentData?.unitCost?.toString() || '');
      setActiveTab('budget');
    }
  }, [isOpen, currentData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        budgetLineId,
        calculationMethod,
        unitQty: calculationMethod === 'unit_price' ? parseFloat(unitQty) || 0 : null,
        uom: calculationMethod === 'unit_price' ? uom : null,
        unitCost: parseFloat(unitCost) || 0,
        originalBudget
      });
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
      // Error handling would show toast here
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    calculationMethod !== currentData?.calculationMethod ||
    (parseFloat(unitQty) || 0) !== (currentData?.unitQty || 0) ||
    uom !== (currentData?.uom || '') ||
    (parseFloat(unitCost) || 0) !== (currentData?.unitCost || 0);

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Original Budget Amount for ${costCode}`}
      size="lg"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'budget' | 'history')}>
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            <TabsTrigger
              value="budget"
              className={cn(
                'rounded-none border-b-2 px-4 py-3',
                'data-[state=active]:border-orange-500 data-[state=active]:text-orange-600',
                'data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600',
                'hover:text-gray-900'
              )}
            >
              Original Budget
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className={cn(
                'rounded-none border-b-2 px-4 py-3',
                'data-[state=active]:border-orange-500 data-[state=active]:text-orange-600',
                'data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600',
                'hover:text-gray-900'
              )}
            >
              History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Original Budget Tab */}
        <TabsContent value="budget" className="m-0">
          <ModalBody>
            {/* Calculation Method */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Calculation Method
              </Label>
              <RadioGroup
                value={calculationMethod}
                onValueChange={(v) => setCalculationMethod(v as 'unit_price' | 'lump_sum')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border border-gray-300 rounded px-4 py-2 hover:border-gray-400 cursor-pointer">
                  <RadioGroupItem value="unit_price" id="unit_price" />
                  <Label htmlFor="unit_price" className="cursor-pointer flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    <span>Unit Price</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-gray-300 rounded px-4 py-2 hover:border-gray-400 cursor-pointer">
                  <RadioGroupItem value="lump_sum" id="lump_sum" />
                  <Label htmlFor="lump_sum" className="cursor-pointer flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Lump Sum</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Input Fields - Responsive Grid */}
            <div className={cn(
              'grid gap-4',
              calculationMethod === 'unit_price'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                : 'grid-cols-1 sm:grid-cols-2'
            )}>
              {/* Unit Qty - Only for unit price */}
              {calculationMethod === 'unit_price' && (
                <div>
                  <Label htmlFor="unitQty" className="text-sm font-medium text-gray-700">
                    Unit Qty
                  </Label>
                  <Input
                    id="unitQty"
                    type="number"
                    step="0.01"
                    value={unitQty}
                    onChange={(e) => setUnitQty(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              )}

              {/* UOM - Only for unit price */}
              {calculationMethod === 'unit_price' && (
                <div>
                  <Label htmlFor="uom" className="text-sm font-medium text-gray-700">
                    UOM
                  </Label>
                  <Select value={uom} onValueChange={setUom}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EA">EA - Each</SelectItem>
                      <SelectItem value="SF">SF - Square Feet</SelectItem>
                      <SelectItem value="LF">LF - Linear Feet</SelectItem>
                      <SelectItem value="CY">CY - Cubic Yards</SelectItem>
                      <SelectItem value="TON">TON - Ton</SelectItem>
                      <SelectItem value="HR">HR - Hours</SelectItem>
                      <SelectItem value="LS">LS - Lump Sum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Unit Cost */}
              <div>
                <Label htmlFor="unitCost" className="text-sm font-medium text-gray-700">
                  {calculationMethod === 'unit_price' ? 'Unit Cost' : 'Amount'}
                </Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="$0.00"
                  className="mt-1"
                />
              </div>

              {/* Original Budget - Calculated (Read-only) */}
              <div className={calculationMethod === 'unit_price' ? 'lg:col-span-2' : ''}>
                <Label htmlFor="originalBudget" className="text-sm font-medium text-gray-700">
                  Original Budget
                </Label>
                <Input
                  id="originalBudget"
                  type="text"
                  value={`$${originalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  disabled
                  className="mt-1 bg-gray-50 text-gray-900 font-semibold"
                  readOnly
                />
              </div>
            </div>

            {/* Calculation Formula Display */}
            {calculationMethod === 'unit_price' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Formula:</span> Original Budget = Unit Qty × Unit Cost
                  {unitQty && unitCost && (
                    <span className="ml-2">
                      ({unitQty} × ${unitCost} = ${originalBudget.toFixed(2)})
                    </span>
                  )}
                </p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? 'Saving...' : 'Done'}
            </Button>
          </ModalFooter>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="m-0">
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                View the history of changes to this budget line item.
              </p>

              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Snapshot Name</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-700">Unit Qty</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">UOM</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-700">Unit Cost</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-700">Original Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Current snapshot */}
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        Current - {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td className="px-4 py-3 text-right">{currentData?.unitQty?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3">{currentData?.uom || '-'}</td>
                      <td className="px-4 py-3 text-right">${currentData?.unitCost?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 text-right font-medium">${currentData?.originalBudget?.toFixed(2) || '0.00'}</td>
                    </tr>

                    {/* Empty state */}
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No previous snapshots available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </ModalFooter>
        </TabsContent>
      </Tabs>
    </BaseModal>
  );
}
