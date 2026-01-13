"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FormContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function NewRfiPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;

  const handleCancel = () => {
    router.push(`/${projectId}/rfis`);
  };

  return (
    <>
      <PageHeader
        title="New RFI"
        breadcrumbs={[
          { label: "RFIs", href: `/${projectId}/rfis` },
          { label: "New RFI" },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <FormContainer maxWidth="xl">
        <div className="text-center py-12 text-muted-foreground">
          Create RFI Form - Coming Soon
        </div>
      </FormContainer>
    </>
  );
}
