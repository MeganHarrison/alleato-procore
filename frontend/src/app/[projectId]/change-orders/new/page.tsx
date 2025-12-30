'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { createChangeOrderSchema } from '@/app/api/projects/[id]/contracts/[contractId]/change-orders/validation';

interface PrimeContractOption {
  id: string;
  label: string;
}

type ChangeOrderFormValues = z.input<typeof createChangeOrderSchema>;

export default function NewProjectChangeOrderPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string, 10);

  const [contractOptions, setContractOptions] = useState<PrimeContractOption[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ChangeOrderFormValues>({
    resolver: zodResolver(createChangeOrderSchema),
    defaultValues: {
      contract_id: '',
      change_order_number: '',
      description: '',
      amount: 0,
      status: 'pending',
      requested_date: undefined,
    },
  });

  useEffect(() => {
    const fetchContracts = async () => {
      if (!projectId) return;

      setLoadingContracts(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('prime_contracts')
        .select('id, contract_number, title')
        .eq('project_id', projectId)
        .order('contract_number');

      if (error) {
        toast.error('Unable to load prime contracts');
        setLoadingContracts(false);
        return;
      }

      const options = (data || []).map((contract) => ({
        id: contract.id,
        label: contract.contract_number
          ? `${contract.contract_number} — ${contract.title}`
          : contract.title,
      }));

      setContractOptions(options);

      if (options.length === 1) {
        form.setValue('contract_id', options[0].id);
      }

      setLoadingContracts(false);
    };

    fetchContracts();
  }, [form, projectId]);

  const requestedDateValue = form.watch('requested_date');
  const requestedDate = requestedDateValue ? new Date(requestedDateValue) : undefined;

  const onSubmit: SubmitHandler<ChangeOrderFormValues> = async (values) => {
    if (!values.contract_id) {
      toast.error('Select a prime contract for this change order');
      return;
    }

    try {
      setSubmitting(true);
      const payload: ChangeOrderFormValues = {
        ...values,
        requested_date: values.requested_date ? new Date(values.requested_date).toISOString() : undefined,
      };

      const response = await fetch(
        `/api/projects/${projectId}/contracts/${values.contract_id}/change-orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create change order');
        return;
      }

      toast.success('Change order created');
      router.push(`/${projectId}/change-orders`);
    } catch (error) {
      console.error('Error creating change order', error);
      toast.error('Unexpected error creating change order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${projectId}/change-orders`);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Change Orders
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Change Order</h1>
        <p className="text-muted-foreground">Create a new client contract change order</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Change Order Details</CardTitle>
          <CardDescription>
            Capture the required details for the client contract change order before submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contract">Prime Contract*</Label>
                  <Select
                    value={form.watch('contract_id')}
                    onValueChange={(value) => form.setValue('contract_id', value)}
                    disabled={loadingContracts || contractOptions.length === 0}
                  >
                    <SelectTrigger id="contract">
                      <SelectValue placeholder={loadingContracts ? 'Loading contracts...' : 'Select contract'} />
                    </SelectTrigger>
                    <SelectContent>
                      {contractOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="change_order_number">Change Order #*</Label>
                  <Input
                    id="change_order_number"
                    placeholder="CO-001"
                    {...form.register('change_order_number')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description*</Label>
                  <Textarea
                    id="description"
                    rows={6}
                    placeholder="Describe the scope and justification for the change"
                    {...form.register('description')}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount*</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('amount', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status*</Label>
                  <Select
                    value={form.watch('status') || 'pending'}
                    onValueChange={(value) => form.setValue('status', value as ChangeOrderFormValues['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Requested Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !requestedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {requestedDate ? format(requestedDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={requestedDate}
                        onSelect={(date) =>
                          form.setValue('requested_date', date ? date.toISOString() : undefined)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Change Order'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
