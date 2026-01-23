"use client";

import { useParams } from "next/navigation";

export default function ProjectDirectCostsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Direct Costs</h1>
      <p>Direct costs page for project {projectId}</p>
      <p>Testing basic functionality - imports working correctly.</p>
    </div>
  );
}