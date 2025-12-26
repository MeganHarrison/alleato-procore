'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, Upload, X, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  PrimeContractChangeOrderSchema,
  type PrimeContractChangeOrderFormData,
  PCO_STATUS_LABELS,
  type PcoStatus
} from '@/lib/schemas/prime-contract-change-order-schema';
import { toast } from 'sonner';

// Simple rich text editor component (using contenteditable for now)
function RichTextEditor({ value, onChange }: { value: string | null; onChange: (value: string) => void }) {
  return (
    <div className="border rounded-md">
      <div className="bg-muted px-3 py-2 border-b flex gap-1">
        <button
          type="button"
          className="px-2 py-1 text-sm hover:bg-background rounded"
          onClick={() => document.execCommand('bold')}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="px-2 py-1 text-sm hover:bg-background rounded"
          onClick={() => document.execCommand('italic')}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="px-2 py-1 text-sm hover:bg-background rounded"
          onClick={() => document.execCommand('underline')}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className="px-2 py-1 text-sm hover:bg-background rounded"
          onClick={() => document.execCommand('insertUnorderedList')}
        >
          • List
        </button>
      </div>
      <div
        contentEditable
        className="min-h-[120px] p-3 focus:outline-none"
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
}

export default function NewPrimeContractChangeOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId');
  const contractId = searchParams?.get('contractId');

  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [potentialChangeOrders, setPotentialChangeOrders] = useState<string[]>([]);

  const form = useForm<PrimeContractChangeOrderFormData>({
    resolver: zodResolver(PrimeContractChangeOrderSchema) as Resolver<PrimeContractChangeOrderFormData>,
    defaultValues: {
      number: null,
      revision: null,
      title: null,
      status: 'draft',
      is_private: false,
      due_date: null,
      invoiced_date: null,
      paid_date: null,
      signed_change_order_received_date: null,
      revised_substantial_completion_date: null,
      designated_reviewer_id: null,
      description_html: null,
      executed: false,
      schedule_impact_days: null,
      potential_change_order_ids: [],
      attachment_ids: [],
      send_email: false,
    },
  });

  const handleSubmit = async (data: PrimeContractChangeOrderFormData, sendEmail: boolean = false) => {
    setLoading(true);

    try {
      // Upload attachments first
      const uploadedAttachmentIds: string[] = [];
      for (const _file of attachments) {
        // TODO: Implement actual file upload to Supabase Storage
        // const { data: uploadData } = await uploadFile(_file);
        // uploadedAttachmentIds.push(uploadData.id);
      }

      const payload = {
        ...data,
        attachment_ids: uploadedAttachmentIds,
        potential_change_order_ids: potentialChangeOrders,
        send_email: sendEmail,
        project_id: projectId,
        prime_contract_id: contractId,
      };

      const response = await fetch(`/api/projects/${projectId}/prime-contracts/${contractId}/change-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create change order');
      }

      await response.json();

      toast.success(sendEmail ? 'Change order created and email sent!' : 'Change order created successfully!');

      // Navigate to the contract detail page
      router.push(`/${projectId}/contracts/${contractId}`);
    } catch (error) {
      console.error('Error creating change order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create change order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <h1 className="text-2xl font-bold">New Prime Contract Change Order</h1>
        <p className="text-muted-foreground">Create a new change order for a prime contract</p>
      </div>

      <form onSubmit={form.handleSubmit((data) => handleSubmit(data, false))}>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-6">General Information</h2>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* #: */}
                <div className="space-y-2">
                  <Label htmlFor="number">#:</Label>
                  <Input
                    id="number"
                    {...form.register('number')}
                    placeholder="Enter change order number"
                  />
                </div>

                {/* Revision */}
                <div className="space-y-2">
                  <Label htmlFor="revision">Revision:</Label>
                  <Input
                    id="revision"
                    {...form.register('revision')}
                    placeholder="Enter revision"
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title:</Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="Enter title"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status:*</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as PcoStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PCO_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('due_date') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('due_date') ? format(new Date(form.watch('due_date')!), 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('due_date') ? new Date(form.watch('due_date')!) : undefined}
                        onSelect={(date) => form.setValue('due_date', date ? date.toISOString().split('T')[0] : null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Designated Reviewer */}
                <div className="space-y-2">
                  <Label htmlFor="designated_reviewer">Designated Reviewer:</Label>
                  <Select
                    value={form.watch('designated_reviewer_id') || undefined}
                    onValueChange={(value) => form.setValue('designated_reviewer_id', value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Populate from API */}
                      <SelectItem value="user-1">Smith, John (Alleato Group)</SelectItem>
                      <SelectItem value="user-2">Doe, Jane (Alleato Group)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description:</Label>
                  <RichTextEditor
                    value={form.watch('description_html')}
                    onChange={(value) => form.setValue('description_html', value)}
                  />
                </div>

                {/* Executed */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="executed"
                    checked={form.watch('executed')}
                    onCheckedChange={(checked) => form.setValue('executed', checked as boolean)}
                  />
                  <Label htmlFor="executed" className="cursor-pointer">
                    Executed
                  </Label>
                </div>

                {/* Potential Change Orders */}
                <div className="space-y-2">
                  <Label>Potential Change Orders:</Label>
                  <Select onValueChange={(value) => {
                    if (value && !potentialChangeOrders.includes(value)) {
                      setPotentialChangeOrders([...potentialChangeOrders, value]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a PCO to Add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Populate from API */}
                      <SelectItem value="pco-1">PCO #1 - Sample PCO</SelectItem>
                      <SelectItem value="pco-2">PCO #2 - Another PCO</SelectItem>
                    </SelectContent>
                  </Select>
                  {potentialChangeOrders.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {potentialChangeOrders.map((pcoId, index) => (
                        <div key={pcoId} className="flex items-center justify-between bg-muted px-3 py-2 rounded">
                          <span className="text-sm">PCO #{pcoId}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPotentialChangeOrders(potentialChangeOrders.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedule Impact */}
                <div className="space-y-2">
                  <Label htmlFor="schedule_impact">Schedule Impact:</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="schedule_impact"
                      type="number"
                      min="0"
                      {...form.register('schedule_impact_days', { valueAsNumber: true })}
                      placeholder="0"
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label>Attachments:</Label>
                  <div className="border-2 border-dashed rounded-md p-4">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </span>
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted px-3 py-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                {/* Date Created (Read-only, shown after creation) */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date Created:</Label>
                  <p className="text-sm">--</p>
                </div>

                {/* Created By (Read-only, shown after creation) */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created By:</Label>
                  <p className="text-sm">--</p>
                </div>

                {/* Private */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_private"
                    checked={form.watch('is_private')}
                    onCheckedChange={(checked) => form.setValue('is_private', checked as boolean)}
                  />
                  <Label htmlFor="is_private" className="cursor-pointer">
                    Private
                  </Label>
                </div>

                {/* Invoiced Date */}
                <div className="space-y-2">
                  <Label>Invoiced Date:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('invoiced_date') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('invoiced_date') ? format(new Date(form.watch('invoiced_date')!), 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('invoiced_date') ? new Date(form.watch('invoiced_date')!) : undefined}
                        onSelect={(date) => form.setValue('invoiced_date', date ? date.toISOString().split('T')[0] : null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Paid Date */}
                <div className="space-y-2">
                  <Label>Paid Date:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('paid_date') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('paid_date') ? format(new Date(form.watch('paid_date')!), 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('paid_date') ? new Date(form.watch('paid_date')!) : undefined}
                        onSelect={(date) => form.setValue('paid_date', date ? date.toISOString().split('T')[0] : null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reviewer (Read-only) */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Reviewer:</Label>
                  <p className="text-sm">--</p>
                </div>

                {/* Review Date (Read-only) */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Review Date:</Label>
                  <p className="text-sm">--</p>
                </div>

                {/* Signed Change Order Received Date */}
                <div className="space-y-2">
                  <Label>Signed Change Order Received Date:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('signed_change_order_received_date') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('signed_change_order_received_date')
                          ? format(new Date(form.watch('signed_change_order_received_date')!), 'PPP')
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('signed_change_order_received_date') ? new Date(form.watch('signed_change_order_received_date')!) : undefined}
                        onSelect={(date) => form.setValue('signed_change_order_received_date', date ? date.toISOString().split('T')[0] : null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Revised Substantial Completion Date */}
                <div className="space-y-2">
                  <Label>Revised Substantial Completion Date:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('revised_substantial_completion_date') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('revised_substantial_completion_date')
                          ? format(new Date(form.watch('revised_substantial_completion_date')!), 'PPP')
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('revised_substantial_completion_date') ? new Date(form.watch('revised_substantial_completion_date')!) : undefined}
                        onSelect={(date) => form.setValue('revised_substantial_completion_date', date ? date.toISOString().split('T')[0] : null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((data) => handleSubmit(data, true))}
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Create & Email
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
