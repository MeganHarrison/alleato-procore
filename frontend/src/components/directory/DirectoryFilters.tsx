"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import type { DirectoryFilterOptions, DirectoryFilters } from '@/types/directory';

type DirectoryFilterValue = string | string[] | undefined;

interface DirectoryFiltersProps {
  filters: DirectoryFilters;
  onFiltersChange: (filters: DirectoryFilters) => void;
  projectId: string;
  options?: DirectoryFilterOptions;
  loading?: boolean;
}

/**
 * Render a directory filter panel and manage loading of company and permission template options.
 *
 * Renders controls for type, status, company, permission template, grouping, and sort order; loads company and permission template options on mount and propagates every change via the `onFiltersChange` callback.
 *
 * @param filters - Current filter state to drive the control values
 * @param onFiltersChange - Callback invoked with the updated filters when any control changes
 * @param projectId - Identifier for the current project (passed to the component but not required for control interaction)
 * @returns The filter panel JSX element
 */
export function DirectoryFilters({ 
  filters, 
  onFiltersChange,
  projectId: _projectId,
  options,
  loading = false
}: DirectoryFiltersProps) {
  const [companies, setCompanies] = useState(options?.companies ?? []);
  const [permissionTemplates, setPermissionTemplates] = useState(options?.permissionTemplates ?? []);
  const [roles, setRoles] = useState(options?.roles ?? []);

  useEffect(() => {
    setCompanies(options?.companies ?? []);
    setPermissionTemplates(options?.permissionTemplates ?? []);
    setRoles(options?.roles ?? []);
  }, [options]);

  const handleFilterChange = (key: keyof DirectoryFilters, value: DirectoryFilterValue) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      status: 'active',
      groupBy: filters.groupBy, // Preserve grouping preference
      search: '',
      companyId: undefined,
      permissionTemplateId: undefined,
      role: undefined
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'groupBy') return false;
    if (key === 'status' && value === 'active') return false;
    if (key === 'type' && value === 'all') return false;
    return value !== undefined && value !== '';
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <CardDescription>
                {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
              </CardDescription>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearFilters}
            >
              Clear all
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {/* Person Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="type-filter">Type</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger id="type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">Users Only</SelectItem>
                <SelectItem value="contact">Contacts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status || 'active'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <Label htmlFor="company-filter">Company</Label>
            <Select
              value={filters.companyId || 'all'}
              onValueChange={(value) => handleFilterChange('companyId', value === 'all' ? undefined : value)}
              disabled={loading}
            >
              <SelectTrigger id="company-filter">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="no-company">No Company</SelectItem>
                <Separator className="my-1" />
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permission Template Filter */}
          <div className="space-y-2">
            <Label htmlFor="permission-filter">Permission</Label>
            <Select
              value={filters.permissionTemplateId || 'all'}
              onValueChange={(value) => handleFilterChange('permissionTemplateId', value === 'all' ? undefined : value)}
              disabled={loading}
            >
              <SelectTrigger id="permission-filter">
                <SelectValue placeholder="All Permissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Permissions</SelectItem>
                <SelectItem value="none">No Permission</SelectItem>
                <Separator className="my-1" />
                {permissionTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <Label htmlFor="role-filter">Role</Label>
            <Select
              value={filters.role || 'all'}
              onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
              disabled={loading}
            >
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(roleValue => (
                  <SelectItem key={roleValue} value={roleValue}>
                    {roleValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* View Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">View Options</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="group-by-company">Group by Company</Label>
              <p className="text-xs text-muted-foreground">
                Organize people by their company affiliation
              </p>
            </div>
            <Switch
              id="group-by-company"
              checked={filters.groupBy === 'company'}
              onCheckedChange={(checked) => 
                handleFilterChange('groupBy', checked ? 'company' : 'none')
              }
            />
          </div>
        </div>

        <Separator />

        {/* Sort Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Sort By</h4>
          
          <div className="space-y-2">
            <Select
              value={filters.sortBy?.[0] || 'company:asc'}
              onValueChange={(value) => handleFilterChange('sortBy', [value])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company:asc">Company (A-Z)</SelectItem>
                <SelectItem value="company:desc">Company (Z-A)</SelectItem>
                <SelectItem value="name:asc">Name (A-Z)</SelectItem>
                <SelectItem value="name:desc">Name (Z-A)</SelectItem>
                <SelectItem value="email:asc">Email (A-Z)</SelectItem>
                <SelectItem value="email:desc">Email (Z-A)</SelectItem>
                <SelectItem value="created_at:desc">Newest First</SelectItem>
                <SelectItem value="created_at:asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
