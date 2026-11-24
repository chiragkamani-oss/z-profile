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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  CheckCircle2,
  XCircle,
  Sliders,
  Plus,
  Trash2,
  Loader2,
  Award,
  Layers,
  GraduationCap,
  Briefcase,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageTitle } from "@/components/layout/page-title";
import { toast } from "sonner";
import { TaxonomyConfig } from "@/server/services/config.service";

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

  // Config State
  const [config, setConfig] = useState<TaxonomyConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // New tag inputs
  const [newLevel, setNewLevel] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSpeciality, setNewSpeciality] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newDegree, setNewDegree] = useState("");
  const [newCourse, setNewCourse] = useState("");

  // User Management Modals
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("engineer");
  const [newUserCanShare, setNewUserCanShare] = useState(false);

  // Edit User State
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserError, setEditUserError] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState("engineer");
  const [editUserCanShare, setEditUserCanShare] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Delete User State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchConfig();
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    setAddUserError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          displayName: newDisplayName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          canShareProfile: newUserCanShare,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User "${newUsername}" created successfully!`);
        setAddUserOpen(false);
        setAddUserError("");
        setNewUsername("");
        setNewDisplayName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("engineer");
        setNewUserCanShare(false);
        fetchUsers();
      } else {
        const errorMsg = data.error?.message || "Failed to create user";
        setAddUserError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const netError = "Network error while creating user";
      setAddUserError(netError);
      toast.error(netError);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const openEditUser = (user: UserItem) => {
    setEditingUserId(user.id);
    setEditDisplayName(user.displayName);
    setEditUserEmail(user.email);
    setEditUserPassword("");
    setEditUserRole(user.role);
    setEditUserCanShare(user.canShareProfile);
    setEditUserError("");
    setEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setIsUpdatingUser(true);
    setEditUserError("");
    try {
      const payload: Record<string, unknown> = {
        displayName: editDisplayName,
        email: editUserEmail,
        role: editUserRole,
        canShareProfile: editUserCanShare,
      };
      if (editUserPassword.trim()) {
        payload.password = editUserPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User account updated successfully!");
        setEditUserError("");
        setEditUserOpen(false);
        fetchUsers();
      } else {
        const errorMsg = data.error?.message || "Failed to update user";
        setEditUserError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const netError = "Network error while updating user";
      setEditUserError(netError);
      toast.error(netError);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const openDeleteConfirm = (user: UserItem) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User "${userToDelete.displayName}" deleted successfully.`);
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error(data.error?.message || "Failed to delete user");
      }
    } catch {
      toast.error("Network error while deleting user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch {
      toast.error("Failed to load master taxonomies");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveConfig = async (updatedConfig: TaxonomyConfig) => {
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
        toast.success("Master taxonomies saved successfully!");
      } else {
        toast.error(data.error?.message || "Failed to save taxonomies");
      }
    } catch {
      toast.error("Network error saving taxonomies");
    }
  };

  const addTag = (
    section:
      | "levels"
      | "core_responsibility"
      | "speciality"
      | "domains"
      | "tools"
      | "degrees"
      | "courses",
    val: string,
    clearFn: (s: string) => void
  ) => {
    if (!config || !val.trim()) return;
    const clean = val.trim();

    const updated = { ...config };
    if (
      section === "levels" ||
      section === "core_responsibility" ||
      section === "speciality"
    ) {
      if (!updated.designation[section].includes(clean)) {
        updated.designation[section] = [...updated.designation[section], clean];
      }
    } else if (section === "domains") {
      if (!updated.domains.includes(clean)) updated.domains = [...updated.domains, clean];
    } else if (section === "tools") {
      if (!updated.tools.includes(clean)) updated.tools = [...updated.tools, clean];
    } else if (section === "degrees") {
      if (!updated.education.degrees.includes(clean)) {
        updated.education.degrees = [...updated.education.degrees, clean];
      }
    } else if (section === "courses") {
      if (!updated.education.courses.includes(clean)) {
        updated.education.courses = [...updated.education.courses, clean];
      }
    }

    clearFn("");
    handleSaveConfig(updated);
  };

  const removeTag = (
    section:
      | "levels"
      | "core_responsibility"
      | "speciality"
      | "domains"
      | "tools"
      | "degrees"
      | "courses",
    item: string
  ) => {
    if (!config) return;
    const updated = { ...config };

    if (
      section === "levels" ||
      section === "core_responsibility" ||
      section === "speciality"
    ) {
      updated.designation[section] = updated.designation[section].filter(
        (i) => i !== item
      );
    } else if (section === "domains") {
      updated.domains = updated.domains.filter((i) => i !== item);
    } else if (section === "tools") {
      updated.tools = updated.tools.filter((i) => i !== item);
    } else if (section === "degrees") {
      updated.education.degrees = updated.education.degrees.filter((i) => i !== item);
    } else if (section === "courses") {
      updated.education.courses = updated.education.courses.filter((i) => i !== item);
    }

    handleSaveConfig(updated);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return <Badge variant="destructive">Administrator</Badge>;
      case "manager":
        return <Badge variant="warning">Manager</Badge>;
      case "partner":
        return <Badge variant="secondary">Partner</Badge>;
      case "sales-person":
        return (
          <Badge className="border-purple-200 bg-purple-100 text-purple-800">
            Sales Person
          </Badge>
        );
      default:
        return <Badge variant="outline">Engineer</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Enterprise Configuration" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings & RBAC</h1>
        <p className="text-muted-foreground">
          Manage user accounts, role-based access permissions, and master taxonomy
          configurations.
        </p>
      </div>

      <Tabs defaultValue="rbac" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rbac" className="gap-2">
            <Users className="h-4 w-4" />
            User Accounts & RBAC
          </TabsTrigger>
          <TabsTrigger value="taxonomies" className="gap-2">
            <Sliders className="h-4 w-4" />
            Master Taxonomies Config
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: User Accounts & RBAC */}
        <TabsContent value="rbac" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="text-lg">User Directory & Role Mapping</CardTitle>
                  <CardDescription>
                    Manage enterprise user accounts, assigned roles, and access privileges
                    ({users.length} registered accounts).
                  </CardDescription>
                </div>
                <Button className="gap-2 shadow-xs" onClick={() => setAddUserOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </div>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:text-primary"
                              onClick={() => openEditUser(u)}
                              title="Edit User Account"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => openDeleteConfirm(u)}
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Master Taxonomies Configuration */}
        <TabsContent value="taxonomies" className="space-y-6">
          {configLoading || !config ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Designation Taxonomies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Designation Hierarchy Taxonomies (_config_designation)
                  </CardTitle>
                  <CardDescription>
                    Configure Level, Core Responsibility, and Speciality values.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Levels */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Seniority Levels
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {config.designation.levels.map((lvl) => (
                        <Badge key={lvl} variant="secondary" className="gap-1.5 pl-2.5">
                          {lvl}
                          <button
                            onClick={() => removeTag("levels", lvl)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex max-w-sm items-center gap-2 pt-1">
                      <Input
                        placeholder="Add level (e.g. Lead, Principal)..."
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTag("levels", newLevel, setNewLevel)}
                        className="h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Core Responsibilities */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Core Responsibilities
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {config.designation.core_responsibility.map((role) => (
                        <Badge key={role} variant="secondary" className="gap-1.5 pl-2.5">
                          {role}
                          <button
                            onClick={() => removeTag("core_responsibility", role)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex max-w-sm items-center gap-2 pt-1">
                      <Input
                        placeholder="Add core role (e.g. Cloud Architect)..."
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTag("core_responsibility", newRole, setNewRole)}
                        className="h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Specialities */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Speciality Tracks
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {config.designation.speciality.map((sp) => (
                        <Badge key={sp} variant="secondary" className="gap-1.5 pl-2.5">
                          {sp}
                          <button
                            onClick={() => removeTag("speciality", sp)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex max-w-sm items-center gap-2 pt-1">
                      <Input
                        placeholder="Add speciality track..."
                        value={newSpeciality}
                        onChange={(e) => setNewSpeciality(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addTag("speciality", newSpeciality, setNewSpeciality)
                        }
                        className="h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domain & Industries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-primary" />
                    Domain Skills & Markets (_config_domain_skills)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {config.domains.map((dom) => (
                      <Badge
                        key={dom}
                        variant="outline"
                        className="gap-1.5 bg-muted/40 pl-2.5"
                      >
                        {dom}
                        <button
                          onClick={() => removeTag("domains", dom)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex max-w-sm items-center gap-2">
                    <Input
                      placeholder="Add domain market (e.g. EdTech)..."
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTag("domains", newDomain, setNewDomain)}
                      className="h-8"
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dev Tools & Platforms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-primary" />
                    Development Tools & Methodologies (_config_development_tools)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {config.tools.map((tl) => (
                      <Badge
                        key={tl}
                        variant="outline"
                        className="gap-1.5 bg-muted/40 pl-2.5"
                      >
                        {tl}
                        <button
                          onClick={() => removeTag("tools", tl)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex max-w-sm items-center gap-2">
                    <Input
                      placeholder="Add dev tool (e.g. Helm, Kafka)..."
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTag("tools", newTool, setNewTool)}
                      className="h-8"
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Education Degrees & Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Education Degrees & Courses (_config_education)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Recognized Degrees
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {config.education.degrees.map((deg) => (
                        <Badge key={deg} variant="secondary" className="gap-1.5 pl-2.5">
                          {deg}
                          <button
                            onClick={() => removeTag("degrees", deg)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex max-w-sm items-center gap-2 pt-1">
                      <Input
                        placeholder="Add degree title..."
                        value={newDegree}
                        onChange={(e) => setNewDegree(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTag("degrees", newDegree, setNewDegree)}
                        className="h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Courses & Disciplines
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {config.education.courses.map((crs) => (
                        <Badge key={crs} variant="secondary" className="gap-1.5 pl-2.5">
                          {crs}
                          <button
                            onClick={() => removeTag("courses", crs)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex max-w-sm items-center gap-2 pt-1">
                      <Input
                        placeholder="Add course/discipline..."
                        value={newCourse}
                        onChange={(e) => setNewCourse(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTag("courses", newCourse, setNewCourse)}
                        className="h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Add New User Account
            </DialogTitle>
            <DialogDescription>
              Create a new user account with assigned RBAC system privileges.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            {addUserError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}
            {addUserError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newUsername">Username *</Label>
              <Input
                id="newUsername"
                required
                placeholder="e.g. john.doe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newDisplayName">Full Display Name *</Label>
              <Input
                id="newDisplayName"
                required
                placeholder="e.g. John Doe"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserEmail">Corporate Email *</Label>
              <Input
                id="newUserEmail"
                type="email"
                required
                placeholder="john.doe@zymr.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserPassword">Initial Password *</Label>
              <Input
                id="newUserPassword"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserRole">System Role *</Label>
              <select
                id="newUserRole"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="engineer">
                  Engineer (Self-service profile authoring)
                </option>
                <option value="manager">Manager (Profile review & approval)</option>
                <option value="partner">Partner (Consultant profile access)</option>
                <option value="sales-person">
                  Sales Person (Client sharing & PDF export)
                </option>
                <option value="administrator">Administrator (Full system control)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="newUserCanShare"
                checked={newUserCanShare}
                onChange={(e) => setNewUserCanShare(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="newUserCanShare" className="text-xs text-muted-foreground">
                Grant client portfolio sharing & export capabilities (`share_zpp_profile`)
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddUserOpen(false)}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingUser}>
                {isSubmittingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit User Account
            </DialogTitle>
            <DialogDescription>
              Update display name, email, role, or reset account password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {editUserError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{editUserError}</span>
              </div>
            )}
            {editUserError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{editUserError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Display Name *</Label>
              <Input
                id="editDisplayName"
                required
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserEmail">Email Address *</Label>
              <Input
                id="editUserEmail"
                type="email"
                required
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserPassword">
                New Password (leave blank to keep current)
              </Label>
              <Input
                id="editUserPassword"
                type="password"
                placeholder="Enter new password if changing"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserRole">System Role</Label>
              <select
                id="editUserRole"
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="engineer">Engineer</option>
                <option value="manager">Manager</option>
                <option value="partner">Partner</option>
                <option value="sales-person">Sales Person</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="editUserCanShare"
                checked={editUserCanShare}
                onChange={(e) => setEditUserCanShare(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="editUserCanShare" className="text-xs text-muted-foreground">
                Grant client portfolio sharing & export capabilities (`share_zpp_profile`)
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUserOpen(false)}
                disabled={isUpdatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingUser}>
                {isUpdatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirm User Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete user account{" "}
              <strong>{userToDelete?.displayName}</strong> (@{userToDelete?.username})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeletingUser}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
