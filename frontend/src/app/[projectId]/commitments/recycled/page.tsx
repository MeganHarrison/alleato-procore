'use client'

import { useEffect, useMemo, useCallback, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTablePage } from '@/components/templates'
import { Stack } from '@/components/ui/stack'
import { Text } from '@/components/ui/text'
import { MobileCard } from '@/components/ui/mobile-card'
import { useProjectTitle } from '@/hooks/useProjectTitle'
import type { Commitment } from '@/types/financial'
import { formatCurrency } from '@/config/tables'

/**
 * Recycle Bin Page for Soft-Deleted Commitments
 *
 * Shows deleted commitments and allows restore or permanent deletion.
 */
export default function RecycledCommitmentsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = parseInt(params.projectId as string)

  useProjectTitle('Recycle Bin - Commitments')

  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<{
    open: boolean
    commitment: Commitment | null
  }>({
    open: false,
    commitment: null,
  })

  // Fetch deleted commitments on mount
  useEffect(() => {
    if (projectId) {
      fetchDeletedCommitments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchDeletedCommitments = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/commitments?projectId=${projectId}&include_deleted=true`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch deleted commitments')
      }

      const data = await response.json()

      // Filter to only show deleted commitments
      // Note: The API should support filtering by deleted_at IS NOT NULL
      // For now, we fetch all with include_deleted=true and filter client-side
      const deletedCommitments = (data.data || []).filter(
        (c: Commitment) => c.deleted_at
      )

      setCommitments(deletedCommitments)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch deleted commitments'
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Restore commitment handler
  const handleRestore = useCallback(
    async (commitment: Commitment) => {
      try {
        const response = await fetch(`/api/commitments/${commitment.id}/restore`, {
          method: 'POST',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to restore commitment')
        }

        toast.success(`Commitment ${commitment.number} restored successfully`)
        fetchDeletedCommitments()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to restore commitment'
        )
      }
    },
    [fetchDeletedCommitments]
  )

  // Permanent delete handler
  const handlePermanentDelete = useCallback(
    async (commitment: Commitment) => {
      setPermanentDeleteDialog({ open: true, commitment })
    },
    []
  )

  const confirmPermanentDelete = useCallback(async () => {
    const { commitment } = permanentDeleteDialog
    if (!commitment) return

    try {
      const response = await fetch(
        `/api/commitments/${commitment.id}/permanent-delete`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to permanently delete commitment')
      }

      toast.success(`Commitment ${commitment.number} permanently deleted`)
      setPermanentDeleteDialog({ open: false, commitment: null })
      fetchDeletedCommitments()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to permanently delete commitment'
      )
    }
  }, [permanentDeleteDialog, fetchDeletedCommitments])

  // Column definitions
  const columns: ColumnDef<Commitment>[] = useMemo(
    () => [
      {
        accessorKey: 'number',
        header: 'Number',
        cell: ({ row }) => (
          <Text weight="medium">{row.getValue('number')}</Text>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string | undefined
          return <Text transform="capitalize">{type?.replace(/_/g, ' ') || '—'}</Text>
        },
      },
      {
        accessorKey: 'contract_company_name',
        header: 'Contract Company',
        cell: ({ row }) => {
          const company = row.original.contract_company
          return company?.name || (row.getValue('contract_company_name') as string) || '—'
        },
      },
      {
        accessorKey: 'original_amount',
        header: 'Original Amount',
        cell: ({ row }) => formatCurrency(row.getValue('original_amount') || 0),
      },
      {
        accessorKey: 'deleted_at',
        header: 'Deleted Date',
        cell: ({ row }) => {
          const deletedAt = row.getValue('deleted_at') as string | undefined
          if (!deletedAt) return '—'
          return new Date(deletedAt).toLocaleDateString()
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const commitment = row.original
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRestore(commitment)
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePermanentDelete(commitment)
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Forever
              </Button>
            </div>
          )
        },
      },
    ],
    [handleRestore, handlePermanentDelete]
  )

  // Mobile card renderer
  const mobileCardRenderer = useCallback(
    (commitment: Commitment) => (
      <MobileCard>
        <MobileCard.Header>
          <Stack gap="xs">
            <Text weight="medium">{commitment.number}</Text>
            <Text size="sm" tone="muted">
              {commitment.title}
            </Text>
            {commitment.contract_company && (
              <Text size="sm" tone="muted">
                {commitment.contract_company.name}
              </Text>
            )}
            {commitment.deleted_at && (
              <Text size="sm" tone="muted">
                Deleted: {new Date(commitment.deleted_at).toLocaleDateString()}
              </Text>
            )}
          </Stack>
        </MobileCard.Header>
        <MobileCard.Footer>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestore(commitment)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handlePermanentDelete(commitment)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Forever
            </Button>
          </div>
        </MobileCard.Footer>
      </MobileCard>
    ),
    [handleRestore, handlePermanentDelete]
  )

  return (
    <>
      <DataTablePage<Commitment>
        title="Recycle Bin"
        description="Deleted commitments can be restored or permanently deleted"
        columns={columns}
        data={commitments}
        loading={isLoading}
        error={error}
        onRetry={fetchDeletedCommitments}
        emptyMessage="No deleted commitments found"
        searchKey="title"
        searchPlaceholder="Search deleted commitments..."
        mobileCardRenderer={mobileCardRenderer}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        open={permanentDeleteDialog.open}
        onOpenChange={(open) =>
          setPermanentDeleteDialog({ open, commitment: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Commitment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete commitment{' '}
              <span className="font-semibold">
                {permanentDeleteDialog.commitment?.number}
              </span>{' '}
              and remove all associated data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
