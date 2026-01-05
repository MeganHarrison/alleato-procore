import * as React from 'react';
import { cn } from '@/lib/utils';
import { Stack } from './stack';
import { Heading } from './heading';
import { Text } from './text';

/**
 * EmptyState component for consistent empty/zero state displays.
 * Replaces inline empty state divs.
 *
 * @example
 * <EmptyState
 *   icon={<Building2 className="h-12 w-12" />}
 *   title="No companies found"
 *   description="Create your first company to get started"
 *   action={<Button>Add Company</Button>}
 * />
 */

export interface EmptyStateProps {
  /** Icon to display (usually from lucide-react) */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button/link */
  action?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'p-6',
    iconSize: 'h-8 w-8',
    titleLevel: 5,
    descSize: 'sm'
  },
  md: {
    container: 'p-8',
    iconSize: 'h-12 w-12',
    titleLevel: 4,
    descSize: 'base'
  },
  lg: {
    container: 'p-12',
    iconSize: 'h-16 w-16',
    titleLevel: 3,
    descSize: 'lg'
  }
} as const;

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className
}: EmptyStateProps) {
  const config = sizeMap[size];

  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-center',
        config.container,
        className
      )}
    >
      <Stack gap="md" align="center">
        {icon && (
          <div className={cn('text-muted-foreground', config.iconSize)}>
            {icon}
          </div>
        )}

        <Stack gap="sm" align="center">
          <Heading level={config.titleLevel as 3 | 4 | 5}>
            {title}
          </Heading>

          {description && (
            <Text size={config.descSize as 'sm' | 'base' | 'lg'} tone="muted">
              {description}
            </Text>
          )}
        </Stack>

        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </Stack>
    </div>
  );
}
