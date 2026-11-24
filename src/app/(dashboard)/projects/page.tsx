"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  FolderKanban,
  Plus,
  Loader2,
  Eye,
  Edit3,
  Trash2,
  Cloud,
  Layers,
  Building,
  CheckCircle2,
} from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ClientOption {
  ID: string;
  post_title: string;
}

interface ProjectItem {
  ID: string;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_date: string;
  postmeta?: Array<{
    meta_key: string;
    meta_value: string;
  }>;
  author?: {
    display_name: string;
    user_email: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [type, setType] = useState("Web Application");
  const [category, setCategory] = useState("Cloud Native");
  const [cloud, setCloud] = useState("AWS");
  const [solution, setSolution] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [contributions, setContributions] = useState("");

  // View Dialog State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProjectForView, setSelectedProjectForView] =
    useState<ProjectItem | null>(null);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAliasName, setEditAliasName] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editType, setEditType] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCloud, setEditCloud] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [editArchitecture, setEditArchitecture] = useState("");
  const [editResponsibilities, setEditResponsibilities] = useState("");
  const [editContributions, setEditContributions] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success && data.data) {
        setProjects(data.data);
      }
    } catch {
      toast.error("Failed to load corporate projects");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success && data.data) {
        setClients(data.data);
      }
    } catch {
      // Ignored
    }
  };

  const getParsedMeta = (project: ProjectItem) => {
    const meta = project.postmeta?.find((m) => m.meta_key === "projects");
    if (meta?.meta_value) {
      try {
        return JSON.parse(meta.meta_value);
      } catch {
        return {};
      }
    }
    return {};
  };

  const getClientName = (project: ProjectItem) => {
    const parsed = getParsedMeta(project);
    const clientId =
      parsed.client_id ||
      project.postmeta?.find(
        (m) => m.meta_key === "client" || m.meta_key === "_client_id"
      )?.meta_value;

    if (!clientId) return "--";
    const found = clients.find((c) => c.ID === clientId.toString());
    return found ? found.post_title : `Client #${clientId}`;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          alias_name: aliasName,
          clientId: selectedClientId || undefined,
          type,
          category,
          cloud,
          solution,
          architecture,
          responsibilities: responsibilities
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
          contributions: contributions
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Project "${name}" registered successfully!`);
        setAddDialogOpen(false);
        setName("");
        setAliasName("");
        setSelectedClientId("");
        setSolution("");
        setArchitecture("");
        setResponsibilities("");
        setContributions("");
        fetchProjects();
      } else {
        toast.error(data.error?.message || "Failed to create project");
      }
    } catch {
      toast.error("Network error creating project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (project: ProjectItem) => {
    const parsed = getParsedMeta(project);
    setEditingId(project.ID);
    setEditName(project.post_title);
    setEditAliasName(project.post_excerpt || parsed.alias_name || "");
    const clientId =
      parsed.client_id ||
      project.postmeta?.find((m) => m.meta_key === "client")?.meta_value ||
      "";
    setEditClientId(clientId);
    setEditType(parsed.type || "Web Application");
    setEditCategory(parsed.category || "Cloud Native");
    setEditCloud(parsed.cloud || "AWS");
    setEditSolution(project.post_content || parsed.solution || "");
    setEditArchitecture(parsed.architecture || "");
    setEditResponsibilities(
      Array.isArray(parsed.responsibilities) ? parsed.responsibilities.join("\n") : ""
    );
    setEditContributions(
      Array.isArray(parsed.contributions) ? parsed.contributions.join("\n") : ""
    );
    setEditDialogOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/projects/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          alias_name: editAliasName,
          clientId: editClientId || undefined,
          type: editType,
          category: editCategory,
          cloud: editCloud,
          solution: editSolution,
          architecture: editArchitecture,
          responsibilities: editResponsibilities
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
          contributions: editContributions
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Project "${editName}" updated successfully!`);
        setEditDialogOpen(false);
        setEditingId(null);
        fetchProjects();
      } else {
        toast.error(data.error?.message || "Failed to update project");
      }
    } catch {
      toast.error("Network error updating project");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async (id: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete corporate project "${projectName}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Project "${projectName}" deleted successfully`);
        fetchProjects();
      } else {
        toast.error(data.error?.message || "Failed to delete project");
      }
    } catch {
      toast.error("Network error deleting project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Corporate Projects" />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage corporate project catalog, architecture specs, and client links.
          </p>
        </div>
        <Button className="gap-2 shadow-xs" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderKanban className="h-5 w-5 text-primary" />
            Project Catalog Directory
          </CardTitle>
          <CardDescription>
            Verified engineering deliverables and solutions available for client talent
            dossiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Code Name / Alias</TableHead>
                <TableHead>Client Account</TableHead>
                <TableHead>Category & Cloud</TableHead>
                <TableHead>Created</TableHead>
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
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No enterprise projects found. Click "Add Project" to register one.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  const parsed = getParsedMeta(project);
                  return (
                    <TableRow
                      key={project.ID}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-semibold text-foreground">
                        {project.post_title}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {project.post_excerpt || parsed.alias_name || "--"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {getClientName(project)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[11px]">
                            {parsed.category || "Cloud Native"}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-[11px]">
                            <Cloud className="h-2.5 w-2.5" />
                            {parsed.cloud || "AWS"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-xs text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDate(project.post_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setSelectedProjectForView(project);
                              setViewDialogOpen(true);
                            }}
                            title="View Project Specifications"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEdit(project)}
                            title="Edit Project"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === project.ID}
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              handleDeleteProject(project.ID, project.post_title)
                            }
                            title="Delete Project"
                          >
                            {deletingId === project.ID ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Project Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Corporate Project</DialogTitle>
            <DialogDescription>
              Register technical deliverables and specifications to link with engineer
              portfolios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name (As Displayed) *</Label>
                <Input
                  id="projectName"
                  required
                  placeholder="e.g. Distributed Telemetry Pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aliasName">Internal Code Name *</Label>
                <Input
                  id="aliasName"
                  required
                  placeholder="e.g. Project Apollo"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="clientSelect">Client Account</Label>
                <select
                  id="clientSelect"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">-- No Client (Internal) --</option>
                  {clients.map((c) => (
                    <option key={c.ID} value={c.ID}>
                      {c.post_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Cloud Native / Big Data"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloud">Cloud / Infrastructure</Label>
                <Input
                  id="cloud"
                  placeholder="e.g. AWS, GCP, Azure"
                  value={cloud}
                  onChange={(e) => setCloud(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Solution Overview</Label>
              <textarea
                id="solution"
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 text-xs"
                placeholder="High-level solution overview delivered to the client..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="architecture">Technical Architecture</Label>
              <textarea
                id="architecture"
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 text-xs"
                placeholder="System architecture, microservices, databases, messaging queues..."
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsibilities">
                  Key Responsibilities (1 per line)
                </Label>
                <textarea
                  id="responsibilities"
                  className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
                  placeholder="Designed event streaming pipeline&#10;Integrated OAuth 2.0 authentication"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributions">Key Contributions (1 per line)</Label>
                <textarea
                  id="contributions"
                  className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
                  placeholder="Reduced latency by 45%&#10;Zero downtime deployment architecture"
                  value={contributions}
                  onChange={(e) => setContributions(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5 shadow-xs">
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Project Specifications Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FolderKanban className="h-5 w-5 text-primary" />
              {selectedProjectForView?.post_title}
            </DialogTitle>
            <DialogDescription>
              Code Name: {selectedProjectForView?.post_excerpt || "--"} • Client:{" "}
              {selectedProjectForView ? getClientName(selectedProjectForView) : "--"}
            </DialogDescription>
          </DialogHeader>

          {selectedProjectForView && (
            <div className="space-y-4 py-2 text-xs">
              {(() => {
                const parsed = getParsedMeta(selectedProjectForView);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                      <div>
                        <p className="font-semibold uppercase text-muted-foreground">
                          Category
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          {parsed.category || "Cloud Native"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase text-muted-foreground">
                          Cloud Platform
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          {parsed.cloud || "AWS"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase text-muted-foreground">
                          Type
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          {parsed.type || "Web Application"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold uppercase text-muted-foreground">
                        Solution Overview
                      </p>
                      <div className="whitespace-pre-line rounded-lg border border-border/80 bg-card p-3 leading-relaxed text-foreground">
                        {selectedProjectForView.post_content || parsed.solution || "--"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold uppercase text-muted-foreground">
                        Technical Architecture
                      </p>
                      <div className="whitespace-pre-line rounded-lg border border-border/80 bg-card p-3 leading-relaxed text-foreground">
                        {parsed.architecture || "Not specified."}
                      </div>
                    </div>

                    {Array.isArray(parsed.responsibilities) &&
                      parsed.responsibilities.length > 0 && (
                        <div className="space-y-1">
                          <p className="font-semibold uppercase text-muted-foreground">
                            Key Deliverables & Responsibilities
                          </p>
                          <ul className="list-disc space-y-0.5 pl-5 text-foreground">
                            {parsed.responsibilities.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedProjectForView && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const p = selectedProjectForView;
                  setViewDialogOpen(false);
                  handleOpenEdit(p);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Project
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Corporate Project</DialogTitle>
            <DialogDescription>
              Modify specifications and architecture details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProject} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editProjectName">Project Name *</Label>
                <Input
                  id="editProjectName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAliasName">Internal Code Name *</Label>
                <Input
                  id="editAliasName"
                  required
                  value={editAliasName}
                  onChange={(e) => setEditAliasName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="editClientSelect">Client Account</Label>
                <select
                  id="editClientSelect"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                  value={editClientId}
                  onChange={(e) => setEditClientId(e.target.value)}
                >
                  <option value="">-- No Client (Internal) --</option>
                  {clients.map((c) => (
                    <option key={c.ID} value={c.ID}>
                      {c.post_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCategory">Category</Label>
                <Input
                  id="editCategory"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCloud">Cloud Platform</Label>
                <Input
                  id="editCloud"
                  value={editCloud}
                  onChange={(e) => setEditCloud(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSolution">Solution Overview</Label>
              <textarea
                id="editSolution"
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 text-xs"
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editArchitecture">Technical Architecture</Label>
              <textarea
                id="editArchitecture"
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 text-xs"
                value={editArchitecture}
                onChange={(e) => setEditArchitecture(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editResponsibilities">
                  Key Responsibilities (1 per line)
                </Label>
                <textarea
                  id="editResponsibilities"
                  className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
                  value={editResponsibilities}
                  onChange={(e) => setEditResponsibilities(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editContributions">Key Contributions (1 per line)</Label>
                <textarea
                  id="editContributions"
                  className="min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
                  value={editContributions}
                  onChange={(e) => setEditContributions(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="gap-1.5 shadow-xs">
                {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
