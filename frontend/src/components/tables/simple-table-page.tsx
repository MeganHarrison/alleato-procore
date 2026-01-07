import { createClient } from '@/lib/supabase/server'
import { GenericDataTable, type GenericTableConfig } from '@/components/tables/generic-table-factory'
import { PageHeader } from '@/components/design-system'

interface SimpleTablePageProps {
  tableName: string
  config: GenericTableConfig
}

/**
 * Ultra-simple table page component
 * Just pass in a table name and config, and you get a full page with header and data table
 *
 * NO STYLING - Layout provides PageContainer
 * This component ONLY renders: PageHeader + GenericDataTable
 */
export async function SimpleTablePage({ tableName, config }: SimpleTablePageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching ${tableName}:`, error)
    return (
      <>
        <PageHeader title={config.title} description={config.description} />
        <div className="text-center text-destructive p-6">
          Error loading data. Please try again later.
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={config.title} description={config.description} />
      <GenericDataTable data={data || []} config={config} />
    </>
  )
}
