"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

type DocumentMetadata =
  Database["public"]["Tables"]["document_metadata"]["Row"];

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<DocumentMetadata | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.meetingId]);

  const fetchMeetingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: meetingData, error: meetingError } = await supabase
        .from("document_metadata")
        .select("*")
        .eq("id", params.meetingId as string)
        .single();

      if (meetingError) throw meetingError;

      setMeeting(meetingData);

      // If there's a URL, fetch the transcript
      if (meetingData?.url) {
        try {
          const response = await fetch(meetingData.url);
          if (response.ok) {
            const text = await response.text();
            setTranscript(text);
          } else {
            setTranscript(
              "Unable to load transcript from the provided URL.",
            );
          }
        } catch (fetchError) {
          console.error("Error fetching transcript:", fetchError);
          setTranscript(
            "Error loading transcript. The document may not be accessible.",
          );
        }
      } else if (meetingData?.content) {
        // Use content field if available
        setTranscript(meetingData.content);
      } else {
        setTranscript("No transcript available for this meeting.");
      }
    } catch (err) {
      console.error("Error fetching meeting:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load meeting",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date not available";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-50px)] min-h-0 bg-gray-50 rounded-lg overflow-hidden">
        <PageHeader
          title="Loading Meeting..."
          breadcrumbs={[
            { label: "Meetings", href: "/infinite-meetings" },
            { label: "Meeting Details" },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col h-[calc(100vh-50px)] min-h-0 bg-gray-50 rounded-lg overflow-hidden">
        <PageHeader
          title="Meeting Not Found"
          breadcrumbs={[
            { label: "Meetings", href: "/infinite-meetings" },
            { label: "Not Found" },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Meeting Not Found</h2>
            <p className="text-gray-400 mb-6">
              {error || "The requested meeting could not be found."}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const actionItems = meeting.action_items
    ? typeof meeting.action_items === "string"
      ? JSON.parse(meeting.action_items)
      : meeting.action_items
    : [];

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] min-h-0 bg-gray-50 rounded-lg overflow-hidden">
      <PageHeader
        title={meeting.title || "Untitled Meeting"}
        description={meeting.project || "Meeting Transcript"}
        breadcrumbs={[
          { label: "Meetings", href: "/infinite-meetings" },
          { label: meeting.title || "Meeting Details" },
        ]}
        actions={
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Meeting Metadata Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6 text-sm">
                {meeting.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                )}
                {meeting.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(meeting.duration_minutes)}</span>
                  </div>
                )}
                {meeting.participants && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.participants}</span>
                  </div>
                )}
                {meeting.source && (
                  <Badge variant="secondary">{meeting.source}</Badge>
                )}
              </div>

              {/* External Links */}
              {(meeting.fireflies_link || meeting.url) && (
                <div className="flex gap-4 mt-4 pt-4 border-t">
                  {meeting.fireflies_link && (
                    <a
                      href={meeting.fireflies_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View in Fireflies
                    </a>
                  )}
                  {meeting.url && (
                    <a
                      href={meeting.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Original Document
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Section */}
          {meeting.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed">{meeting.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {Array.isArray(actionItems) && actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {actionItems.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Transcript Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full rounded-lg border p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {transcript}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
