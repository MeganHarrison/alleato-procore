"use client";

import * as React from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/motion/animated-background";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tab {
  id: string;
  label: string;
  href?: string;
}

interface BudgetTabsProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

// Core tabs - always visible
const coreTabs: Tab[] = [
  { id: "budget", label: "Budget" },
  { id: "budget-details", label: "Budget Details" },
  { id: "cost-codes", label: "Cost Codes" },
];

// Advanced tabs - shown in dropdown
const advancedTabs: Tab[] = [
  { id: "forecasting", label: "Forecasting" },
  { id: "snapshots", label: "Project Status Snapshots" },
  { id: "change-history", label: "Change History" },
  { id: "settings", label: "Settings" },
];

// All tabs combined for reference
const allTabs = [...coreTabs, ...advancedTabs];

export function BudgetTabs({
  activeTab = "budget",
  onTabChange,
}: BudgetTabsProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Check if active tab is an advanced tab
  const isAdvancedTabActive = advancedTabs.some((tab) => tab.id === activeTab);
  const activeAdvancedTab = advancedTabs.find((tab) => tab.id === activeTab);

  const handleAdvancedTabSelect = (tabId: string) => {
    onTabChange?.(tabId);
    setDropdownOpen(false);
  };

  return (
    <div className="border-b bg-background">
      <div className="px-4 sm:px-6 lg:px-12">
        <nav className="flex items-center py-3" aria-label="Budget tabs">
          <div className="flex items-center gap-1">
            {/* Core tabs with animated background */}
            <AnimatedBackground
              defaultValue={isAdvancedTabActive ? undefined : activeTab}
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
              {coreTabs.map((tab) => {
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
                        : "text-foreground dark:text-gray-200 hover:text-foreground dark:hover:text-white hover:bg-muted/50"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </AnimatedBackground>

            {/* Separator */}
            <div className="w-px h-6 bg-border mx-2" />

            {/* Advanced tabs dropdown */}
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isAdvancedTabActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 px-3 gap-1.5 transition-all duration-200",
                    isAdvancedTabActive
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "text-foreground hover:bg-muted/50"
                  )}
                >
                  {isAdvancedTabActive ? (
                    <>
                      {activeAdvancedTab?.label}
                      <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">More</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {advancedTabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => handleAdvancedTabSelect(tab.id)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      activeTab === tab.id && "bg-accent font-medium"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="ml-auto text-primary">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </div>
  );
}
