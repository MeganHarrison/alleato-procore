import { createClient } from '@/lib/supabase/server'
import { EmployeesDataTable } from '@/components/tables/employees-data-table'

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
      <div className="container mx-auto py-10">
        <div className="text-center text-red-600">
          Error loading employees. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div>
        <div className="pb-8">
          <h1>Employees</h1>
          <p className="text-muted-foreground">
            View and manage all your employees
          </p>
        </div>
        <EmployeesDataTable employees={employees || []} />
    </div>
  )
}
