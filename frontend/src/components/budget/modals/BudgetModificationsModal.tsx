'use client';

import { useState, useEffect } from 'react';
import { BaseSidebar, SidebarBody, SidebarFooter, SidebarTabs } from './BaseSidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BudgetModification {
  id: string;
  number: string;
  title: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'void';
  effectiveDate: string | null;
  createdAt: string;
}

interface BudgetModificationsModalProps {
  open: boolean;
  onClose: () => void;
  costCode: string;
  budgetLineId: string;
  projectId: string;
}

/**
 * BudgetModificationsModal - Shows budget transfers/adjustments in a sidebar
 */
export function BudgetModificationsModal({
  open,
  onClose,
  costCode,
  budgetLineId,
  projectId
}: BudgetModificationsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');
  const [modifications, setModifications] = useState<BudgetModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'draft'>('approved');

  useEffect(() => {
    if (open) {
      fetchModifications();
    }
  }, [open, budgetLineId, projectId, statusFilter]);

  const fetchModifications = async () => {
    setLoading(true);
    try {
      const url = `/api/projects/${projectId}/budget/modifications?budgetLineId=${budgetLineId}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setModifications(data.modifications || []);
      }
    } catch (error) {
      console.error('Error fetching budget modifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    const isNegative = value < 0;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));

    if (isNegative) {
      return `($${formatted})`;
    }
    return `$${formatted}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      void: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border',
        statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
      )}>
        {status.toUpperCase()}
      </span>
    );
  };

  const totalAmount = modifications.reduce((sum, m) => sum + m.amount, 0);

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'details', label: 'Details' }
  ];

  return (
    <BaseSidebar
      open={open}
      onClose={onClose}
      title="Budget Modifications"
      subtitle={costCode}
      size="xl"
    >
      {/* Tabs */}
      <SidebarTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'summary' | 'details')}
      />

      {/* Content */}
      <SidebarBody className="bg-white">
        {activeTab === 'summary' ? (
          <div className="p-6 space-y-5">
            {/* Total Summary */}
            <div className="rounded-xl border border-slate-200 shadow-sm p-5 bg-gradient-to-br from-green-50 via-white to-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget Modifications</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Modifications</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {modifications.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'approved', 'pending', 'draft'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as typeof statusFilter)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                    statusFilter === status
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Modifications List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  Loading modifications...
                </div>
              ) : modifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No budget modifications found for this cost code.
                </div>
              ) : (
                modifications.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">{mod.number}</span>
                            {getStatusBadge(mod.status)}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{mod.title}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={cn(
                            'text-lg font-bold tabular-nums',
                            mod.amount < 0 ? 'text-red-600' : 'text-green-600'
                          )}>
                            {formatCurrency(mod.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>Effective: {formatDate(mod.effectiveDate)}</span>
                        <span>Created: {formatDate(mod.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-600">
              Detailed line-item breakdown of budget modifications will be displayed here.
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-gray-500">Details view coming soon</p>
            </div>
          </div>
        )}
      </SidebarBody>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </SidebarFooter>
    </BaseSidebar>
  );
}
