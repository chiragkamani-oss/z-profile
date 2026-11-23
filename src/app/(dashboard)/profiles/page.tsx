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
import { Plus, Search, Eye } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async (searchTerm = "") => {
    setIsLoading(true);
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(`/api/profiles${query}`);
      const data = await res.json();
      if (data.success && data.data) {
        setProfiles(data.data);
      }
    } catch {
      // Handle network error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles(search);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Builder</h1>
          <p className="text-muted-foreground">
            Manage and view engineer talent profiles.
          </p>
        </div>
        <Link href="/profiles/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Profile
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills or title..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile Title / Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading profiles...
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No profiles found.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.ID}>
                  <TableCell className="font-medium">{profile.post_title}</TableCell>
                  <TableCell>{profile.post_excerpt || "--"}</TableCell>
                  <TableCell>{profile.author?.display_name || "--"}</TableCell>
                  <TableCell>{getStatusBadge(profile.post_status)}</TableCell>
                  <TableCell>
                    {new Date(profile.post_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/profiles/${profile.ID}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </Link>
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
