import { CreateDirectCostForm } from '@/components/direct-costs/CreateDirectCostForm'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function NewDirectCostPage({ params }: PageProps) {
  const projectId = parseInt(params.projectId)

  return (
    <div className="container mx-auto py-6">
      <CreateDirectCostForm projectId={projectId} />
    </div>
  )
}
