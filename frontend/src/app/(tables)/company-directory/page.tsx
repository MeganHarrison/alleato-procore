import { createClient } from '@/lib/supabase/server'
import { GenericDataTable, type GenericTableConfig } from '@/components/tables/generic-table-factory'
import { TablePageWrapper } from '@/components/tables/table-page-wrapper'

const PAGE_TITLE = 'Companies'
const PAGE_DESCRIPTION = 'Manage your company directory.'

const config: GenericTableConfig = {
  searchFields: ['name', 'notes', 'state'],
  exportFilename: 'companies-export.csv',
  editConfig: {
    tableName: 'companies',
    editableFields: ['name', 'website', 'address', 'state', 'city', 'notes', 'type'],
  },
  columns: [
    {
      id: 'name',
      label: 'Company Name',
      defaultVisible: true,
      type: 'text',
    },
    {
      id: 'type',
      label: 'Type',
      defaultVisible: true,
      type: 'badge',
      renderConfig: {
        type: 'badge',
        variantMap: {
          'client': 'secondary',
          'subcontractor': 'default',
          'partner': 'destructive',
          'prospect': 'outline',
          'vendor': 'destructive',
        },
        defaultVariant: 'outline',
      },
    },
    {
      id: 'website',
      label: 'Website',
      defaultVisible: true,
      type: 'text',
    },
    {
      id: 'adress',
      label: 'Address',
      defaultVisible: true,
      type: 'text',
    },
    {
      id: 'city',
      label: 'City',
      defaultVisible: false,
      type: 'text',
    },
    {
      id: 'state',
      label: 'State',
      defaultVisible: true,
      type: 'date',
    },
    {
      id: 'notes',
      label: 'Notes',
      defaultVisible: true,
      type: 'number',
    },
  ],
  filters: [
    {
      id: 'type',
      label: 'Type',
      field: 'type',
      options: [
        { value: 'client', label: 'Client' },
        { value: 'subcontractor', label: 'Sub' },
        { value: 'partner', label: 'Partner' },
        { value: 'vendor', label: 'Vendor' },
        { value: 'prospect', label: 'Prospect' },
      ],
    },
  ],
}

export default async function TasksPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    return (
      <TablePageWrapper title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <div className="text-center text-red-600 p-6">
          Error loading data. Please try again later.
        </div>
      </TablePageWrapper>
    )
  }

  return (
    <TablePageWrapper title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
      <GenericDataTable data={data || []} config={config} />
    </TablePageWrapper>
  )
}
