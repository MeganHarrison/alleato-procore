"use client";
import { useState, useEffect } from "react";
import { TableLayout } from "@/components/layouts";
import { ProjectPageHeader } from "@/components/layout";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/components/domain/contracts";
import type { ContractFormData } from "@/components/domain/contracts/ContractForm";
interface Contract {
  id: string;
  contract_number: string | null;
  title: string;
  status: "draft" | "active" | "completed" | "cancelled" | "on_hold";
  original_contract_value: number;
  revised_contract_value: number;
  start_date: string | null;
  end_date: string | null;
  retention_percentage: number;
  payment_terms: string | null;
  billing_schedule: string | null;
  description: string | null;
  vendor_id: string | null;
}
export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const contractId = params.contractId as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/contracts/${contractId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load contract");
        }
        const data = await response.json();
        setContract(data);
      } catch (err) {
        console.error("Error fetching contract:", err);
        alert("Failed to load contract");
        router.push(`/${projectId}/contracts`);
      } finally {
        setLoading(false);
      }
    };
    if (contractId && projectId) {
      fetchContract();
    }
  }, [contractId, projectId, router]);
  const handleSubmit = async (data: ContractFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/contracts/${contractId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contract_number: data.number,
            title: data.title,
            vendor_id: data.ownerClientId || null,
            description: data.description,
            status: data.status || "draft",
            original_contract_value: data.originalAmount || 0,
            revised_contract_value:
              data.revisedAmount || data.originalAmount || 0,
            start_date: data.startDate?.toISOString().split("T")[0] || null,
            end_date:
              data.estimatedCompletionDate?.toISOString().split("T")[0] || null,
            retention_percentage: data.defaultRetainage || 0,
            payment_terms: null,
            billing_schedule: null,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update contract");
      }
      router.push(`/${projectId}/contracts/${contractId}`);
    } catch (err) {
      console.error("Error updating contract:", err);
      alert(err instanceof Error ? err.message : "Failed to update contract");
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    router.push(`/${projectId}/contracts/${contractId}`);
  };
  if (loading) {
    return (
      <>
        {" "}
        <ProjectPageHeader
          title="Edit Contract"
          breadcrumbs={[
            { label: "Contracts", href: `/${projectId}/contracts` },
            { label: "Edit Contract" },
          ]}
        />{" "}
        <TableLayout>
          {" "}
          <div className="text-center py-8">Loading contract...</div>{" "}
        </TableLayout>{" "}
      </>
    );
  }
  if (!contract) {
    return null;
  } // Map contract data to form data const initialData: Partial<ContractFormData> = { number: contract.contract_number || '', title: contract.title, status: contract.status, ownerClientId: contract.vendor_id || undefined, description: contract.description || '', originalAmount: contract.original_contract_value, revisedAmount: contract.revised_contract_value, startDate: contract.start_date ? new Date(contract.start_date) : undefined, estimatedCompletionDate: contract.end_date ? new Date(contract.end_date) : undefined, defaultRetainage: contract.retention_percentage, executed: contract.status === 'active' || contract.status === 'completed', isPrivate: false, }; return ( <> <ProjectPageHeader title="Edit Contract" breadcrumbs={[ { label: 'Contracts', href: `/${projectId}/contracts` }, { label: contract.contract_number || contractId, href: `/${projectId}/contracts/${contractId}` }, { label: 'Edit' }, ]} actions={ <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2" > <ArrowLeft className="h-4 w-4" /> Back </Button> } /> <TableLayout> <ContractForm initialData={initialData} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSaving} mode="edit" projectId={projectId} /> </TableLayout> </> );
}
