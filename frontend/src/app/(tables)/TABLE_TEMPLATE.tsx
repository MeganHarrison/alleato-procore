// COPY THIS FILE TO CREATE A NEW TABLE PAGE
// 1. Copy this file to: frontend/src/app/(tables)/YOUR-TABLE-NAME/page.tsx
// 2. Replace "your_table_name" with your actual Supabase table name
// 3. Update the config object with your table's columns and settings
// 4. Done! The page will automatically have a header, layout, and data table

import { SimpleTablePage } from "@/components/tables/simple-table-page";
import { type GenericTableConfig } from "@/components/tables/generic-table-factory";

const config: GenericTableConfig = {
  title: "Your Table Title",
  description: "Description of what this table shows",
  searchFields: ["field1", "field2", "field3"],
  exportFilename: "your-table-export.csv",
  editConfig: {
    tableName: "your_table_name",
    editableFields: ["field1", "field2", "field3"],
  },
  columns: [
    {
      id: "field1",
      label: "Field 1",
      defaultVisible: true,
      type: "text",
    },
    {
      id: "field2",
      label: "Field 2",
      defaultVisible: true,
      type: "badge",
      renderConfig: {
        type: "badge",
        variantMap: {
          option1: "destructive",
          option2: "default",
          option3: "outline",
          option4: "secondary",
        },
        defaultVariant: "outline",
      },
    },
    {
      id: "created_at",
      label: "Created",
      defaultVisible: false,
      type: "date",
    },
  ],
  filters: [
    {
      id: "status",
      label: "Status",
      field: "status",
      options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ],
    },
  ],
  rowClickPath: "/your-table/{id}",
};

export default function YourTablePage() {
  return <SimpleTablePage tableName="your_table_name" config={config} />;
}
