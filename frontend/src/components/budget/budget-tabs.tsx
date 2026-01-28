"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface BudgetTabsProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const tabs: Tab[] = [
  { id: "budget", label: "Budget" },
  { id: "budget-details", label: "Budget Details" },
  { id: "cost-codes", label: "Cost Codes" },
  { id: "forecasting", label: "Forecasting" },
  { id: "snapshots", label: "Project Status Snapshots" },
  { id: "change-history", label: "Change History" },
  { id: "settings", label: "Settings" },
];

export function BudgetTabs({
  activeTab = "budget",
  onTabChange,
}: BudgetTabsProps) {
  return (
    <div className="bg-background px-4 sm:px-6 lg:px-12">
      <nav className="-mb-px flex space-x-8 border-b overflow-x-auto" aria-label="Budget tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                "inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
