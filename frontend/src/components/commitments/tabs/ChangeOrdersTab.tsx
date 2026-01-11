'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/tables/DataTable'
import { Text } from '@/components/ui/text'
import { formatCurrency } from '@/config/tables'
import { formatDate } from '@/lib/table-config/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/misc/status-badge'
import Link from 'next/link'

interface ChangeOrder {
  id: string
  number: string
  title: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  amount: number
  created_at: string
  description?: string
}

interface ChangeOrdersTabProps {
  commitmentId: string
  projectId: number
}

export function ChangeOrdersTab({ commitmentId, projectId }: ChangeOrdersTabProps) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChangeOrders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/commitments/${commitmentId}/change-orders`)

        if (!response.ok) {
          if (response.status === 404) {
            // No change orders found - this is not an error
            setChangeOrders([])
            return
          }
          throw new Error('Failed to fetch change orders')
        }

        const data = await response.json()
        setChangeOrders(data.data || data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load change orders')
        toast.error('Failed to load change orders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChangeOrders()
  }, [commitmentId])

  const columns: ColumnDef<ChangeOrder>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/${projectId}/change-orders/${row.original.id}`}
          className="text-primary hover:underline flex items-center gap-1"
        >
          {row.original.number}
          <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <Text>{row.original.title}</Text>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} type="change-order" />
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Text>{formatCurrency(row.original.amount)}</Text>,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Created Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Text>{formatDate(row.original.created_at)}</Text>,
    },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Text tone="destructive">{error}</Text>
        </CardContent>
      </Card>
    )
  }

  if (changeOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Text tone="muted" size="sm">
              No change orders for this commitment
            </Text>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={changeOrders}
          showToolbar={false}
          showPagination={changeOrders.length > 10}
        />
      </CardContent>
    </Card>
  )
}
