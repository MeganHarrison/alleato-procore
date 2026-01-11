import type { GenericTableConfig } from "@/components/tables/generic-table-factory";

/**
 * Contracts Table Configuration
 *
 * Configuration for prime contracts table using GenericDataTable.
 * Prime contracts are owner agreements, distinct from commitments (subcontracts/POs).
 */

/**
 * Prime contracts table configuration
 */
export const contractsTableConfig: GenericTableConfig = {
  title: "Prime Contracts",
  description: "Manage prime contracts and owner agreements",
  searchFields: ["contract_number", "title", "vendor_name"],
  exportFilename: "prime-contracts.csv",
  enableSorting: true,
  defaultSortColumn: "contract_number",
  defaultSortDirection: "asc",
  enableViewSwitcher: false, // Keep table view only for financial data
  columns: [
    {
      id: "contract_number",
      label: "#",
      defaultVisible: true,
      type: "text",
      isPrimary: true,
      sortable: true,
    },
    {
      id: "vendor_name",
      label: "Vendor",
      defaultVisible: true,
      type: "text",
      sortable: true,
      renderConfig: {
        type: "nested",
        path: "vendor.name",
        fallback: "--",
      },
    },
    {
      id: "title",
      label: "Title",
      defaultVisible: true,
      type: "text",
      isSecondary: true,
      sortable: true,
    },
    {
      id: "status",
      label: "Status",
      defaultVisible: true,
      type: "badge",
      sortable: true,
      renderConfig: {
        type: "badge",
        variantMap: {
          draft: "secondary",
          active: "default",
          completed: "outline",
          cancelled: "destructive",
          on_hold: "outline",
        },
        defaultVariant: "secondary",
      },
    },
    {
      id: "original_contract_value",
      label: "Original Value",
      defaultVisible: true,
      type: "number",
      sortable: true,
      renderConfig: {
        type: "currency",
        prefix: "$",
        showDecimals: true,
      },
    },
    {
      id: "revised_contract_value",
      label: "Revised Value",
      defaultVisible: true,
      type: "number",
      sortable: true,
      renderConfig: {
        type: "currency",
        prefix: "$",
        showDecimals: true,
      },
    },
    {
      id: "start_date",
      label: "Start Date",
      defaultVisible: false,
      type: "date",
      sortable: true,
    },
    {
      id: "end_date",
      label: "End Date",
      defaultVisible: false,
      type: "date",
      sortable: true,
    },
    {
      id: "description",
      label: "Description",
      defaultVisible: false,
      type: "text",
      renderConfig: {
        type: "truncate",
        maxLength: 100,
      },
    },
  ],
  filters: [
    {
      id: "status-filter",
      label: "Status",
      field: "status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
        { value: "on_hold", label: "On Hold" },
      ],
    },
  ],
};

/**
 * Contracts status label mapping
 */
export const contractStatusLabels: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

/**
 * Format currency helper
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}
