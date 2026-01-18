import { ProjectSetupWizard } from "@/components/project-setup-wizard/project-setup-wizard";
import { DashboardFormLayout } from "@/components/layouts";

interface ProjectSetupPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectSetupPage({
  params,
}: ProjectSetupPageProps) {
  const { projectId } = await params;
  return (
    <DashboardFormLayout maxWidth="wide">
      <ProjectSetupWizard projectId={projectId} />
    </DashboardFormLayout>
  );
}
