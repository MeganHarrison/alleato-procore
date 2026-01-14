"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stack } from "@/components/ui/stack";
import { Inline } from "@/components/ui/inline";
import { Text } from "@/components/ui/text";
import { StatusBadge } from "@/components/misc/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import type { Commitment } from "@/types/financial";
import { formatCurrency } from "@/config/tables";
import { formatDate } from "@/lib/table-config/formatters";

/**
 * Commitment Detail Page
 *
 * Displays detailed information about a specific commitment (subcontract or purchase order)
 */
export default function CommitmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string);
  const commitmentId = params.commitmentId as string;

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useProjectTitle(
    commitment ? `${commitment.number} - ${commitment.title}` : "Loading...",
  );

  // Fetch commitment data
  const fetchCommitment = useCallback(async () => {
    if (!commitmentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/commitments/${commitmentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Commitment not found");
        }
        throw new Error("Failed to fetch commitment details");
      }

      const data = await response.json();
      setCommitment(data.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch commitment",
      );
    } finally {
      setIsLoading(false);
    }
  }, [commitmentId]);

  useEffect(() => {
    fetchCommitment();
  }, [fetchCommitment]);

  // Action handlers
  const handleBack = useCallback(() => {
    router.push(`/${projectId}/commitments`);
  }, [router, projectId]);

  const handleEdit = useCallback(() => {
    router.push(`/${projectId}/commitments/${commitmentId}/edit`);
  }, [router, projectId, commitmentId]);

  const handleDelete = useCallback(async () => {
    if (
      !commitment ||
      !confirm(
        `Are you sure you want to delete commitment ${commitment.number}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/commitments/${commitmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete commitment");
      }

      toast.success("Commitment deleted successfully");
      router.push(`/${projectId}/commitments`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete commitment",
      );
    }
  }, [commitment, commitmentId, projectId, router]);

  const handleExport = useCallback(() => {
    toast.info("Export functionality coming soon");
  }, []);

  if (isLoading) {
    return (
      <Stack>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </Stack>
    );
  }

  if (error || !commitment) {
    return (
      <Stack>
        <div className="flex items-center justify-between mb-4">
          <Text size="xl" weight="bold">
            Error
          </Text>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commitments
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Text tone="destructive">{error || "Commitment not found"}</Text>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Text size="xl" weight="bold">
            {commitment.number}
          </Text>
          <StatusBadge status={commitment.status} type="commitment" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Title
                  </Text>
                  <Text>{commitment.title}</Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Status
                  </Text>
                  <Text transform="capitalize">
                    {commitment.status?.replace(/_/g, " ") || "—"}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Company
                  </Text>
                  <Text>{commitment.contract_company?.name || "—"}</Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Accounting Method
                  </Text>
                  <Text transform="capitalize">
                    {commitment.accounting_method?.replace(/_/g, " ") || "—"}
                  </Text>
                </Stack>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Text>{commitment.description || "No description provided"}</Text>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Original Amount
                  </Text>
                  <Text size="lg" weight="medium">
                    {formatCurrency(commitment.original_amount || 0)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Approved Change Orders
                  </Text>
                  <Text size="lg" weight="medium">
                    {formatCurrency(commitment.approved_change_orders || 0)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Revised Amount
                  </Text>
                  <Text size="lg" weight="medium">
                    {formatCurrency(commitment.revised_contract_amount || 0)}
                  </Text>
                </Stack>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Billed to Date
                  </Text>
                  <Text size="lg" weight="medium">
                    {formatCurrency(commitment.billed_to_date || 0)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Retention %
                  </Text>
                  <Text size="lg" weight="medium">
                    {commitment.retention_percentage
                      ? `${commitment.retention_percentage}%`
                      : "—"}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Balance to Finish
                  </Text>
                  <Text size="lg" weight="medium">
                    {formatCurrency(commitment.balance_to_finish || 0)}
                  </Text>
                </Stack>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Private
                  </Text>
                  <Text>{commitment.private ? "Yes" : "No"}</Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Vendor Invoice Number
                  </Text>
                  <Text>{commitment.vendor_invoice_number || "—"}</Text>
                </Stack>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Start Date
                  </Text>
                  <Text>
                    {commitment.start_date
                      ? formatDate(commitment.start_date)
                      : "—"}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Substantial Completion Date
                  </Text>
                  <Text>
                    {commitment.substantial_completion_date
                      ? formatDate(commitment.substantial_completion_date)
                      : "—"}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Executed Date
                  </Text>
                  <Text>
                    {commitment.executed_date
                      ? formatDate(commitment.executed_date)
                      : "—"}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Signed Received Date
                  </Text>
                  <Text>
                    {commitment.signed_received_date
                      ? formatDate(commitment.signed_received_date)
                      : "—"}
                  </Text>
                </Stack>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Created
                  </Text>
                  <Text>
                    {commitment.created_at
                      ? formatDate(commitment.created_at)
                      : "—"}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Last Updated
                  </Text>
                  <Text>
                    {commitment.updated_at
                      ? formatDate(commitment.updated_at)
                      : "—"}
                  </Text>
                </Stack>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
