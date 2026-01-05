import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Text component for consistent body text styling.
 * Replaces raw p, span, and div elements.
 *
 * @example
 * <Text>Default body text</Text>
 * <Text size="sm" tone="muted">Small muted text</Text>
 * <Text weight="semibold">Bold text</Text>
 */

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
} as const;

const toneMap = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  accent: 'text-accent-foreground',
  destructive: 'text-destructive',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400'
} as const;

const weightMap = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
} as const;

export interface TextProps {
  /** Size of text */
  size?: keyof typeof sizeMap;
  /** Color tone/intent */
  tone?: keyof typeof toneMap;
  /** Font weight */
  weight?: keyof typeof weightMap;
  /** Render as a different element */
  as?: 'p' | 'span' | 'div' | 'label';
  /** Additional CSS classes */
  className?: string;
  /** Text content */
  children: React.ReactNode;
}

export function Text({
  size = 'base',
  tone = 'default',
  weight = 'normal',
  as: Component = 'p',
  className,
  children
}: TextProps) {
  return (
    <Component
      className={cn(
        sizeMap[size],
        toneMap[tone],
        weightMap[weight],
        className
      )}
    >
      {children}
    </Component>
  );
}
