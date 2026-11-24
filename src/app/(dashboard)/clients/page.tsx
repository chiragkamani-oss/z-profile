"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Plus,
  Globe,
  Loader2,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ClientItem {
  ID: string;
  post_title: string;
  post_content: string;
  post_date: string;
  postmeta?: Array<{
    meta_key: string;
    meta_value: string;
  }>;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // View & Edit Modal States
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<ClientItem | null>(
    null
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success && data.data) {
        setClients(data.data);
      }
    } catch {
      toast.error("Failed to load client accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industry,
          website: website || undefined,
          description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Client account "${name}" created successfully!`);
        setDialogOpen(false);
        setName("");
        setIndustry("");
        setWebsite("");
        setDescription("");
        void fetchClients();
      } else {
        toast.error(data.error?.message || "Failed to create client");
      }
    } catch {
      toast.error("Network error while creating client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (client: ClientItem) => {
    setEditingId(client.ID);
    setEditName(client.post_title);
    setEditIndustry(
      getMeta(client, "industry") === "--" ? "" : getMeta(client, "industry")
    );
    const web = getMeta(client, "website");
    setEditWebsite(web === "--" ? "" : web);
    setEditDescription(client.post_content || "");
    setEditDialogOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/clients/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          industry: editIndustry,
          website: editWebsite || undefined,
          description: editDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Client "${editName}" updated successfully!`);
        setEditDialogOpen(false);
        setEditingId(null);
        void fetchClients();
      } else {
        toast.error(data.error?.message || "Failed to update client");
      }
    } catch {
      toast.error("Network error updating client");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete client account "${clientName}"?`)) {
      return;
    }
    setDeletingId(id);

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Client "${clientName}" deleted successfully`);
        void fetchClients();
      } else {
        toast.error(data.error?.message || "Failed to delete client");
      }
    } catch {
      toast.error("Network error deleting client");
    } finally {
      setDeletingId(null);
    }
  };

  const getMeta = (client: ClientItem, key: string) => {
    return client.postmeta?.find((m) => m.meta_key === key)?.meta_value || "--";
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Enterprise Clients" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients Directory</h1>
          <p className="text-muted-foreground">
            Manage enterprise client accounts and project assignments.
          </p>
        </div>
        <Button className="gap-2 shadow-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Active Client Accounts
          </CardTitle>
          <CardDescription>
            Accounts linked to engineer project portfolios and client aliases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No clients found. Click "Add Client" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => {
                  const web = getMeta(client, "website");
                  return (
                    <TableRow
                      key={client.ID}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-semibold text-foreground">
                        {client.post_title}
                      </TableCell>
                      <TableCell>{getMeta(client, "industry")}</TableCell>
                      <TableCell>
                        {web && web !== "--" ? (
                          <a
                            href={web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            {web.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          "--"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {client.post_content || "--"}
                      </TableCell>
                      <TableCell
                        className="text-xs text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDate(client.post_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setSelectedClientForView(client);
                              setViewDialogOpen(true);
                            }}
                            title="View Client Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEdit(client)}
                            title="Edit Client"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === client.ID}
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              handleDeleteClient(client.ID, client.post_title)
                            }
                            title="Delete Client"
                          >
                            {deletingId === client.ID ? (
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

      {/* Add Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Enterprise Client</DialogTitle>
            <DialogDescription>
              Enter the client company information to link with engineer project profiles.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  required
                  placeholder="e.g. Acme Health Technologies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g. FinTech / Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="min-h-[80px] w-full rounded-lg border border-input bg-transparent p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Overview of the client account..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-semibold shadow-xs"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedClientForView?.post_title}
            </DialogTitle>
            <DialogDescription>Enterprise Client Account Details</DialogDescription>
          </DialogHeader>

          {selectedClientForView && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/80 bg-muted/20 p-4 text-xs">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Industry / Vertical
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {getMeta(selectedClientForView, "industry")}
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Official Website
                  </p>
                  <div className="mt-1">
                    {getMeta(selectedClientForView, "website") !== "--" ? (
                      <a
                        href={getMeta(selectedClientForView, "website")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {getMeta(selectedClientForView, "website").replace(
                          /^https?:\/\//,
                          ""
                        )}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Client Profile & Background Context
                </p>
                <div className="whitespace-pre-line rounded-lg border border-border/80 bg-card p-4 text-sm leading-relaxed text-foreground">
                  {selectedClientForView.post_content ||
                    "No background description provided for this client account."}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>Client ID: #{selectedClientForView.ID}</span>
                <span suppressHydrationWarning>
                  Created: {formatDate(selectedClientForView.post_date)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedClientForView && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const client = selectedClientForView;
                  setViewDialogOpen(false);
                  handleOpenEdit(client);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Client
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Account Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Client Account
            </DialogTitle>
            <DialogDescription>
              Update information for this enterprise client account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateClient}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editName">Client Name *</Label>
                <Input
                  id="editName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editIndustry">Industry</Label>
                  <Input
                    id="editIndustry"
                    placeholder="e.g. FinTech / Healthcare"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editWebsite">Website URL</Label>
                  <Input
                    id="editWebsite"
                    type="url"
                    placeholder="https://example.com"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <textarea
                  id="editDescription"
                  className="min-h-[100px] w-full rounded-lg border border-input bg-transparent p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Overview of the client account..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="font-semibold shadow-xs"
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
