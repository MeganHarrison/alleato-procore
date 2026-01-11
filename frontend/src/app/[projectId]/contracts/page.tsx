"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Plus, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PageContainer,
  ProjectPageHeader,
  PageTabs,
} from "@/components/layout";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ChangeOrder } from "@/hooks/use-change-orders";

// Prime Contract interface matching the new schema
interface Contract {
  id: string;
  project_id: number;
  contract_number: string;
  title: string;
  vendor_id: string | null;
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

// Component to fetch and display change orders for a contract
function ContractChangeOrders({
  contract,
  getStatusBadge,
}: {
  contract: Contract;
  getStatusBadge: (status: string | null) => React.ReactNode;
}) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangeOrders = async () => {
      if (!contract.project_id) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("change_orders")
          .select("*")
          .eq("project_id", contract.project_id)
          .order("co_number", { ascending: true });

        if (!error) {
          setChangeOrders(data || []);
        }
      } catch (err) {
        console.error("Error fetching change orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChangeOrders();
  }, [contract.project_id]);

  if (loading) {
    return (
      <TableRow>
        <TableCell
          colSpan={7}
          className="px-4 py-3 text-center text-gray-500 bg-gray-50"
        >
          Loading change orders...
        </TableCell>
      </TableRow>
    );
  }

  if (changeOrders.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={7}
          className="px-4 py-3 text-center text-gray-500 bg-gray-50"
        >
          No change orders for this contract
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {changeOrders.map((co) => (
        <TableRow
          key={co.id}
          className="bg-blue-50/50 border-b border-gray-100"
        >
          <TableCell className="px-4 py-2" />
          <TableCell className="px-4 py-2 pl-12 text-sm text-gray-600">
            <Link
              href={`/${contract.project_id}/change-orders/${co.id}`}
              className="text-blue-600 hover:underline"
            >
              {co.co_number || `PCO-${co.id}`}
            </Link>
          </TableCell>
          <TableCell className="px-4 py-2 text-sm text-gray-600" colSpan={2}>
            {co.title || "--"}
          </TableCell>
          <TableCell className="px-4 py-2 text-sm">
            {getStatusBadge(co.status)}
          </TableCell>
          <TableCell className="px-4 py-2 text-sm text-right">--</TableCell>
          <TableCell className="px-4 py-2 text-sm text-right">--</TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function ProjectContractsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = parseInt(params.projectId as string, 10);
  const statusFilter = searchParams.get("status") || "all";

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchContracts = async () => {
      if (!projectId) return;

      try {
        // Use the new prime_contracts API
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

  const toggleRow = useCallback((contractId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortColumn(column);
        setSortDirection("asc");
      }
    },
    [sortColumn, sortDirection],
  );

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "--";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
      active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
      completed: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Completed",
      },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
      on_hold: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "On Hold",
      },
      // Legacy statuses for change orders
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Pending",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Approved",
      },
    };
    const config =
      statusConfig[status?.toLowerCase() || "draft"] || statusConfig.draft;
    return (
      <Badge className={`${config.bg} ${config.text} font-normal`}>
        {config.label}
      </Badge>
    );
  };

  const filteredContracts = useMemo(() => {
    // Apply status filtering based on URL parameter
    let filtered = contracts.filter((contract) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") {
        return contract.status === "active";
      }
      if (statusFilter === "completed") {
        return contract.status === "completed";
      }
      return true;
    });

    // Apply sorting
    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        let aVal: string | number | null | undefined;
        let bVal: string | number | null | undefined;

        switch (sortColumn) {
          case "number":
            aVal = a.contract_number;
            bVal = b.contract_number;
            break;
          case "vendor":
            aVal = a.vendor?.name;
            bVal = b.vendor?.name;
            break;
          case "title":
            aVal = a.title;
            bVal = b.title;
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          case "original_value":
            aVal = a.original_contract_value || 0;
            bVal = b.original_contract_value || 0;
            break;
          case "revised_value":
            aVal = a.revised_contract_value || 0;
            bVal = b.revised_contract_value || 0;
            break;
          default:
            return 0;
        }

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    }

    return filtered;
  }, [contracts, sortColumn, sortDirection, statusFilter]);

  const totals = filteredContracts.reduce(
    (acc, contract) => ({
      original: acc.original + (contract.original_contract_value || 0),
      revised: acc.revised + (contract.revised_contract_value || 0),
    }),
    { original: 0, revised: 0 },
  );

  return (
    <>
      <ProjectPageHeader
        title="Prime Contracts"
        description="Manage prime contracts and owner agreements"
        showExportButton={true}
        onExportCSV={() => {
          // TODO: Implement CSV export functionality
          toast.info("CSV export coming soon");
        }}
        onExportPDF={() => {
          // TODO: Implement PDF export functionality
          toast.info("PDF export coming soon");
        }}
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

      {/* Summary Cards - Above Tabs */}
      <div className="px-4 sm:px-6 lg:px-12 py-6 bg-white border-b">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <div className="text-xl font-bold">
              {formatCurrency(totals.original)}
            </div>
            <p className="text-xs text-muted-foreground">
              Original Contract Value
            </p>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold">
              {formatCurrency(totals.revised)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revised Contract Value
            </p>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold">
              {formatCurrency(totals.revised - totals.original)}
            </div>
            <p className="text-xs text-muted-foreground">Change Orders Total</p>
          </Card>
        </div>
      </div>

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
            <p className="text-muted-foreground">Loading contracts...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No contracts found</p>
            <Button onClick={() => router.push(`/${projectId}/contracts/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first contract
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10">
                    <span className="sr-only">Expand</span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("number")}
                  >
                    <div className="flex items-center gap-1">
                      #
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("vendor")}
                  >
                    <div className="flex items-center gap-1">
                      Vendor
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("original_value")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Original Value
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("revised_value")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revised Value
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const isExpanded = expandedRows.has(contract.id);

                  return (
                    <Fragment key={contract.id}>
                      <TableRow
                        className={cn(
                          "border-b hover:bg-gray-50 cursor-pointer",
                          isExpanded && "bg-blue-50",
                        )}
                        onClick={() => toggleRow(contract.id)}
                      >
                        <TableCell>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(contract.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/${projectId}/contracts/${contract.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contract.contract_number || contract.id}
                          </Link>
                        </TableCell>
                        <TableCell>{contract.vendor?.name || "--"}</TableCell>
                        <TableCell>
                          <Link
                            href={`/${projectId}/contracts/${contract.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contract.title}
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(contract.original_contract_value)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(contract.revised_contract_value)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <ContractChangeOrders
                          contract={contract}
                          getStatusBadge={getStatusBadge}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
              <tfoot>
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={5}>Grand Totals</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.original)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.revised)}
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </div>
        )}
      </PageContainer>
    </>
  );
}
