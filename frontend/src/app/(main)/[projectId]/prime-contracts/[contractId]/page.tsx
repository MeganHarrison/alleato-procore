"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  History,
  Mail,
  Plus,
} from "lucide-react";

import { ProjectPageHeader } from "@/components/layout";
import { TableLayout } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import type { ContractChangeOrder } from "@/types/contract-change-orders";
import type { ContractLineItemWithCostCode } from "@/types/contract-line-items";

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
  created_at: string;
  created_by: string | null;
  vendor_id: string | null;
  project_id: number;
  vendor?: { id: string; name: string } | null;
}

export default function ProjectContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const contractId = params.contractId as string;

  useProjectTitle("Prime Contract");

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalInfoOpen, setGeneralInfoOpen] = useState(true);
  const [contractSummaryOpen, setContractSummaryOpen] = useState(true);
  const [lineItems, setLineItems] = useState<ContractLineItemWithCostCode[]>([]);
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [changeOrders, setChangeOrders] = useState<ContractChangeOrder[]>([]);
  const [changeOrdersLoading, setChangeOrdersLoading] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/contracts/${contractId}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Contract not found");
          } else {
            setError("Failed to load contract");
          }
          return;
        }

        const data = await response.json();
        setContract(data);
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Failed to load contract");
      } finally {
        setLoading(false);
      }
    };

    if (contractId && projectId) {
      fetchContract();
    }
  }, [contractId, projectId]);

  useEffect(() => {
    const fetchLineItems = async () => {
      if (!contract) return;

      try {
        setLineItemsLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/contracts/${contractId}/line-items`,
        );

        if (!response.ok) {
          console.error("Failed to fetch line items");
          return;
        }

        const data = await response.json();
        setLineItems(data || []);
      } catch (err) {
        console.error("Error fetching line items:", err);
      } finally {
        setLineItemsLoading(false);
      }
    };

    fetchLineItems();
  }, [contract, contractId, projectId]);

  useEffect(() => {
    const fetchChangeOrders = async () => {
      if (!contract) return;

      try {
        setChangeOrdersLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/contracts/${contractId}/change-orders`,
        );

        if (!response.ok) {
          console.error("Failed to fetch change orders");
          return;
        }

        const data = await response.json();
        setChangeOrders(data || []);
      } catch (err) {
        console.error("Error fetching change orders:", err);
      } finally {
        setChangeOrdersLoading(false);
      }
    };

    fetchChangeOrders();
  }, [contract, contractId, projectId]);

  const handleBack = () => {
    router.push(`/${projectId}/prime-contracts`);
  };

  const handleEdit = () => {
    router.push(`/${projectId}/prime-contracts/${contractId}/edit`);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "$0.00";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "--";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  };

  const getStatusBadgeVariant = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "default";
      case "on_hold":
        return "warning";
      case "cancelled":
        return "destructive";
      case "draft":
      default:
        return "secondary";
    }
  };

  const changeOrdersCount = changeOrders.length;
  const approvedChangeOrders = useMemo(
    () => changeOrders.filter((co) => co.status === "approved"),
    [changeOrders],
  );
  const pendingChangeOrders = useMemo(
    () => changeOrders.filter((co) => co.status === "pending"),
    [changeOrders],
  );
  const rejectedChangeOrders = useMemo(
    () => changeOrders.filter((co) => co.status === "rejected"),
    [changeOrders],
  );

  if (loading) {
    return (
      <>
        <ProjectPageHeader
          title="Prime Contract"
          description="Loading contract details..."
        />
        <TableLayout>
          <Skeleton className="h-96" />
        </TableLayout>
      </>
    );
  }

  if (error || !contract) {
    return (
      <>
        <ProjectPageHeader
          title="Prime Contract"
          description="Unable to load contract"
          breadcrumbs={[
            { label: "Prime Contracts", href: `/${projectId}/prime-contracts` },
            { label: "Contract Details" },
          ]}
        />
        <TableLayout>
          <Card className="p-[var(--card-padding)]">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error || "Contract not found"}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleBack}
              className="mt-[var(--group-gap)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Card>
        </TableLayout>
      </>
    );
  }

  return (
    <>
      <ProjectPageHeader
        title={contract.title}
        description={contract.vendor?.name || "No vendor assigned"}
        breadcrumbs={[
          { label: "Prime Contracts", href: `/${projectId}/prime-contracts` },
          { label: `Contract #${contract.contract_number || contract.id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/form-change-event?projectId=${projectId}&contractId=${contractId}`,
                    )
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Change Event
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/form-change-order?projectId=${projectId}&contractId=${contractId}`,
                    )
                  }
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Change Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/form-purchase-order?projectId=${projectId}&contractId=${contractId}`,
                    )
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Purchase Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/form-subcontract?projectId=${projectId}&contractId=${contractId}`,
                    )
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Subcontract
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="default" size="sm" onClick={handleEdit}>
              Edit Contract
            </Button>
          </div>
        }
      />

      <TableLayout>
        <Tabs defaultValue="overview">
          <TabsList className="mb-[var(--card-gap)]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments Received</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="history">Change History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-[var(--card-gap)]">
            <div className="grid gap-[var(--card-gap)] lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>General Info</CardTitle>
                    <CardDescription>Prime contract details</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setGeneralInfoOpen((prev) => !prev)}
                  >
                    {generalInfoOpen ? "Hide" : "Show"}
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${generalInfoOpen ? "rotate-90" : "rotate-0"}`}
                    />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Collapsible open={generalInfoOpen}>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-[var(--group-gap)]">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Contract Number</p>
                          <p className="font-medium">
                            {contract.contract_number || "Unnumbered"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge variant={getStatusBadgeVariant(contract.status)}>
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Vendor</p>
                          <p className="font-medium">
                            {contract.vendor?.name || "--"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Description</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.description || "No description provided"}
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Summary</CardTitle>
                  <CardDescription>Financial overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <Collapsible open={contractSummaryOpen}>
                    <CollapsibleTrigger className="sr-only">
                      Toggle contract summary
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-[var(--group-gap)]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Original Amount
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(contract.original_contract_value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Revised Amount
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(contract.revised_contract_value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Retention</span>
                          <span className="font-semibold">
                            {contract.retention_percentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Payment Terms
                          </span>
                          <span className="font-semibold">
                            {contract.payment_terms || "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Billing Schedule
                          </span>
                          <span className="font-semibold">
                            {contract.billing_schedule || "Not set"}
                          </span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-[var(--card-gap)] lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Line Items</CardTitle>
                      <CardDescription>
                        {lineItems.length} line item
                        {lineItems.length === 1 ? "" : "s"} on this contract
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {lineItemsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading line items...
                    </div>
                  ) : lineItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-[var(--group-gap)] opacity-50" />
                      <p>No line items yet</p>
                      <p className="text-xs mt-2">
                        Add line items to track Schedule of Values
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Line #</TableHead>
                          <TableHead>Cost Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.line_number}</TableCell>
                            <TableCell>
                              {item.cost_code?.code
                                ? `${item.cost_code.code} ${item.cost_code.name}`
                                : "--"}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_cost)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total_cost)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-[var(--group-gap)]">
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">{formatDate(contract.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-sm">
                        {contract.start_date ? formatDate(contract.start_date) : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="text-sm">
                        {contract.end_date ? formatDate(contract.end_date) : "--"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="change-orders" className="mt-0 p-[var(--card-padding)]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Change Orders</CardTitle>
                    <CardDescription>
                      {changeOrdersCount} change order
                      {changeOrdersCount === 1 ? "" : "s"} • {approvedChangeOrders.length} approved •
                      {" "}
                      {pendingChangeOrders.length} pending • {rejectedChangeOrders.length} rejected
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Change Order
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {changeOrdersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading change orders...</p>
                  </div>
                ) : changeOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-[var(--group-gap)] opacity-50" />
                    <p>No change orders yet</p>
                    <p className="text-xs mt-2">
                      Create a change order to track contract modifications
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CO Number</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Approved/Rejected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changeOrders.map((co) => (
                        <TableRow key={co.id}>
                          <TableCell className="font-medium">
                            {co.change_order_number}
                          </TableCell>
                          <TableCell>{co.description}</TableCell>
                          <TableCell className="text-right">
                            <span className={co.amount < 0 ? "text-red-600" : ""}>
                              {formatCurrency(co.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                co.status === "approved"
                                  ? "default"
                                  : co.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {co.status.charAt(0).toUpperCase() + co.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(co.requested_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {co.approved_date
                              ? new Date(co.approved_date).toLocaleDateString()
                              : "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <TableRow className="bg-muted font-medium">
                        <TableCell colSpan={2}>Total Change Orders</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            changeOrders.reduce((sum, co) => sum + co.amount, 0),
                          )}
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    </tfoot>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0 p-[var(--card-padding)]">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Invoices for this contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-[var(--group-gap)] opacity-50" />
                  <p>Invoices will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-0 p-[var(--card-padding)]">
            <Card>
              <CardHeader>
                <CardTitle>Payments Received</CardTitle>
                <CardDescription>Payment history for this contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-[var(--group-gap)] opacity-50" />
                  <p>Payment history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="mt-0 p-[var(--card-padding)]">
            <Card>
              <CardHeader>
                <CardTitle>Emails</CardTitle>
                <CardDescription>Email correspondence related to this contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-[var(--group-gap)] opacity-50" />
                  <p>Email history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0 p-[var(--card-padding)]">
            <Card>
              <CardHeader>
                <CardTitle>Change History</CardTitle>
                <CardDescription>Track all changes made to this contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-[var(--group-gap)] opacity-50" />
                  <p>Change history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </TableLayout>
    </>
  );
}
