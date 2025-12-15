'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProjectContractsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.push(`/contracts?project=${projectId}`);
  }, [projectId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Loading contracts for project {projectId}...</p>
    </div>
  );
}
