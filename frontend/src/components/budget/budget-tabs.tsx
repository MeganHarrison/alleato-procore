"use client";

import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/motion/animated-background";

interface Tab {
  id: string;
  label: string;
  href?: string;
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
    <div className="border-b bg-white">
      <div className="px-4 sm:px-6 lg:px-12">
        <nav className="flex py-3" aria-label="Budget tabs">
          <div className="flex gap-1">
            <AnimatedBackground
              defaultValue={activeTab}
              className="rounded-md bg-primary"
              transition={{
                ease: "easeInOut",
                duration: 0.2,
              }}
              onValueChange={(value) => {
                if (value) {
                  onTabChange?.(value);
                }
              }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-id={tab.id}
                    type="button"
                    aria-label={tab.label}
                    className={cn(
                      "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-md",
                      isActive
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>
        </nav>
      </div>
    </div>
  );
}
