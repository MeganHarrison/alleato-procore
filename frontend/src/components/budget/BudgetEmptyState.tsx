"use client";

import * as React from "react";
import {
  DollarSign,
  Plus,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  ArrowRight,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BudgetEmptyStateProps {
  onCreateClick?: () => void;
  onImportClick?: () => void;
  isLocked?: boolean;
  className?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-background rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function BudgetEmptyState({
  onCreateClick,
  onImportClick,
  isLocked = false,
  className,
}: BudgetEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[500px] py-12 px-6 animate-in fade-in duration-300",
        className
      )}
    >
      {/* Main empty state card */}
      <div className="max-w-2xl w-full text-center">
        {/* Animated icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <FileSpreadsheet className="w-10 h-10 text-primary animate-[float_3s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Heading and description */}
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Create Your First Budget
        </h2>
        <p className="text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
          A project budget outlines all estimated costs, modifications, and
          committed expenses. Start by creating a budget item to begin tracking
          your project costs.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-11 text-base font-medium shadow-sm hover:shadow transition-all"
            onClick={onCreateClick}
            disabled={isLocked}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Budget Item
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-6 h-11 text-base hover:bg-accent transition-all"
            onClick={onImportClick}
            disabled={isLocked}
          >
            <Upload className="w-5 h-5 mr-2" />
            Import Budget
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <FeatureCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Set Original Budget"
            description="Define line items with cost codes, amounts, and unit pricing for accurate tracking."
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Track Modifications"
            description="Record budget changes, transfers, and approved change orders over time."
          />
          <FeatureCard
            icon={<Receipt className="w-6 h-6" />}
            title="Monitor Costs"
            description="Compare projected costs against budget to identify variances and overruns."
          />
        </div>

        {/* Locked state notice */}
        {isLocked && (
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              The budget is currently locked. Unlock it to add new budget items.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
