'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProjectInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.push(`/invoices?project=${projectId}`);
  }, [projectId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Loading invoices for project {projectId}...</p>
    </div>
  );
}
