"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, Sparkles, Filter, Loader2, Copy } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PageTitle } from "@/components/layout/page-title";

interface ProfileItem {
  ID: string;
  post_title: string;
  post_excerpt: string;
  post_status: string;
  post_date: string;
  author?: {
    display_name: string;
    user_email: string;
  };
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [statusFilter]);

  const fetchProfiles = async (searchTerm = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/profiles${queryString}`);
      const data = await res.json();
      if (data.success && data.data) {
        setProfiles(data.data);
      } else {
        toast.error("Failed to load profiles");
      }
    } catch {
      toast.error("Network error loading profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles(search);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/profiles/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Profile duplicated as "${data.data.post_title}"!`);
        fetchProfiles(search);
      } else {
        toast.error(data.error?.message || "Failed to duplicate profile");
      }
    } catch {
      toast.error("Network error while duplicating profile");
    } finally {
      setDuplicatingId(null);
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

  return (
    <div className="space-y-6">
      <PageTitle title="Talent Directory" />
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span>Talent Profile Directory</span>
            <Sparkles className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, manage, review, and export engineer portfolios.
          </p>
        </div>
        <Link href="/profiles/new">
          <Button className="gap-2 font-semibold shadow-xs">
            <Plus className="h-4 w-4" />
            Build Profile
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs md:flex-row">
        <form onSubmit={handleSearch} className="flex w-full flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, skills, bio, or engineer name..."
              className="bg-background/50 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" className="shrink-0 font-medium">
            Search
          </Button>
        </form>

        {/* Status Filter Buttons */}
        <div className="flex w-full shrink-0 items-center gap-1.5 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <Filter className="ml-1 mr-0.5 hidden h-3.5 w-3.5 text-muted-foreground lg:block" />
          {[
            { label: "All", value: "all" },
            { label: "Ready", value: "is_ready" },
            { label: "In Review", value: "in_review" },
            { label: "Drafts", value: "in_draft" },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%]">Profile Title</TableHead>
              <TableHead>Primary Designation</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No talent profiles match your current filter.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow
                  key={profile.ID}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="font-semibold text-foreground">
                    <Link
                      href={`/profiles/${profile.ID}`}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {profile.post_title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {profile.post_excerpt || "--"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium">
                      {profile.author?.display_name || "--"}
                    </span>
                    {profile.author?.user_email && (
                      <span className="block text-[11px] text-muted-foreground">
                        {profile.author.user_email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(profile.post_status)}</TableCell>
                  <TableCell
                    className="text-xs text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {formatDate(profile.post_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/profiles/${profile.ID}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={duplicatingId === profile.ID}
                        onClick={() => handleDuplicate(profile.ID)}
                        className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
                        title="Duplicate Profile"
                      >
                        {duplicatingId === profile.ID ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        Clone
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
