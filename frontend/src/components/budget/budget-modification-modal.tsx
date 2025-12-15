'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface BudgetModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function BudgetModificationModal({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: BudgetModificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'change_order',
    amount: '',
    reason: '',
    approver: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: API call to create budget modification
      console.log('Creating budget modification:', { projectId, ...formData });

      // Close modal and notify parent
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'change_order',
        amount: '',
        reason: '',
        approver: '',
      });
    } catch (error) {
      console.error('Error creating budget modification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] max-w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Budget Modification</SheetTitle>
          <SheetDescription>
            Create a budget change order, transfer, or adjustment for this project
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 py-4">
              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="title">Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Foundation Design Change"
                  required
                />
              </div>

              {/* Type */}
              <div className="grid gap-2">
                <Label htmlFor="type">Modification Type*</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change_order">Change Order</SelectItem>
                    <SelectItem value="budget_transfer">Budget Transfer</SelectItem>
                    <SelectItem value="adjustment">Budget Adjustment</SelectItem>
                    <SelectItem value="revision">Budget Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount*</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-gray-500">Use negative values for decreases</p>
              </div>

              {/* Reason */}
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason*</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="Describe the reason for this budget modification..."
                  rows={3}
                  required
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Additional details about this modification..."
                  rows={3}
                />
              </div>

              {/* Approver */}
              <div className="grid gap-2">
                <Label htmlFor="approver">Approver</Label>
                <Select value={formData.approver} onValueChange={(value) => handleChange('approver', value)}>
                  <SelectTrigger id="approver">
                    <SelectValue placeholder="Select approver..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="finance_director">Finance Director</SelectItem>
                    <SelectItem value="vp_operations">VP of Operations</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Modification'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
