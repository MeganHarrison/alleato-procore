'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProjectChangeOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.push(`/change-orders?project=${projectId}`);
  }, [projectId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Loading change orders for project {projectId}...</p>
    </div>
  );
}
