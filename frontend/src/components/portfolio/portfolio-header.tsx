'use client';

import * as React from 'react';
import { Settings, ChevronDown, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PortfolioView } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface PortfolioHeaderProps {
  views: PortfolioView[];
  financialViews: PortfolioView[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  onSettingsClick?: () => void;
  onExport?: (format: 'pdf' | 'csv') => void;
  onCreateProject?: () => void;
  onCreateTestProject?: () => void;
}

export function PortfolioHeader({
  views,
  financialViews,
  activeView,
  onViewChange,
  onSettingsClick,
  onExport,
  onCreateProject,
  onCreateTestProject,
}: PortfolioHeaderProps) {
  return (
    <div>
      {/* Title row */}
      <div className="flex items-center justify-between py-3 sm:py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Portfolio</h1>
            <button
              onClick={onSettingsClick}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* View tabs - Hidden on mobile */}
      <div className="hidden sm:flex sm:items-center sm:justify-between gap-3 pb-0 border-b bg-white">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Portfolio tabs">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={cn(
                'group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap',
                activeView === view.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
              aria-current={activeView === view.id ? 'page' : undefined}
            >
              <span>{view.name}</span>
            </button>
          ))}

          {/* Financial Views dropdown */}
          {financialViews.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap',
                    financialViews.some((v) => v.id === activeView)
                      ? 'border-brand text-brand'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  <span>Financial Views</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {financialViews.map((view) => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={activeView === view.id ? 'bg-accent' : ''}
                  >
                    {view.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Export and Create Project buttons - Desktop */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                title="Export"
                aria-label="Export"
              >
                <FileText className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Test Project button (dev/testing only) */}
          {process.env.NODE_ENV === 'development' && onCreateTestProject && (
            <Button
              onClick={onCreateTestProject}
              variant="outline"
              className="h-9 text-sm px-4 border-green-500 text-green-600 hover:bg-green-50"
              title="Create fully populated test project"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Test Project
            </Button>
          )}

          {/* Create Project button */}
          <Button
            onClick={onCreateProject}
            className="bg-brand text-white hover:bg-brand/90 h-9 text-sm px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );
}
