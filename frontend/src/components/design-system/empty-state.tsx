// This component is deprecated - use empty-state from ui folder instead
// Keeping for backwards compatibility during migration

import React from "react";
import { LucideIcon } from "lucide-react";
import { EmptyState as UnifiedEmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * @deprecated Use EmptyState from @/components/ui/empty-state with variant="executive"
 * This is a compatibility wrapper that will be removed in the future
 *
 * Empty state component for when no data is available
 * Maintains the executive design system aesthetic
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <UnifiedEmptyState
      variant="executive"
      size="lg"
      icon={<Icon className="h-16 w-16" strokeWidth={1.5} />}
      title={title}
      description={description}
      action={
        action && (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 bg-white hover:border-brand hover:bg-brand/5 transition-all duration-300 text-sm font-medium text-neutral-900"
          >
            {action.label}
          </button>
        )
      }
    />
  );
}
