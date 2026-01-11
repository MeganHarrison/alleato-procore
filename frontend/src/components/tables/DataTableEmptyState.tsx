// This component is deprecated - use empty-state from ui folder instead
// Keeping for backwards compatibility during migration

"use client";

import * as React from "react";
import { FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState as UnifiedEmptyState } from "@/components/ui/empty-state";

interface DataTableEmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * @deprecated Use EmptyState from @/components/ui/empty-state with variant="table"
 * This is a compatibility wrapper that will be removed in the future
 */
export function DataTableEmptyState({
  icon: Icon = FileX2,
  title,
  description,
  action,
  className,
}: DataTableEmptyStateProps) {
  return (
    <UnifiedEmptyState
      variant="table"
      icon={<Icon className="h-10 w-10" />}
      title={title}
      description={description}
      action={
        action && <Button onClick={action.onClick}>{action.label}</Button>
      }
      iconWithBackground
      className={className}
    />
  );
}
