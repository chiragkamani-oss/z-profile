"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Loader2,
  Send,
} from "lucide-react";

interface ProfileDetail {
  ID: string;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  post_date: string;
  author?: {
    display_name: string;
    user_email: string;
    user_login: string;
  };
  postmeta?: Array<{
    meta_key: string;
    meta_value: string;
  }>;
}

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [parsedData, setParsedData] = useState<{
    designation?: string;
    experienceYears?: number;
    skills?: string[];
    certifications?: string[];
    aliasName?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const user = session?.user;
  const isAdminOrManager = user?.role === "administrator" || user?.role === "manager";
  const isEngineerOrPartner = user?.role === "engineer" || user?.role === "partner";

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/profiles/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        const meta = data.data.postmeta?.find((m: any) => m.meta_key === "profile_data");
        if (meta?.meta_value) {
          try {
            setParsedData(JSON.parse(meta.meta_value));
          } catch {
            setParsedData({});
          }
        }
      } else {
        setError(data.error?.message || "Failed to load profile");
      }
    } catch {
      setError("Network error while loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (status: string, reviewFeedback?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/profiles/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback: reviewFeedback }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackDialogOpen(false);
        setFeedback("");
        fetchProfile();
      } else {
        alert(data.error?.message || "Failed to update status");
      }
    } catch {
      alert("Network error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "is_ready":
      case "publish":
        return <Badge variant="success">Ready / Published</Badge>;
      case "in_review":
        return <Badge variant="warning">In Review</Badge>;
      case "review_changes":
        return <Badge variant="destructive">Changes Requested</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Link href="/profiles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles
          </Button>
        </Link>
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error || "Profile not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/profiles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print / Export
          </Button>

          {/* Engineer Actions */}
          {isEngineerOrPartner &&
            (profile.post_status === "in_draft" ||
              profile.post_status === "review_changes") && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handleStatusChange("in_review")}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Submit for Review
              </Button>
            )}

          {/* Admin / Manager Review Actions */}
          {isAdminOrManager && (
            <>
              {profile.post_status !== "is_ready" && (
                <Button
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange("is_ready")}
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Profile
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={actionLoading}
                onClick={() => setFeedbackDialogOpen(true)}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Request Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{profile.post_title}</CardTitle>
              <CardDescription className="text-base font-medium text-slate-700 dark:text-slate-300">
                {parsedData.designation || profile.post_excerpt || "Software Engineer"}
              </CardDescription>
            </div>
            <div>{getStatusBadge(profile.post_status)}</div>
          </div>
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span>Author: {profile.author?.display_name || "Unknown"}</span>
            <span>•</span>
            <span>Email: {profile.author?.user_email}</span>
            <span>•</span>
            <span>Created: {new Date(profile.post_date).toLocaleDateString()}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/50">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Experience
              </p>
              <p className="text-lg font-bold">
                {parsedData.experienceYears !== undefined
                  ? `${parsedData.experienceYears} Years`
                  : "--"}
              </p>
            </div>
            {isAdminOrManager && parsedData.aliasName && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Internal Client Alias
                </p>
                <p className="text-lg font-bold">{parsedData.aliasName}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Core Technical Skills</h4>
            <div className="flex flex-wrap gap-2">
              {parsedData.skills && parsedData.skills.length > 0 ? (
                parsedData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1 text-xs">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific skills listed.
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Professional Summary & Bio</h4>
            <div className="whitespace-pre-line rounded-md border bg-white p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {profile.post_content || "No summary provided."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Profile Changes</DialogTitle>
            <DialogDescription>
              Provide specific feedback to the engineer outlining what needs to be
              improved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <textarea
              className="min-h-[100px] w-full rounded-md border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Please expand on your cloud deployment experience and specify major projects..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!feedback.trim() || actionLoading}
              onClick={() => handleStatusChange("review_changes", feedback)}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
