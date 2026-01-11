"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPageHeader, FormContainer } from "@/components/layout";
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
      // Use the new prime_contracts API
      const response = await fetch(`/api/projects/${projectId}/contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_number: data.number,
          title: data.title,
          vendor_id: data.ownerClientId || null, // Map ownerClientId to vendor_id
          description: data.description,
          status: data.status || "draft",
          original_contract_value: data.originalAmount || 0,
          revised_contract_value:
            data.revisedAmount || data.originalAmount || 0,
          start_date: data.startDate?.toISOString() || null,
          end_date: data.estimatedCompletionDate?.toISOString() || null,
          retention_percentage: data.defaultRetainage || 0,
          payment_terms: null, // Not in form yet
          billing_schedule: null, // Not in form yet
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contract");
      }

      const newContract = await response.json();
      router.push(`/${projectId}/contracts/${newContract.id}`);
    } catch (err) {
      console.error("Error creating contract:", err);
      alert(err instanceof Error ? err.message : "Failed to create contract");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${projectId}/contracts`);
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
    <>
      <ProjectPageHeader
        title="New Prime Contract"
        breadcrumbs={[
          { label: "Contracts", href: `/${projectId}/contracts` },
          { label: "New Contract" },
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
    </>
  );
}
