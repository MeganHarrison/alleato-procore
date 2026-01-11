"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { PageContainer, ProjectPageHeader, PageTabs } from "@/components/layout";
import { GenericDataTable } from "@/components/tables/generic-table-factory";
import { contractsTableConfig, formatCurrency } from "@/config/tables/contracts.config";
import { useProjectTitle } from "@/hooks/useProjectTitle";

// Prime Contract interface matching the schema
interface Contract {
  id: string;
  project_id: number;
  contract_number: string;
  title: string;
  vendor_id: string | null;
  vendor_name?: string; // For generic table
  description: string | null;
  status: "draft" | "active" | "completed" | "cancelled" | "on_hold";
  original_contract_value: number;
  revised_contract_value: number;
  start_date: string | null;
  end_date: string | null;
  retention_percentage: number | null;
  payment_terms: string | null;
  billing_schedule: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: string;
    name: string;
  } | null;
}

export default function ProjectContractsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = parseInt(params.projectId as string, 10);
  const statusFilter = searchParams.get("status") || "all";

  useProjectTitle("Prime Contracts");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch contracts
  useEffect(() => {
    const fetchContracts = async () => {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${projectId}/contracts`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setContracts(data || []);
      } catch (err) {
        console.error("Error fetching contracts:", err);
        toast.error("Failed to load contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [projectId]);

  // Filter contracts by status
  const filteredContracts = useMemo(() => {
    if (statusFilter === "all") return contracts;
    return contracts.filter((contract) => contract.status === statusFilter);
  }, [contracts, statusFilter]);

  // Transform contracts for GenericDataTable (flatten vendor)
  const tableData = useMemo(() => {
    return filteredContracts.map((contract) => ({
      ...contract,
      vendor_name: contract.vendor?.name || null,
    }));
  }, [filteredContracts]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredContracts.reduce(
      (acc, contract) => ({
        original: acc.original + (contract.original_contract_value || 0),
        revised: acc.revised + (contract.revised_contract_value || 0),
      }),
      { original: 0, revised: 0 },
    );
  }, [filteredContracts]);

  // Table configuration with row click
  const tableConfig = useMemo(
    () => ({
      ...contractsTableConfig,
      rowClickPath: `/${projectId}/contracts/{id}`,
    }),
    [projectId],
  );

  return (
    <>
      <ProjectPageHeader
        title="Prime Contracts"
        description="Manage prime contracts and owner agreements"
        showExportButton={false} // Export handled by GenericDataTable
        actions={
          <Button
            size="sm"
            onClick={() => router.push(`/${projectId}/contracts/new`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="px-4 sm:px-6 lg:px-12 py-6 bg-white border-b">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <div className="text-xl font-bold">
              {formatCurrency(totals.original)}
            </div>
            <Text size="xs" tone="muted">
              Original Contract Value
            </Text>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold">
              {formatCurrency(totals.revised)}
            </div>
            <Text size="xs" tone="muted">
              Revised Contract Value
            </Text>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold">
              {formatCurrency(totals.revised - totals.original)}
            </div>
            <Text size="xs" tone="muted">Change Orders Total</Text>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <PageTabs
        tabs={[
          {
            label: "All Contracts",
            href: `/${projectId}/contracts`,
            count: contracts.length,
          },
          { label: "Active", href: `/${projectId}/contracts?status=active` },
          {
            label: "Completed",
            href: `/${projectId}/contracts?status=completed`,
          },
        ]}
      />

      <PageContainer className="space-y-6">
        {/* Contracts Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Text tone="muted">Loading contracts...</Text>
          </div>
        ) : tableData.length === 0 ? (
          <div className="text-center py-12">
            <Text tone="muted" className="mb-4">No contracts found</Text>
            <Button onClick={() => router.push(`/${projectId}/contracts/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first contract
            </Button>
          </div>
        ) : (
          <GenericDataTable
            data={tableData}
            config={tableConfig}
          />
        )}
      </PageContainer>
    </>
  );
}
