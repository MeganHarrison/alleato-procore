"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface ApprovalRecord {
  id: number;
  approver_id: number;
  approver_name: string;
  approval_status: "pending" | "approved" | "rejected";
  comments?: string;
  responded_at?: string;
  created_at: string;
}

interface ChangeEventApprovalWorkflowProps {
  changeEventId: number;
  projectId: number;
  currentStatus: string;
  onStatusChange: (newStatus: string) => Promise<void>;
  currentUserId?: number;
}

export function ChangeEventApprovalWorkflow({
  changeEventId,
  projectId,
  currentStatus,
  onStatusChange,
  currentUserId,
}: ChangeEventApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user can approve
  const canApprove =
    currentStatus === "pending_approval" &&
    approvals.some(
      (a) => a.approver_id === currentUserId && a.approval_status === "pending",
    );

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);

    try {
      await onStatusChange("pending_approval");

      // Create approval request
      const response = await fetch(
        `/api/projects/${projectId}/change-events/${changeEventId}/approvals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approver_ids: [1, 2], // In real app, this would come from project settings
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit for approval");
      }

      toast.success("Change event submitted for approval");
    } catch (error) {
      toast.error("Failed to submit for approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/change-events/${changeEventId}/approvals/${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approval_status: approved ? "approved" : "rejected",
            comments: approvalComment,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update approval");
      }

      // Check if all approvals are complete
      const allApproved =
        approvals
          .filter((a) => a.approver_id !== currentUserId)
          .every((a) => a.approval_status === "approved") && approved;

      if (allApproved) {
        await onStatusChange("approved");
        toast.success("Change event approved");
      } else if (!approved) {
        await onStatusChange("rejected");
        toast.success("Change event rejected");
      } else {
        toast.success("Your response has been recorded");
      }
    } catch (error) {
      toast.error("Failed to update approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
        <CardDescription>
          Manage the approval process for this change event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submit for Approval */}
        {currentStatus === "open" && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 flex items-center gap-2 font-medium">
              <FileCheck2 className="h-5 w-5" />
              Ready for Approval?
            </h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Submit this change event for approval by project stakeholders.
            </p>
            <Button
              onClick={handleSubmitForApproval}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          </div>
        )}

        {/* Approval Status List */}
        {approvals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Approval Status</h4>
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(approval.approval_status)}
                  <div>
                    <p className="font-medium">{approval.approver_name}</p>
                    {approval.responded_at && (
                      <p className="text-sm text-muted-foreground">
                        Responded: {formatDate(approval.responded_at)}
                      </p>
                    )}
                    {approval.comments && (
                      <p className="mt-1 text-sm">{approval.comments}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(approval.approval_status)}
              </div>
            ))}
          </div>
        )}

        {/* Current User Approval Action */}
        {canApprove && (
          <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
            <h4 className="mb-2 font-medium">Your Response Required</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Review this change event and provide your approval decision.
            </p>
            <div className="space-y-3">
              <Textarea
                placeholder="Add comments (optional)..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApproval(true)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleApproval(false)}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Display */}
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge
            variant={
              currentStatus === "approved"
                ? "success"
                : currentStatus === "rejected"
                  ? "destructive"
                  : currentStatus === "pending_approval"
                    ? "secondary"
                    : "default"
            }
          >
            {currentStatus.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
