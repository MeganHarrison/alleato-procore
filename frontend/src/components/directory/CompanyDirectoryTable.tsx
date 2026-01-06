"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ColumnManager, type ColumnConfig } from '@/components/directory/ColumnManager';
import { useDirectoryCompanies } from '@/hooks/useDirectoryCompanies';
import { cn } from '@/lib/utils';
import {
  Building2,
  MoreHorizontal,
  Search,
  UserPlus,
  UserX,
  Settings2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { DirectoryFilters, ProjectDirectoryCompany } from '@/types/directory';

interface CompanyDirectoryTableProps {
  projectId: string;
  status?: 'active' | 'inactive';
}

const companyColumns: ColumnConfig[] = [
  { id: 'select', label: '', visible: true, order: 0, width: '40px' },
  { id: 'company', label: 'Company', visible: true, order: 1 },
  { id: 'role', label: 'Role', visible: true, order: 2 },
  { id: 'type', label: 'Type', visible: true, order: 3 },
  { id: 'status', label: 'Status', visible: true, order: 4 },
  { id: 'location', label: 'Location', visible: true, order: 5 },
  { id: 'actions', label: '', visible: true, order: 6, width: '150px' }
];

export function CompanyDirectoryTable({ projectId, status = 'active' }: CompanyDirectoryTableProps) {
  const [filters, setFilters] = useState<DirectoryFilters>({
    status,
    search: '',
    sortBy: ['company.name:asc']
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [rowHeight, setRowHeight] = useState<'cozy' | 'compact'>('cozy');
  const [columns, setColumns] = useState(companyColumns);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const storageKey = `directory-companies-${projectId}-${status}`;
  const { toast } = useToast();

  const {
    data,
    loading,
    error,
    meta,
    filterOptions,
    permissions,
    refetch,
    updateFilters
  } = useDirectoryCompanies(projectId, filters);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          filters?: DirectoryFilters;
          columns?: ColumnConfig[];
          rowHeight?: 'cozy' | 'compact';
        };
        if (parsed.filters) {
          setFilters(prev => ({ ...prev, ...parsed.filters }));
        }
        if (parsed.columns) {
          setColumns(parsed.columns);
        }
        if (parsed.rowHeight) {
          setRowHeight(parsed.rowHeight);
        }
      } catch {
        // ignore malformed preferences
      }
    }
    setPreferencesLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    updateFilters(filters);
  }, [filters, preferencesLoaded, updateFilters]);

  useEffect(() => {
    if (!preferencesLoaded || typeof window === 'undefined') return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ filters, columns, rowHeight })
    );
  }, [filters, columns, rowHeight, storageKey, preferencesLoaded]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, status }));
  }, [status]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.status, filters.companyId, filters.role]);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  const visibleColumns = useMemo(
    () => sortedColumns.filter(column => column.visible),
    [sortedColumns]
  );

  const rowClassName = rowHeight === 'compact' ? 'h-11' : 'h-14';

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(entry => entry.id)));
    }
  };

  const handleStatusUpdate = async (entry: ProjectDirectoryCompany, isActive: boolean) => {
    const response = await fetch(`/api/projects/${projectId}/directory/companies/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive })
    });
    if (!response.ok) {
      throw new Error('Update failed');
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    const targets = data.filter(entry => selectedIds.has(entry.id));
    if (targets.length === 0) return;

    try {
      await Promise.all(targets.map(entry => handleStatusUpdate(entry, isActive)));
      toast.success(
        `${isActive ? 'Reactivated' : 'Deactivated'} ${targets.length} ${targets.length === 1 ? 'company' : 'companies'}`
      );
      setSelectedIds(new Set());
      refetch();
    } catch {
      toast.error(`Failed to ${isActive ? 'reactivate' : 'deactivate'} companies`);
    }
  };

  const handleDelete = async (entry: ProjectDirectoryCompany) => {
    const response = await fetch(`/api/projects/${projectId}/directory/companies/${entry.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Delete failed');
    }
  };

  const renderRow = (entry: ProjectDirectoryCompany) => (
    <TableRow key={entry.id} className={cn('hover:bg-muted/50', rowClassName)}>
      {visibleColumns.map(column => {
        switch (column.id) {
          case 'select':
            return (
              <TableCell key={column.id} style={{ width: column.width }}>
                <Checkbox
                  checked={selectedIds.has(entry.id)}
                  onCheckedChange={() => toggleSelection(entry.id)}
                />
              </TableCell>
            );
          case 'company':
            return (
              <TableCell key={column.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{entry.company?.name}</div>
                    {entry.company?.website && (
                      <div className="text-xs text-muted-foreground">{entry.company.website}</div>
                    )}
                  </div>
                </div>
              </TableCell>
            );
          case 'role':
            return <TableCell key={column.id}>{entry.role}</TableCell>;
          case 'type':
            return <TableCell key={column.id}>{entry.company?.type}</TableCell>;
          case 'status':
            return (
              <TableCell key={column.id}>
                <Badge variant={entry.is_active ? 'default' : 'outline'}>
                  {entry.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            );
          case 'location':
            return (
              <TableCell key={column.id}>
                {[entry.company?.city, entry.company?.state].filter(Boolean).join(', ')}
              </TableCell>
            );
          case 'actions':
            return (
              <TableCell key={column.id} style={{ width: column.width }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {permissions.canRemove && (
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            await handleStatusUpdate(entry, !entry.is_active);
                            toast.success(entry.is_active ? 'Company deactivated' : 'Company reactivated');
                            refetch();
                          } catch {
                            toast.error('Update failed');
                          }
                        }}
                      >
                        {entry.is_active ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Reactivate
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {permissions.canRemove && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              await handleDelete(entry);
                              toast.success('Company removed from project');
                              refetch();
                            } catch {
                              toast.error('Failed to remove company');
                            }
                          }}
                        >
                          Remove from project
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            );
          default:
            return null;
        }
      })}
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search || ''}
              onChange={(event) => setFilters(prev => ({ ...prev, search: event.target.value }))}
              placeholder="Search companies..."
              className="pl-9"
            />
          </div>

          <Select
            value={filters.role || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, role: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {filterOptions.roles.map(role => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.companyId || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, companyId: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {filterOptions.companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRowHeight(prev => (prev === 'cozy' ? 'compact' : 'cozy'))}
          >
            Row height: {rowHeight === 'compact' ? 'Compact' : 'Comfortable'}
          </Button>

          <Button
            variant="outline"
            size="icon"
          onClick={() => setShowColumnManager(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {data.length} of {meta.total} companies
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-2">
          <span className="text-sm">{selectedIds.size} selected</span>
          {status === 'active' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate(false)}
              disabled={!permissions.canRemove}
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate(true)}
              disabled={!permissions.canRemove}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Reactivate
            </Button>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(column => (
                <TableHead key={column.id} style={{ width: column.width }}>
                  {column.id === 'select' ? (
                    <Checkbox
                      checked={selectedIds.size === data.length && data.length > 0}
                      onCheckedChange={selectAll}
                    />
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={`company-skeleton-${index}`}>
                  {visibleColumns.map(column => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : data.map(entry => renderRow(entry))}

            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="py-8 text-center">
                  No companies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showColumnManager && (
        <ColumnManager
          columns={columns}
          defaultColumns={companyColumns}
          onColumnsChange={setColumns}
          onClose={() => setShowColumnManager(false)}
        />
      )}
    </div>
  );
}
