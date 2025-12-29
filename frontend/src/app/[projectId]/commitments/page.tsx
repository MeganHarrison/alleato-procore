'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { Plus, ChevronDown, Eye, Edit, Trash2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/financial/shared/status-badge'
import { DataTablePage } from '@/components/templates'
import { useFinancialStore } from '@/lib/stores/financial-store'
import { useProjectTitle } from '@/hooks/useProjectTitle'
import type { Commitment } from '@/types/financial'
import {
  getCommitmentsSummaryCards,
  getCommitmentsTabs,
  commitmentsFilterOptions,
  commitmentsMobileColumns,
  getCommitmentsStatusCounts,
  formatCurrency,
} from '@/config/tables'

/**
 * Project Commitments Page
 *
 * Displays and manages commitments (subcontracts and purchase orders) for a project.
 * Uses the standardized DataTablePage template for consistent styling.
 */
export default function ProjectCommitmentsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = parseInt(params.projectId as string)
  useProjectTitle('Commitments')

  const {
    commitments,
    setCommitments,
    isLoading,
    errors,
    setLoading,
    setError,
  } = useFinancialStore()

  // Fetch commitments on mount
  useEffect(() => {
    if (projectId) {
      fetchCommitments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchCommitments = useCallback(async () => {
    if (!projectId) return

    setLoading('commitments', true)
    setError('commitments', null)

    try {
      const response = await fetch(`/api/commitments?projectId=${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch commitments')
      }

      const data = await response.json()
      setCommitments(data.data || [])
    } catch (error) {
      setError(
        'commitments',
        error instanceof Error ? error.message : 'Failed to fetch commitments'
      )
    } finally {
      setLoading('commitments', false)
    }
  }, [projectId, setLoading, setError, setCommitments])

  // Navigation handlers
  const handleCreateSubcontract = useCallback(() => {
    router.push(`/form-commitments?projectId=${projectId}&type=subcontract`)
  }, [router, projectId])

  const handleCreatePurchaseOrder = useCallback(() => {
    router.push(`/form-commitments?projectId=${projectId}&type=purchase_order`)
  }, [router, projectId])

  const handleView = useCallback(
    (commitment: Commitment) => {
      router.push(`/form-commitments/${commitment.id}?projectId=${projectId}`)
    },
    [router, projectId]
  )

  const handleEdit = useCallback(
    (commitment: Commitment) => {
      router.push(`/form-commitments/${commitment.id}?projectId=${projectId}`)
    },
    [router, projectId]
  )

  const handleDelete = useCallback(
    async (commitment: Commitment) => {
      if (!confirm(`Are you sure you want to delete commitment ${commitment.number}?`)) {
        return
      }

      try {
        const response = await fetch(`/api/commitments/${commitment.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to delete commitment')
        }

        toast.success('Commitment deleted successfully')
        fetchCommitments()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete commitment'
        )
      }
    },
    [fetchCommitments]
  )

  // Column definitions with action handlers
  const columns: ColumnDef<Commitment>[] = useMemo(
    () => [
      {
        accessorKey: 'number',
        header: 'Number',
        cell: ({ row }) => (
          <div
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              handleView(row.original)
            }}
          >
            {row.getValue('number')}
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'contract_company_name',
        header: 'Company',
        cell: ({ row }) => {
          const company = row.original.contract_company
          return company?.name || (row.getValue('contract_company_name') as string) || '—'
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('status')} type="commitment" />
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string | undefined
          return <span className="capitalize">{type?.replace(/_/g, ' ') || '—'}</span>
        },
      },
      {
        accessorKey: 'original_amount',
        header: 'Original Amount',
        cell: ({ row }) => formatCurrency(row.getValue('original_amount') || 0),
      },
      {
        accessorKey: 'revised_contract_amount',
        header: 'Revised Amount',
        cell: ({ row }) => formatCurrency(row.getValue('revised_contract_amount') || 0),
      },
      {
        accessorKey: 'balance_to_finish',
        header: 'Balance to Finish',
        cell: ({ row }) => formatCurrency(row.getValue('balance_to_finish') || 0),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const commitment = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleView(commitment)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(commitment)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(commitment)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleView, handleEdit, handleDelete]
  )

  // Generate configuration from data
  const summaryCards = useMemo(
    () => getCommitmentsSummaryCards(commitments),
    [commitments]
  )

  const tabs = useMemo(
    () => getCommitmentsTabs(projectId, commitments.length),
    [projectId, commitments.length]
  )

  const statusCounts = useMemo(
    () => getCommitmentsStatusCounts(commitments),
    [commitments]
  )

  // Mobile card renderer
  const mobileCardRenderer = useCallback(
    (commitment: Commitment) => (
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-blue-600">{commitment.number}</div>
            <div className="text-sm text-muted-foreground">{commitment.title}</div>
            {commitment.contract_company && (
              <div className="text-sm text-muted-foreground">
                {commitment.contract_company.name}
              </div>
            )}
          </div>
          <StatusBadge status={commitment.status} type="commitment" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">Revised Amount</span>
          <span className="font-medium">
            {formatCurrency(commitment.revised_contract_amount || 0)}
          </span>
        </div>
      </div>
    ),
    []
  )

  // Status overview section (rendered before the table)
  const statusOverview = (
    <div className="mb-6">
      <h2 className="font-semibold mb-4">Status Overview</h2>
      <div className="flex flex-wrap gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2">
            <StatusBadge status={status} type="commitment" />
            <span className="text-sm text-muted-foreground">({count})</span>
          </div>
        ))}
      </div>
    </div>
  )

  // Create action button
  const createButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCreateSubcontract}>
          <Plus className="h-4 w-4 mr-2" />
          Subcontract
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCreatePurchaseOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Purchase Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <DataTablePage<Commitment>
      title="Commitments"
      description="Manage purchase orders and subcontracts"
      summaryCards={summaryCards}
      tabs={tabs}
      actions={createButton}
      columns={columns}
      data={commitments}
      loading={isLoading.commitments}
      error={errors.commitments}
      onRetry={fetchCommitments}
      emptyMessage="No commitments found"
      emptyAction={
        <Button onClick={handleCreateSubcontract}>
          <Plus className="h-4 w-4 mr-2" />
          Create your first commitment
        </Button>
      }
      onRowClick={handleView}
      searchKey="title"
      searchPlaceholder="Search commitments..."
      filterOptions={commitmentsFilterOptions}
      mobileColumns={commitmentsMobileColumns}
      mobileCardRenderer={mobileCardRenderer}
      showExportButton={true}
      onExportCSV={() => toast.info('CSV export coming soon')}
      onExportPDF={() => toast.info('PDF export coming soon')}
      beforeTable={statusOverview}
    />
  )
}
