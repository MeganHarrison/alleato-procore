import { createClient } from '@/lib/supabase/server'
import { EmployeesDataTable } from '@/components/tables/employees-data-table'
import { TablePageWrapper } from '@/components/tables/table-page-wrapper'

const PAGE_TITLE = 'Employees'
const PAGE_DESCRIPTION = 'View and manage all your employees'

export default async function EmployeesPage() {
  const supabase = await createClient()

  // Fetch all employees from employees table
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    return (
      <TablePageWrapper title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <div className="text-center text-red-600 p-6">
          Error loading employees. Please try again later.
        </div>
      </TablePageWrapper>
    )
  }

  return (
    <TablePageWrapper title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
      <EmployeesDataTable employees={employees || []} />
    </TablePageWrapper>
  )
}
