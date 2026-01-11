import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Table, Column } from "@tanstack/react-table";

/**
 * Custom hook for virtualizing table columns using TanStack Virtual
 *
 * This enables horizontal virtualization for tables with many columns,
 * improving performance by only rendering visible columns in the DOM.
 *
 * @template TData - The type of data in the table rows
 * @param table - TanStack Table instance
 * @param options - Configuration options for the virtualizer
 * @returns Column virtualizer instance from @tanstack/react-virtual
 *
 * @example
 * ```tsx
 * const table = useReactTable({ ... });
 * const columnVirtualizer = useMRT_ColumnVirtualizer(table, {
 *   estimateSize: () => 150,
 *   overscan: 3
 * });
 * ```
 */
export function useMRT_ColumnVirtualizer<TData = unknown>(
  table: Table<TData>,
  options?: {
    /** Estimated column width in pixels */
    estimateSize?: (index: number) => number;
    /** Number of columns to render outside visible area */
    overscan?: number;
  }
) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Get all leaf columns (actual data columns, not grouped headers)
  const columns = useMemo(
    () => table.getAllLeafColumns(),
    [table]
  );

  // Create column virtualizer
  const columnVirtualizer = useVirtualizer({
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: options?.estimateSize ?? (() => 150), // Default 150px per column
    horizontal: true,
    overscan: options?.overscan ?? 3, // Render 3 extra columns on each side
  });

  // Sync virtualizer with table column visibility changes
  useEffect(() => {
    columnVirtualizer.measure();
  }, [columns, columnVirtualizer]);

  return {
    /** Reference to attach to the scrollable container */
    parentRef,
    /** Column virtualizer instance */
    columnVirtualizer,
    /** Virtual columns to render */
    virtualColumns: columnVirtualizer.getVirtualItems(),
    /** Total width of all columns */
    totalWidth: columnVirtualizer.getTotalSize(),
  };
}

/**
 * Helper type for column virtualizer return value
 */
export type ColumnVirtualizer<TData = unknown> = ReturnType<
  typeof useMRT_ColumnVirtualizer<TData>
>;

/**
 * Helper function to get a column by virtual index
 *
 * @param table - TanStack Table instance
 * @param virtualIndex - Virtual item index from virtualizer
 * @returns The column at that index
 */
export function getVirtualColumn<TData = unknown>(
  table: Table<TData>,
  virtualIndex: number
): Column<TData, unknown> | undefined {
  const columns = table.getAllLeafColumns();
  return columns[virtualIndex];
}
