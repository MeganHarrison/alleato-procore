'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { CreatePurchaseOrderForm, CreateSubcontractForm } from '@/components/domain/contracts';
import { PageContainer, ProjectPageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import type { CreatePurchaseOrderInput } from '@/lib/schemas/create-purchase-order-schema';
import type { CreateSubcontractInput } from '@/lib/schemas/create-subcontract-schema';

export default function NewCommitmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = Number(params.projectId);
  const type = searchParams.get('type') || 'subcontract'; // 'subcontract' or 'purchase_order'

  const handleSubmitSubcontract = async (data: CreateSubcontractInput) => {
    try {
      // TODO: Implement API call to create subcontract
      console.warn('Subcontract submission not yet implemented:', data);

      // For now, just navigate back to commitments page
      router.push(`/${projectId}/commitments`);
    } catch (err) {
      console.error('Error creating subcontract:', err);
      alert(err instanceof Error ? err.message : 'Failed to create subcontract');
    }
  };

  const handleSubmitPurchaseOrder = async (data: CreatePurchaseOrderInput) => {
    try {
      // TODO: Implement API call to create purchase order
      console.warn('Purchase order submission not yet implemented:', data);

      // For now, just navigate back to commitments page
      router.push(`/${projectId}/commitments`);
    } catch (err) {
      console.error('Error creating purchase order:', err);
      alert(err instanceof Error ? err.message : 'Failed to create purchase order');
    }
  };

  const handleCancel = () => {
    router.push(`/${projectId}/commitments`);
  };

  const title = type === 'subcontract' ? 'New Subcontract' :
                type === 'purchase_order' ? 'New Purchase Order' :
                'New Commitment';

  return (
    <>
      <ProjectPageHeader
        title={title}
        breadcrumbs={[
          { label: 'Commitments', href: `/${projectId}/commitments` },
          { label: title },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <PageContainer>
        {type === 'purchase_order' ? (
          <CreatePurchaseOrderForm
            projectId={projectId}
            onSubmit={handleSubmitPurchaseOrder}
            onCancel={handleCancel}
          />
        ) : (
          <CreateSubcontractForm
            projectId={projectId}
            onSubmit={handleSubmitSubcontract}
            onCancel={handleCancel}
          />
        )}
      </PageContainer>
    </>
  );
}
