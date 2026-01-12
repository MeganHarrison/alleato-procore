/**
 * ============================================================================
 * FULL-FEATURED TABLE PAGE TEMPLATE
 * ============================================================================
 *
 * This template demonstrates a rich configuration for GenericDataTable.
 * Customize the table name, columns, filters, and advanced options as needed.
 */

import { createClient } from "@/lib/supabase/server";
import {
  GenericDataTable,
  type GenericTableConfig,
} from "@/components/tables/generic-table-factory";

const config: GenericTableConfig = {
  title: "Employees",
  description: "Comprehensive employee management with advanced features",
  exportFilename: "employees-export",
  searchFields: ["first_name", "last_name", "email", "job_title", "department"],
  enableFuzzySearch: true,
  fuzzySearchThreshold: 0.3,
  columns: [
    {
      id: "first_name",
      label: "First Name",
      defaultVisible: true,
      type: "text",
      isPrimary: true,
      sortable: true,
      resizable: true,
      pinnable: true,
      defaultWidth: 150,
      minWidth: 100,
      maxWidth: 300,
    },
    {
      id: "last_name",
      label: "Last Name",
      defaultVisible: true,
      type: "text",
      sortable: true,
      resizable: true,
      pinnable: true,
      defaultWidth: 150,
      minWidth: 100,
      maxWidth: 300,
    },
    {
      id: "email",
      label: "Email",
      defaultVisible: true,
      type: "email",
      sortable: true,
      resizable: true,
      defaultWidth: 250,
      minWidth: 200,
      maxWidth: 400,
    },
    {
      id: "department",
      label: "Department",
      defaultVisible: true,
      type: "badge",
      sortable: true,
      resizable: true,
      renderConfig: {
        type: "badge",
        variantMap: {
          Engineering: "default",
          Sales: "secondary",
          Marketing: "outline",
          HR: "secondary",
          Operations: "outline",
        },
        defaultVariant: "outline",
      },
    },
    {
      id: "start_date",
      label: "Start Date",
      defaultVisible: true,
      type: "date",
      sortable: true,
      resizable: true,
      defaultWidth: 140,
    },
    {
      id: "created_at",
      label: "Created",
      defaultVisible: false,
      type: "date",
      sortable: true,
    },
  ],
  filters: [
    {
      id: "department",
      label: "Department",
      field: "department",
      options: [
        { value: "Engineering", label: "Engineering" },
        { value: "Sales", label: "Sales" },
        { value: "Marketing", label: "Marketing" },
        { value: "HR", label: "Human Resources" },
        { value: "Operations", label: "Operations" },
      ],
    },
  ],
  enableSorting: true,
  defaultSortColumn: "last_name",
  defaultSortDirection: "asc",
  enableMultiColumnSort: true,
  enableViewSwitcher: true,
  defaultViewMode: "table",
  enableColumnResize: true,
  enableColumnPin: true,
  enableRowSelection: true,
  rowClickPath: "/employees/{id}",
  stateStorageKey: "employees-table-state",
};

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    console.error("Error fetching employees:", error);
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">Error Loading Employees</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <GenericDataTable data={employees || []} config={config} />
    </div>
  );
}
