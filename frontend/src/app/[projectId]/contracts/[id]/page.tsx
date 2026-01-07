'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  AlertCircle,
  Download,
  Mail,
  History,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectPageHeader, PageContainer } from '@/components/layout';
import { useProjectTitle } from '@/hooks/useProjectTitle';
import type { ContractLineItemWithCostCode } from '@/types/contract-line-items';
import type { ContractChangeOrder } from '@/types/contract-change-orders';

interface Contract {
  id: string;
  contract_number: string | null;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
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
  vendor?: {
    id: string;
    name: string;
  } | null;
}

export default function ProjectContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string, 10);
  const contractId = params.id as string;
  useProjectTitle('Prime Contract');

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalInfoOpen, setGeneralInfoOpen] = useState(true);
  const [contractSummaryOpen, setContractSummaryOpen] = useState(true);

  // Line items state
  const [lineItems, setLineItems] = useState<ContractLineItemWithCostCode[]>([]);
  const [lineItemsLoading, setLineItemsLoading] = useState(false);

  // Change orders state
  const [changeOrders, setChangeOrders] = useState<ContractChangeOrder[]>([]);
  const [changeOrdersLoading, setChangeOrdersLoading] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/contracts/${contractId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Contract not found');
          } else {
            setError('Failed to load contract');
          }
          return;
        }

        const data = await response.json();
        setContract(data);
      } catch (err) {
        console.error('Error fetching contract:', err);
        setError('Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    if (contractId && projectId) {
      fetchContract();
    }
  }, [contractId, projectId]);

  // Fetch line items when contract is loaded
  useEffect(() => {
    const fetchLineItems = async () => {
      if (!contract) return;

      try {
        setLineItemsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/contracts/${contractId}/line-items`);

        if (!response.ok) {
          console.error('Failed to fetch line items');
          return;
        }

        const data = await response.json();
        setLineItems(data || []);
      } catch (err) {
        console.error('Error fetching line items:', err);
      } finally {
        setLineItemsLoading(false);
      }
    };

    fetchLineItems();
  }, [contract, projectId, contractId]);

  // Fetch change orders when contract is loaded
  useEffect(() => {
    const fetchChangeOrders = async () => {
      if (!contract) return;

      try {
        setChangeOrdersLoading(true);
        const response = await fetch(`/api/projects/${projectId}/contracts/${contractId}/change-orders`);

        if (!response.ok) {
          console.error('Failed to fetch change orders');
          return;
        }

        const data = await response.json();
        setChangeOrders(data || []);
      } catch (err) {
        console.error('Error fetching change orders:', err);
      } finally {
        setChangeOrdersLoading(false);
      }
    };

    fetchChangeOrders();
  }, [contract, projectId, contractId]);

  const handleBack = () => {
    router.push(`/${projectId}/contracts`);
  };

  const handleEdit = () => {
    router.push(`/${projectId}/contracts/${contractId}/edit`);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  };

  const getStatusBadgeVariant = (status: Contract['status']): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'on_hold':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <>
        <ProjectPageHeader
          title="Prime Contract"
          description="Loading contract details..."
        />
        <PageContainer>
          <Skeleton className="h-96" />
        </PageContainer>
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
            { label: 'Prime Contracts', href: `/${projectId}/contracts` },
            { label: 'Contract Details' }
          ]}
        />
        <PageContainer>
          <Card className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'Contract not found'}</p>
            </div>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Card>
        </PageContainer>
      </>
    );
  }

  const changeOrdersCount = changeOrders.length;
  const invoicesCount = 0; // TODO: Get from API
  const paymentsCount = 0; // TODO: Get from API

  const approvedChangeOrders = changeOrders.filter(co => co.status === 'approved');
  const pendingChangeOrders = changeOrders.filter(co => co.status === 'pending');
  const rejectedChangeOrders = changeOrders.filter(co => co.status === 'rejected');

  return (
    <>
      <ProjectPageHeader
        title={contract.title}
        description={contract.vendor?.name || 'No vendor assigned'}
        breadcrumbs={[
          { label: 'Prime Contracts', href: `/${projectId}/contracts` },
          { label: `Contract #${contract.contract_number || contract.id}` }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create</span>
                  <ChevronDown className="h-4 w-4 ml-1 sm:ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/form-change-event?projectId=${projectId}&contractId=${contractId}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Change Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/form-change-order?projectId=${projectId}&contractId=${contractId}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Prime Contract CO
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/form-invoice?projectId=${projectId}&contractId=${contractId}`)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/form-payment?projectId=${projectId}&contractId=${contractId}`)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm">
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              •••
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <div className="border-b bg-card px-6 overflow-x-auto">
          <TabsList className="h-auto p-0 bg-transparent border-0 flex-nowrap">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="change-orders"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Change Orders ({changeOrdersCount})
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Invoices ({invoicesCount})
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Payments Received ({paymentsCount})
            </TabsTrigger>
            <TabsTrigger
              value="emails"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Emails
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Change History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* General Tab */}
        <TabsContent value="general" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[calc(100vh-280px)]">
            {/* Sidebar Navigation - Hidden on mobile */}
            <div className="hidden md:block border-r bg-muted/30 p-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm mb-3 text-foreground">General Information</h3>
                <a
                  href="#contract-summary"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Contract Summary
                </a>
                <a
                  href="#schedule-of-values"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Schedule of Values
                </a>
                <a
                  href="#inclusions-exclusions"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Inclusions & Exclusions
                </a>
                <a
                  href="#contract-dates"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Contract Dates
                </a>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6 bg-background">
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="default" size="sm" onClick={handleEdit}>
                  Edit Contract
                </Button>
              </div>

              {/* General Information Section */}
              <Collapsible open={generalInfoOpen} onOpenChange={setGeneralInfoOpen}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {generalInfoOpen ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          General Information
                        </CardTitle>
                      </CollapsibleTrigger>
                      <Button variant="ghost" size="sm" onClick={handleEdit}>
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-6">
                        Created by {contract.created_by || 'Unknown'} on {formatDate(contract.created_at)}
                      </p>

                      <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Contract #</h4>
                          <p className="text-sm">{contract.contract_number || contract.id}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Vendor</h4>
                          <p className="text-sm text-primary">
                            {contract.vendor?.name || '--'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Title</h4>
                          <p className="text-sm">{contract.title}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                          <Badge variant={getStatusBadgeVariant(contract.status)} className="text-xs">
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Start Date</h4>
                          <p className="text-sm">{contract.start_date ? formatDate(contract.start_date) : '--'}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">End Date</h4>
                          <p className="text-sm">{contract.end_date ? formatDate(contract.end_date) : '--'}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Retention Percentage</h4>
                          <p className="text-sm">{contract.retention_percentage ? `${contract.retention_percentage}%` : '0%'}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Terms</h4>
                          <p className="text-sm">{contract.payment_terms || '--'}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Billing Schedule</h4>
                          <p className="text-sm">{contract.billing_schedule || '--'}</p>
                        </div>

                        <div className="col-span-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                          <p className="text-sm">{contract.description || '--'}</p>
                        </div>

                        <div className="col-span-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Attachments</h4>
                          <p className="text-sm">--</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Contract Summary Section */}
              <Collapsible open={contractSummaryOpen} onOpenChange={setContractSummaryOpen} id="contract-summary">
                <Card>
                  <CardHeader>
                    <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity w-full">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {contractSummaryOpen ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        Contract Summary
                      </CardTitle>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-4 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Original Contract Value</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.original_contract_value)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Revised Contract Value</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.revised_contract_value)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Change Orders</h4>
                          <p className="text-lg font-semibold">{changeOrdersCount}</p>
                          <p className="text-xs text-muted-foreground">See Change Orders tab</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Invoices</h4>
                          <p className="text-lg font-semibold">{invoicesCount}</p>
                          <p className="text-xs text-muted-foreground">See Invoices tab</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Schedule of Values (Line Items) */}
              <Card id="schedule-of-values">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Schedule of Values</CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </Button>
                  </div>
                  <CardDescription>
                    {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} • Total: {formatCurrency(lineItems.reduce((sum, item) => sum + item.total_cost, 0))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lineItemsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Loading line items...</p>
                    </div>
                  ) : lineItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No line items yet</p>
                      <p className="text-xs mt-2">Add line items to create a schedule of values</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Cost Code</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.line_number}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              {item.cost_code ? (
                                <span className="text-xs">
                                  {item.cost_code.code} - {item.cost_code.name}
                                </span>
                              ) : (
                                '--'
                              )}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                            <TableCell>{item.unit_of_measure || '--'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.total_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <tfoot>
                        <TableRow className="bg-gray-50 font-medium">
                          <TableCell colSpan={6}>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(lineItems.reduce((sum, item) => sum + item.total_cost, 0))}
                          </TableCell>
                        </TableRow>
                      </tfoot>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card id="inclusions-exclusions">
                <CardHeader>
                  <CardTitle className="text-lg">Inclusions & Exclusions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Inclusions and exclusions will be displayed here</p>
                </CardContent>
              </Card>

              <Card id="contract-dates">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Created</h4>
                      <p className="text-sm">{formatDate(contract.created_at)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Start Date</h4>
                      <p className="text-sm">{contract.start_date ? formatDate(contract.start_date) : '--'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">End Date</h4>
                      <p className="text-sm">{contract.end_date ? formatDate(contract.end_date) : '--'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Change Orders Tab */}
        <TabsContent value="change-orders" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Change Orders</CardTitle>
                  <CardDescription>
                    {changeOrdersCount} change order{changeOrdersCount !== 1 ? 's' : ''} •
                    {approvedChangeOrders.length} approved •
                    {pendingChangeOrders.length} pending •
                    {rejectedChangeOrders.length} rejected
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
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No change orders yet</p>
                  <p className="text-xs mt-2">Create a change order to track contract modifications</p>
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
                        <TableCell className="font-medium">{co.change_order_number}</TableCell>
                        <TableCell>{co.description}</TableCell>
                        <TableCell className="text-right">
                          <span className={co.amount < 0 ? 'text-red-600' : ''}>
                            {formatCurrency(co.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              co.status === 'approved' ? 'default' :
                              co.status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {co.status.charAt(0).toUpperCase() + co.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(co.requested_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {co.approved_date ? new Date(co.approved_date).toLocaleDateString() : '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="bg-gray-50 font-medium">
                      <TableCell colSpan={2}>Total Change Orders</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(changeOrders.reduce((sum, co) => sum + co.amount, 0))}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>{invoicesCount} invoices for this contract</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Invoices will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Received Tab */}
        <TabsContent value="payments" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Payments Received</CardTitle>
              <CardDescription>{paymentsCount} payments received</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Payment history will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Emails</CardTitle>
              <CardDescription>Email correspondence related to this contract</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Email history will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change History Tab */}
        <TabsContent value="history" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>Track all changes made to this contract</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Change history will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
