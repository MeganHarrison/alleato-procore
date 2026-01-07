'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useClients, type Client } from '@/hooks/use-clients';
import { ProjectPageHeader } from '@/components/layout/ProjectPageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageTabs } from '@/components/layout/PageTabs';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/tables/DataTable';
import { getDirectoryTabs } from '@/config/directory-tabs';

export default function DirectoryClientsPage() {
  const pathname = usePathname();
  const { clients, isLoading, error } = useClients({});

  const columns: ColumnDef<Client>[] = React.useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <Text as="div" weight="medium" className="text-primary">
            #{row.getValue('id')}
          </Text>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Client Name',
        cell: ({ row }) => (
          <Text as="div" weight="semibold">{row.getValue('name') || 'Unnamed Client'}</Text>
        ),
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => {
          const company = row.getValue('company') as Client['company'];
          return (
            <div>
              <Text as="div" weight="medium">{company?.name || 'N/A'}</Text>
              {company?.city && company?.state && (
                <Text as="div" size="sm" tone="muted">
                  {company.city}, {company.state}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge variant={status === 'active' ? 'active' : 'inactive'}>
              {status || 'Active'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => {
          const date = new Date(row.getValue('created_at'));
          return (
            <Text as="div" size="sm" tone="muted">
              {date.toLocaleDateString()}
            </Text>
          );
        },
      },
    ],
    []
  );

  const tabs = getDirectoryTabs(pathname);

  if (isLoading) {
    return (
      <>
        <ProjectPageHeader
          title="Directory"
          description="Manage companies, clients, contacts, users, and employees across your organization"
          showProjectName={false}
        />
        <PageTabs tabs={tabs} />
        <PageContainer>
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Text tone="muted">Loading clients...</Text>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ProjectPageHeader
          title="Directory"
          description="Manage companies, clients, contacts, users, and employees across your organization"
          showProjectName={false}
        />
        <PageTabs tabs={tabs} />
        <PageContainer>
          <div className="text-center py-12">
            <Text tone="destructive">Error loading clients: {error.message}</Text>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <ProjectPageHeader
        title="Directory"
        description="Manage companies, clients, contacts, users, and employees across your organization"
        showProjectName={false}
      />
      <PageTabs tabs={tabs} />
      <PageContainer>
          <DataTable
            columns={columns}
            data={clients}
            searchKey="name"
            searchPlaceholder="Search clients..."
          />
      </PageContainer>
    </>
  );
}
