'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  History,
  Settings,
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

interface Contract {
  id: number;
  contract_number: string | null;
  title: string;
  status: string | null;
  executed: boolean | null;
  original_contract_amount: number | null;
  revised_contract_amount: number | null;
  approved_change_orders: number | null;
  pending_change_orders: number | null;
  draft_change_orders: number | null;
  invoiced_amount: number | null;
  payments_received: number | null;
  remaining_balance: number | null;
  retention_percentage: number | null;
  percent_paid: number | null;
  notes: string | null;
  private: boolean | null;
  apply_vertical_markup: boolean | null;
  attachment_count: number | null;
  erp_status: string | null;
  created_at: string;
  created_by: string | null;
  client_id: number;
  project_id: number;
  client?: {
    id: number;
    name: string;
  };
  project?: {
    id: number;
    name: string;
    project_number: string | null;
  };
}

export default function ProjectContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string, 10);
  const contractId = parseInt(params.id as string, 10);

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalInfoOpen, setGeneralInfoOpen] = useState(true);
  const [contractSummaryOpen, setContractSummaryOpen] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contracts/${contractId}`);

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

    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const handleBack = () => {
    router.push(`/${projectId}/contracts`);
  };

  const handleEdit = () => {
    router.push(`/form-contract/${contractId}?projectId=${projectId}`);
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

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
      case 'pending_approval':
        return 'warning';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-6 py-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-6 py-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Prime Contracts
          </Button>
        </div>
        <div className="p-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'Contract not found'}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const changeOrdersCount = (contract.approved_change_orders || 0) +
    (contract.pending_change_orders || 0) +
    (contract.draft_change_orders || 0);

  const invoicesCount = 6; // TODO: Get from API
  const paymentsCount = 5; // TODO: Get from API

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Header */}
      <div className="border-b bg-card px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleBack}
            className="hover:text-foreground transition-colors"
          >
            Prime Contracts
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Prime Contract #{contract.contract_number || contract.id}</span>
        </div>
      </div>

      {/* Title Bar */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              {contract.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contract.client?.name || 'No client assigned'}
            </p>
          </div>
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
        </div>
      </div>

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
            <TabsTrigger
              value="financial-markup"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Financial Markup
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Advanced Settings
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
                <a
                  href="#contract-privacy"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Contract Privacy
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
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Owner/Client</h4>
                          <p className="text-sm text-primary">
                            {contract.client?.name || '--'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Title</h4>
                          <p className="text-sm">{contract.title}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                          <Badge variant={getStatusBadgeVariant(contract.status)} className="text-xs">
                            {contract.status || 'Draft'}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Executed</h4>
                          <div className="flex items-center gap-2">
                            {contract.executed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : null}
                            <span className="text-sm">{contract.executed ? '✓' : '--'}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Default Retainage</h4>
                          <p className="text-sm">{contract.retention_percentage ? `${contract.retention_percentage}%` : '0%'}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Contractor</h4>
                          <p className="text-sm text-primary">
                            {contract.project?.name || 'Alleato Group'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Architect/Engineer</h4>
                          <p className="text-sm">--</p>
                        </div>

                        <div className="col-span-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                          <p className="text-sm">{contract.notes || '--'}</p>
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
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Original Contract Amount</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.original_contract_amount)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Pending Change Orders</h4>
                          <p className="text-lg font-semibold">{formatCurrency(0)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Invoices</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.invoiced_amount)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Payments Received</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.payments_received)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved Change Orders</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.approved_change_orders || 0)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Pending Revised Contract Amount</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.revised_contract_amount || contract.original_contract_amount)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Remaining Balance</h4>
                          <p className="text-lg font-semibold">{formatCurrency(contract.remaining_balance)}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Percent Paid</h4>
                          <p className="text-lg font-semibold">{contract.percent_paid?.toFixed(1) || '0'}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Placeholder sections */}
              <Card id="schedule-of-values">
                <CardHeader>
                  <CardTitle className="text-lg">Schedule of Values</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Schedule of Values will be displayed here</p>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Created</h4>
                      <p className="text-sm">{formatDate(contract.created_at)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Executed Date</h4>
                      <p className="text-sm">--</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="contract-privacy">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Privacy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Private</h4>
                    <p className="text-sm">{contract.private ? 'Yes' : 'No'}</p>
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
              <CardTitle>Change Orders</CardTitle>
              <CardDescription>
                {changeOrdersCount} change orders associated with this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-600">Approved</p>
                  </div>
                  <p className="text-2xl font-bold">{contract.approved_change_orders || 0}</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-600">Pending</p>
                  </div>
                  <p className="text-2xl font-bold">{contract.pending_change_orders || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                  </div>
                  <p className="text-2xl font-bold">{contract.draft_change_orders || 0}</p>
                </div>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Change orders list will be displayed here</p>
              </div>
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

        {/* Financial Markup Tab */}
        <TabsContent value="financial-markup" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Markup</CardTitle>
              <CardDescription>Configure markup rates and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Apply Vertical Markup</h4>
                  <p className="text-sm">{contract.apply_vertical_markup ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Financial markup configuration will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="settings" className="mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contract.erp_status && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">ERP Status</h4>
                    <Badge variant="outline">{contract.erp_status}</Badge>
                  </div>
                )}
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced settings will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
