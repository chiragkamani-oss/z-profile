"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, Lock, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  registered: string;
  canShareProfile: boolean;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.data) {
        setUsers(data.data);
      } else {
        setError(data.error?.message || "Failed to load users");
      }
    } catch {
      setError("Network error while loading users");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return <Badge variant="destructive">Administrator</Badge>;
      case "manager":
        return <Badge variant="warning">Manager</Badge>;
      case "partner":
        return <Badge variant="secondary">Partner</Badge>;
      default:
        return <Badge variant="outline">Engineer</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin & Role Management</h1>
        <p className="text-muted-foreground">
          View all system users, security roles, and permissions mapped from MySQL
          database.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RBAC Security Policy</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">Strict Data Isolation</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Engineers & Partners strictly restricted to their own author IDs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentication Engine</CardTitle>
            <Lock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">WordPress phpass & bcrypt</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Constant-time hash comparison prevents timing side-channel attacks.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length || "--"}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Directly synced from wp_users
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Directory & Role Mapping</CardTitle>
          <CardDescription>
            Lists accounts with their active capabilities from <code>wp_usermeta</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Can Share / Export</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading user records...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">#{u.id}</TableCell>
                    <TableCell className="font-semibold">{u.displayName}</TableCell>
                    <TableCell className="font-mono text-xs">{u.username}</TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.canShareProfile || u.role === "administrator" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Disabled
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatDate(u.registered)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
