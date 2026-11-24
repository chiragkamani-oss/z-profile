"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Loader2,
  Send,
  Share2,
  Copy,
  Briefcase,
  Award,
  FileText,
  Building,
  Check,
  History,
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

interface ShareRecord {
  company_name: string;
  share_by: string;
  date: string;
}

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
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
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState("");

  // Review Feedback Dialog
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Share Dialog State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [sharedBy, setSharedBy] = useState("");
  const [sharedDate, setSharedDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingShare, setSavingShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAuthenticated = sessionStatus === "authenticated" && !!session?.user;
  const user = session?.user;
  const isAdminOrManager = user?.role === "administrator" || user?.role === "manager";
  const isEngineerOrPartner = user?.role === "engineer" || user?.role === "partner";

  useEffect(() => {
    fetchProfile();
    if (isAuthenticated) {
      fetchShareRecords();
      setSharedBy(user?.name || user?.email || "Team Member");
    }
  }, [id, isAuthenticated]);

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

  const fetchShareRecords = async () => {
    try {
      const res = await fetch(`/api/profiles/${id}/share`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setShareRecords(data.data);
      }
    } catch {
      // Ignored
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

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/profiles/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Profile duplicated as "${data.data.post_title}"!`);
        router.push(`/profiles/${data.data.ID}`);
      } else {
        toast.error(data.error?.message || "Failed to duplicate profile");
      }
    } catch {
      toast.error("Network error while duplicating profile");
    } finally {
      setDuplicating(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const publicUrl = `${window.location.origin}/profiles/${id}`;
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Public profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter the client / company name");
      return;
    }

    setSavingShare(true);
    try {
      const res = await fetch(`/api/profiles/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          date: sharedDate,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setShareRecords(data.data);
        setCompanyName("");
        toast.success("Client share record logged successfully!");
      } else {
        toast.error(data.error?.message || "Failed to log share record");
      }
    } catch {
      toast.error("Network error logging share record");
    } finally {
      setSavingShare(false);
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
        {isAuthenticated && (
          <Link href="/profiles">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Profiles
            </Button>
          </Link>
        )}
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
        {isAuthenticated ? (
          <Link href="/profiles">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Profiles
            </Button>
          </Link>
        ) : (
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Zymr Verified Talent Dossier
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                className="gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share with Client
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={duplicating}
                onClick={handleDuplicate}
                className="gap-1.5"
              >
                {duplicating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Duplicate
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Link Copied" : "Copy Dossier URL"}
            </Button>
          )}

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
          {isAuthenticated &&
            isEngineerOrPartner &&
            (profile.post_status === "in_draft" ||
              profile.post_status === "review_changes") && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handleStatusChange("in_review")}
                className="gap-2 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for Review
              </Button>
            )}

          {/* Admin / Manager Review Actions */}
          {isAuthenticated && isAdminOrManager && (
            <>
              {profile.post_status !== "is_ready" && (
                <Button
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange("is_ready")}
                  className="gap-1.5 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
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
                className="gap-1.5 shadow-xs"
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
            {isAuthenticated && (
              <div className="no-print shrink-0">
                {getStatusBadge(profile.post_status)}
              </div>
            )}
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
            {isAuthenticated && isAdminOrManager && parsedData.aliasName && (
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

          {/* Organizational Details */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Building className="h-4 w-4 text-primary" />
              {isAuthenticated ? "Organizational Details" : "Engineering Practice"}
            </h3>
            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Engineering Division</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {isAuthenticated
                    ? profile.author?.display_name || "Zymr Engineer"
                    : "Zymr Cloud & Platform Engineering"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Verification</p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Zymr Certified Portfolio
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Profile With Client Dialog (Legacy popup.php parity) */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              Share Profile With Client
            </DialogTitle>
            <DialogDescription>
              Provide this public link to prospective clients and record sharing audit
              logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Direct Public Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Public Client Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/profiles/${id}`
                      : ""
                  }
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Previous Shares History Table */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Previous Client Shares ({shareRecords.length})
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {shareRecords.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No client shares recorded yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Client Name</TableHead>
                        <TableHead className="text-xs">Shared By</TableHead>
                        <TableHead className="text-xs">Shared Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shareRecords.map((record, index) => (
                        <TableRow key={index} className="text-xs">
                          <TableCell className="font-medium text-foreground">
                            {record.company_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.share_by}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.date}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Add New Share Record Form */}
            <form
              onSubmit={handleSaveShare}
              className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Log New Client Share
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Client Name *</label>
                  <Input
                    required
                    placeholder="e.g. Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Shared By</label>
                  <Input readOnly value={sharedBy} className="h-8 bg-muted/40 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Shared Date</label>
                  <Input
                    type="date"
                    value={sharedDate}
                    onChange={(e) => setSharedDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingShare || !companyName.trim()}
                  className="gap-1.5 text-xs shadow-xs"
                >
                  {savingShare ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  Save & Log Share
                </Button>
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
