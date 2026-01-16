"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = ["draft", "open", "answered", "closed"];

export default function CreateRfiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId");
  const { options: projectOptions, isLoading: projectsLoading } = useProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectId: initialProjectId ?? "",
    number: "",
    subject: "",
    question: "",
    status: "open",
    dueDate: "",
    receivedFrom: "",
    ballInCourt: "",
    isPrivate: false,
  });

  useEffect(() => {
    if (initialProjectId) {
      setFormData((prev) => ({ ...prev, projectId: initialProjectId }));
    }
  }, [initialProjectId]);

  const parsedNumber = useMemo(() => {
    const digits = formData.number.replace(/\D/g, "");
    if (!digits) return null;
    const parsed = Number.parseInt(digits, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [formData.number]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!formData.projectId) {
      setErrorMessage("Project is required.");
      return;
    }

    if (!parsedNumber) {
      setErrorMessage("RFI number must include at least one digit.");
      return;
    }

    if (!formData.subject.trim()) {
      setErrorMessage("Subject is required.");
      return;
    }

    if (!formData.question.trim()) {
      setErrorMessage("Question is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("rfis").insert({
        project_id: Number(formData.projectId),
        number: parsedNumber,
        subject: formData.subject.trim(),
        question: formData.question.trim(),
        status: formData.status,
        due_date: formData.dueDate || null,
        received_from: formData.receivedFrom || null,
        ball_in_court: formData.ballInCourt || null,
        is_private: formData.isPrivate,
      });

      if (error) {
        throw new Error(error.message);
      }

      const destination = formData.projectId
        ? `/${formData.projectId}/rfis`
        : "/rfis";
      router.push(destination);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create RFI. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href={formData.projectId ? `/${formData.projectId}/rfis` : "/rfis"}>
            <ArrowLeft className="h-4 w-4" />
            Back to RFIs
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mt-4">Create RFI</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, projectId: value }))
                }
                disabled={projectsLoading}
              >
                <SelectTrigger id="project">
                  <SelectValue
                    placeholder={
                      projectsLoading ? "Loading projects..." : "Select project"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfiNumber">RFI Number</Label>
              <Input
                id="rfiNumber"
                value={formData.number}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    number: event.target.value,
                  }))
                }
                placeholder="RFI-001"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                placeholder="Brief summary of the RFI"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    question: event.target.value,
                  }))
                }
                placeholder="Describe the information needed"
                className="min-h-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment & Visibility</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ballInCourt">Ball In Court</Label>
              <Input
                id="ballInCourt"
                value={formData.ballInCourt}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    ballInCourt: event.target.value,
                  }))
                }
                placeholder="Responsible team or person"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedFrom">Received From</Label>
              <Input
                id="receivedFrom"
                value={formData.receivedFrom}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    receivedFrom: event.target.value,
                  }))
                }
                placeholder="Company or contact"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPrivate: checked === true,
                  }))
                }
              />
              <Label htmlFor="isPrivate">Mark as private</Label>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[hsl(var(--procore-orange))] hover:bg-[hsl(var(--procore-orange))]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create RFI"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
