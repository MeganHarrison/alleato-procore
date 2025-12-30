'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface EntityOption {
  value: string;
  label: string;
}

interface EntitySelectProps {
  /** Field label */
  label: string;
  /** Current value (UUID) */
  value: string | undefined;
  /** Called with the selected UUID */
  onChange: (value: string) => void;
  /** Options from a hook like useCompanies().options */
  options: EntityOption[];
  /** Loading state from the hook */
  isLoading?: boolean;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Disable the select */
  disabled?: boolean;
  /** ID for the select element */
  id?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Reusable select component for foreign-key relationships.
 *
 * Always uses { value: uuid, label: displayName } pattern.
 * Works with useCompanies, useContacts, useProjects, etc.
 *
 * @example
 * const { options, isLoading } = useCompanies();
 * <EntitySelect
 *   label="Contract Company"
 *   value={watch('contractCompanyId')}
 *   onChange={(v) => setValue('contractCompanyId', v)}
 *   options={options}
 *   isLoading={isLoading}
 * />
 */
export function EntitySelect({
  label,
  value,
  onChange,
  options,
  isLoading = false,
  placeholder = 'Select...',
  error,
  disabled = false,
  id,
  emptyMessage = 'No options available',
}: EntitySelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        value={value || ''}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id={selectId}>
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="_empty" disabled>
              {emptyMessage}
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
