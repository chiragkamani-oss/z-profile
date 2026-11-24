"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/layout/page-title";
import { formatDate } from "@/lib/utils";
import {
  Users,
  CheckCircle2,
  Clock,
  FileEdit,
  Plus,
  Eye,
  TrendingUp,
  Building2,
  Cpu,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface DashboardData {
  totalProfiles: number;
  readyCount: number;
  inReviewCount: number;
  reviewChangesCount: number;
  draftCount: number;
  clientCount: number;
  userCount: number;
  topSkills: Array<{ name: string; count: number }>;
  recentProfiles: Array<{
    id: string;
    title: string;
    designation: string;
    status: string;
    date: string;
    authorName: string;
    authorEmail: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // Network error
    } finally {
      setIsLoading(false);
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

  const readyPct = data?.totalProfiles
    ? Math.round((data.readyCount / data.totalProfiles) * 100)
    : 0;
  const inReviewPct = data?.totalProfiles
    ? Math.round((data.inReviewCount / data.totalProfiles) * 100)
    : 0;
  const draftPct = data?.totalProfiles
    ? Math.round((data.draftCount / data.totalProfiles) * 100)
    : 0;
  const changesPct = data?.totalProfiles
    ? Math.round((data.reviewChangesCount / data.totalProfiles) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageTitle title="Executive Dashboard" />
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-600/15 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md dark:border-border/80 dark:bg-card dark:bg-none dark:text-foreground dark:shadow-none">
        {/* Subtle decorative glow in dark mode */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl dark:bg-primary/10" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
              Welcome back, {session?.user?.name || "Team Member"}!
            </h1>
            <p className="max-w-xl text-sm text-blue-100 dark:text-muted-foreground">
              Zprofile Talent Management Platform. View your profile status, manage
              enterprise clients, and export client-ready talent portfolios.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/profiles/new">
              <Button className="bg-white font-semibold text-blue-700 shadow-sm hover:bg-blue-50 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Build Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Profiles */}
        <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Profiles
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.totalProfiles ?? 0}</div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Active engineering talent
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ready / Published */}
        <Card className="transition-all hover:border-emerald-500/50 hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Approved / Ready
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data?.readyCount ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {readyPct}% of total profiles ready
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* In Review */}
        <Card className="transition-all hover:border-amber-500/50 hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Review
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {data?.inReviewCount ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Awaiting review verification
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Drafts & In-Progress */}
        <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Drafts & Edits
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileEdit className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.draftCount ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Under engineer authoring
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Status Breakdown & Top Skills */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution Donut & Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-bold">
              <span>Profile Lifecycle Distribution</span>
              <Badge variant="outline" className="text-xs">
                {data?.totalProfiles ?? 0} Total
              </Badge>
            </CardTitle>
            <CardDescription>
              Visual proportion of talent profiles across drafting, review, and
              client-ready status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual SVG Donut Chart + Central Metric */}
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="14"
                    className="text-muted/30"
                  />
                  {/* Ready Segment (Emerald) */}
                  {readyPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeDasharray={`${(readyPct / 100) * 251.2} 251.2`}
                      strokeDashoffset="0"
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  )}
                  {/* In Review Segment (Amber) */}
                  {inReviewPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="14"
                      strokeDasharray={`${(inReviewPct / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${(readyPct / 100) * 251.2}`}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  )}
                  {/* Needs Changes (Red) */}
                  {changesPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="14"
                      strokeDasharray={`${(changesPct / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${((readyPct + inReviewPct) / 100) * 251.2}`}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  )}
                  {/* Draft Segment (Blue) */}
                  {draftPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="14"
                      strokeDasharray={`${(draftPct / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${((readyPct + inReviewPct + changesPct) / 100) * 251.2}`}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  )}
                </svg>
                {/* Donut Center Count */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {data?.totalProfiles ?? 0}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Profiles
                  </span>
                </div>
              </div>

              {/* Legend & Count Details */}
              <div className="grid w-full grid-cols-1 gap-2.5 text-xs">
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Approved / Ready:</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {data?.readyCount ?? 0} ({readyPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">In Review:</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {data?.inReviewCount ?? 0} ({inReviewPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Needs Changes:</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {data?.reviewChangesCount ?? 0} ({changesPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Drafts:</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {data?.draftCount ?? 0} ({draftPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Horizontal Bar Visualizer */}
            <div className="space-y-1.5 border-t border-border/60 pt-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Dossier Readiness Velocity</span>
                <span>{readyPct}% Client Ready</span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  style={{ width: `${readyPct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${inReviewPct}%` }}
                  className="bg-amber-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${changesPct}%` }}
                  className="bg-red-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${draftPct}%` }}
                  className="bg-blue-500 transition-all duration-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Technical Skills Cloud */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-bold">
              <span className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Top Technical Competencies
              </span>
              <Badge variant="secondary" className="text-xs font-medium">
                Top Ranked
              </Badge>
            </CardTitle>
            <CardDescription>
              Most represented technology stacks across active profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-28 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.topSkills || data.topSkills.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No skills recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.topSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, (skill.count / (data.totalProfiles || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {skill.count} profile{skill.count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions Table & Quick Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-bold">
              Recent Profile Activities
            </CardTitle>
            <CardDescription>
              Latest profile submissions and updates from engineers.
            </CardDescription>
          </div>
          <Link href="/profiles">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.recentProfiles || data.recentProfiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No talent profiles found.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {data.recentProfiles.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between gap-2 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profiles/${p.id}`}
                        className="text-sm font-semibold transition-colors hover:text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.designation} • By {p.authorName} ({p.authorEmail})
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatDate(p.date)}
                    </span>
                    <Link href={`/profiles/${p.id}`}>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                        <Eye className="h-3 w-3" />
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
