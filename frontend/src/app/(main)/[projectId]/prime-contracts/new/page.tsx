"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPageHeader, PageContainer, FormContainer } from "@/components/layout";
import { ContractForm } from "@/components/domain/contracts";
import type { ContractFormData } from "@/components/domain/contracts/ContractForm";

export default function NewContractPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: ContractFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_number: data.number,
          title: data.title,
          client_id: data.ownerClientId || null,
          contractor_id: data.contractorId || null,
          architect_engineer_id: data.architectEngineerId || null,
          contract_company_id: data.contractCompanyId || null,
          description: data.description,
          status: data.status || "draft",
          executed_at: data.executed ? new Date().toISOString() : null,
          original_contract_value: data.originalAmount || 0,
          revised_contract_value:
            data.revisedAmount || data.originalAmount || 0,
          start_date: data.startDate?.toISOString() || null,
          end_date: data.estimatedCompletionDate?.toISOString() || null,
          substantial_completion_date:
            data.substantialCompletionDate?.toISOString() || null,
          actual_completion_date:
            data.actualCompletionDate?.toISOString() || null,
          signed_contract_received_date:
            data.signedContractReceivedDate?.toISOString() || null,
          contract_termination_date:
            data.contractTerminationDate?.toISOString() || null,
          retention_percentage: data.defaultRetainage || 0,
          payment_terms: null,
          billing_schedule: null,
          is_private: data.isPrivate || false,
          inclusions: data.inclusions || null,
          exclusions: data.exclusions || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contract");
      }

      const newContract = await response.json();
      router.push(`/${projectId}/prime-contracts/${newContract.id}`);
    } catch (err) {
      console.error("Error creating contract:", err);
      alert(err instanceof Error ? err.message : "Failed to create contract");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${projectId}/prime-contracts`);
  };

  const initialData: Partial<ContractFormData> = {
    number: "",
    title: "",
    status: "draft",
    executed: false,
    isPrivate: false,
    defaultRetainage: 10,
  };

  return (
    <PageContainer>
      <ProjectPageHeader
        title="New Prime Contract"
        breadcrumbs={[
          { label: "Prime Contracts", href: `/${projectId}/prime-contracts` },
          { label: "New Contract" },
        ]}
      actions={undefined}
      />

      <FormContainer maxWidth="lg" className="max-w-[960px]">
        <ContractForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSaving}
          mode="create"
          projectId={projectId}
        />
      </FormContainer>
    </PageContainer>
  );
}
