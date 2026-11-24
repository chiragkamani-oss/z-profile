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
  Share2,
  Briefcase,
  Award,
  FileText,
  Building,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PageTitle } from "@/components/layout/page-title";

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
        if (status === "is_ready") {
          toast.success("Profile approved and marked ready for clients!");
        } else if (status === "in_review") {
          toast.success("Profile submitted for manager review!");
        } else if (status === "review_changes") {
          toast.warning("Change request sent with feedback to the engineer.");
        }
        fetchProfile();
      } else {
        toast.error(data.error?.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "is_ready":
      case "publish":
        return <Badge variant="success">Ready / Approved</Badge>;
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
      <PageTitle title={profile?.post_title || "Talent Dossier"} />
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link href="/profiles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF
          </Button>

          {/* Engineer Actions */}
          {isEngineerOrPartner &&
            (profile.post_status === "in_draft" ||
              profile.post_status === "review_changes") && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handleStatusChange("in_review")}
                className="shadow-xs gap-2"
              >
                <Send className="h-3.5 w-3.5" />
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
                  className="shadow-xs gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Profile
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={actionLoading}
                onClick={() => setFeedbackDialogOpen(true)}
                className="shadow-xs gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Request Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Printable Executive Portfolio Card */}
      <Card className="border border-border bg-card shadow-sm print:border-none print:shadow-none">
        {/* Print Brand Header (Visible only in print) */}
        <div className="mb-6 hidden items-center justify-between border-b border-slate-300 pb-6 print:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl font-extrabold text-white">
              Z
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                ZYMR, INC.
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Enterprise Cloud & Talent Engineering Solutions
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Confidential Talent Dossier</p>
            <p suppressHydrationWarning>{formatDate(new Date())}</p>
          </div>
        </div>

        <CardHeader className="space-y-3 border-b border-border/60 pb-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {profile.post_title}
              </CardTitle>
              <CardDescription className="text-base font-semibold text-primary">
                {parsedData.designation || profile.post_excerpt || "Software Engineer"}
              </CardDescription>
            </div>
            <div className="no-print shrink-0">{getStatusBadge(profile.post_status)}</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              {parsedData.experienceYears !== undefined
                ? `${parsedData.experienceYears} Years Total Experience`
                : "Experience not specified"}
            </span>
            <span>•</span>
            <span suppressHydrationWarning>
              Profile Date: {formatDate(profile.post_date)}
            </span>
            {isAdminOrManager && parsedData.aliasName && (
              <>
                <span>•</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Internal Client Alias: {parsedData.aliasName}
                </span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Professional Summary */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Executive Profile Summary
            </h3>
            <div className="whitespace-pre-line rounded-xl border border-border/80 bg-muted/20 p-5 text-sm font-normal leading-relaxed text-foreground">
              {profile.post_content ||
                "Accomplished software engineering professional with proven expertise in building modern, scalable cloud platforms, distributed services, and enterprise web applications."}
            </div>
          </div>

          {/* Technical Competencies & Skills */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Award className="h-4 w-4 text-primary" />
              Core Technical Competencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {parsedData.skills && parsedData.skills.length > 0 ? (
                parsedData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="shadow-2xs inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific skills listed.
                </p>
              )}
            </div>
          </div>

          {/* Engagement Overview Card */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Building className="h-4 w-4 text-primary" />
              Organizational Details
            </h3>
            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Author</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {profile.author?.display_name || "Zymr Engineer"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact Email</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {profile.author?.user_email || "--"}
                </p>
              </div>
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
              Provide specific feedback to the engineer outlining required additions or
              revisions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-input bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Please expand on your cloud architecture experience with AWS and specify recent project deliverables..."
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
