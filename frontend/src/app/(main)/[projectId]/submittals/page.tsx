import { SubmittalsClient } from "@/app/(tables)/submittals/submittals-client";
import {
  fetchSubmittals,
  resolveSubmittalsProjectId,
} from "@/app/(tables)/submittals/submittals-data";

export default async function SubmittalsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const numericProjectId = resolveSubmittalsProjectId(projectId);
  const submittals = await fetchSubmittals(numericProjectId);

  return (
    <SubmittalsClient submittals={submittals} projectId={numericProjectId} />
  );
}
