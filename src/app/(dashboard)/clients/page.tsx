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
import { Building2, Plus, Globe, Loader2 } from "lucide-react";
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

  useEffect(() => {
    fetchClients();
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
        fetchClients();
      } else {
        toast.error(data.error?.message || "Failed to create client");
      }
    } catch {
      toast.error("Network error while creating client");
    } finally {
      setIsSubmitting(false);
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
        <Button className="shadow-xs gap-2" onClick={() => setDialogOpen(true)}>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                      <TableCell className="font-semibold">{client.post_title}</TableCell>
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
                className="shadow-xs font-semibold"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
