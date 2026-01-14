import { CreateDirectCostForm } from '@/components/direct-costs/CreateDirectCostForm'

interface PageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function NewDirectCostPage({ params }: PageProps) {
  const resolvedParams = await params
  const projectId = parseInt(resolvedParams.projectId)

  return (
    <div className="container mx-auto py-6">
      <CreateDirectCostForm projectId={projectId} />
    </div>
  )
}
