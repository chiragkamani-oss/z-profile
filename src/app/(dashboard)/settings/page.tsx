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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldCheck,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  Sliders,
  Plus,
  Trash2,
  Save,
  Loader2,
  Award,
  Layers,
  GraduationCap,
  Briefcase,
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
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // New tag inputs
  const [newLevel, setNewLevel] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSpeciality, setNewSpeciality] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newDegree, setNewDegree] = useState("");
  const [newCourse, setNewCourse] = useState("");

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
    setIsSavingConfig(true);
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
    } finally {
      setIsSavingConfig(false);
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
      default:
        return <Badge variant="outline">Engineer</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Admin & Configuration" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Administration</h1>
        <p className="text-muted-foreground">
          Manage system users, access roles, and master profile taxonomies.
        </p>
      </div>

      <Tabs defaultValue="rbac" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rbac" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            User Accounts & RBAC
          </TabsTrigger>
          <TabsTrigger value="taxonomies" className="gap-2">
            <Sliders className="h-4 w-4" />
            Master Taxonomies Config
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: User Accounts & RBAC */}
        <TabsContent value="rbac" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  RBAC Security Policy
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Authentication Engine
                </CardTitle>
                <Lock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">Multi-Format Password Hasher</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bcrypt, WordPress phpass, and MD5 verified with constant-time equality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Registered Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length || "--"}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active directory accounts
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Directory & Role Mapping</CardTitle>
              <CardDescription>
                Lists all registered accounts and assigned role privileges.
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
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
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
    </div>
  );
}
