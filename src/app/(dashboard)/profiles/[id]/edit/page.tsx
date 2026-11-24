"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FolderGit2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  User,
  X,
  HelpCircle,
  Save,
  Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageTitle } from "@/components/layout/page-title";

interface ProjectItem {
  id: string;
  name: string;
  role: string;
  description: string;
  technologies: string;
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

const POPULAR_SKILLS = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Go",
  "AWS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "GraphQL",
  "Microservices",
];

const STEPS = [
  { id: 1, label: "Overview", icon: User, desc: "Basic Info & Bio" },
  { id: 2, label: "Skills", icon: Layers, desc: "Competencies" },
  { id: 3, label: "Projects", icon: FolderGit2, desc: "Client Experience" },
  { id: 4, label: "Credentials", icon: GraduationCap, desc: "Education & Certs" },
  { id: 5, label: "Review", icon: FileText, desc: "Final Dossier" },
];

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Basic Information
  const [title, setTitle] = useState("");
  const [designation, setDesignation] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [aliasName, setAliasName] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Skills
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Step 3: Projects
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [newProject, setNewProject] = useState<Omit<ProjectItem, "id">>({
    name: "",
    role: "",
    description: "",
    technologies: "",
  });

  // Step 4: Certifications & Education
  const [education, setEducation] = useState("B.Tech in Computer Science & Engineering");
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [newCert, setNewCert] = useState<Omit<CertificationItem, "id">>({
    name: "",
    issuer: "",
    year: "",
  });

  // Missing Config Request Dialog
  const [missingConfigOpen, setMissingConfigOpen] = useState(false);
  const [requestSection, setRequestSection] = useState("Technology Skills");
  const [requestData, setRequestData] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data;
          setTitle(p.post_title || "");
          setDesignation(p.post_excerpt || "");
          setBio(p.post_content || "");

          // Parse metadata
          if (p.postmeta && Array.isArray(p.postmeta)) {
            const dataMeta = p.postmeta.find(
              (m: { meta_key: string }) =>
                m.meta_key === "profile_data" || m.meta_key === "profile"
            );
            if (dataMeta?.meta_value) {
              try {
                const parsed = JSON.parse(dataMeta.meta_value);
                if (parsed.experienceYears) setExperienceYears(parsed.experienceYears);
                if (parsed.skills && Array.isArray(parsed.skills))
                  setSkills(parsed.skills);
                if (parsed.aliasName) setAliasName(parsed.aliasName);
                if (parsed.certifications && Array.isArray(parsed.certifications)) {
                  setCertifications(
                    parsed.certifications.map((c: string, idx: number) => ({
                      id: idx.toString(),
                      name: c,
                      issuer: "Professional Authority",
                      year: "2024",
                    }))
                  );
                }
              } catch {
                // legacy format
              }
            }
          }
        } else {
          toast.error("Failed to load profile details");
        }
      } catch {
        toast.error("Network error while loading profile");
      } finally {
        setInitialLoading(false);
      }
    };

    void fetchProfile();
  }, [id]);

  const addSkill = (skillToAdd?: string) => {
    const target = (skillToAdd || skillInput).trim();
    if (target && !skills.includes(target)) {
      setSkills([...skills, target]);
      if (!skillToAdd) setSkillInput("");
      toast.info(`Added skill: ${target}`);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddProject = () => {
    if (!newProject.name.trim() || !newProject.role.trim()) {
      toast.error("Please enter at least Project Name and Role");
      return;
    }
    setProjects([
      ...projects,
      {
        ...newProject,
        id: Date.now().toString(),
      },
    ]);
    setNewProject({ name: "", role: "", description: "", technologies: "" });
    toast.success("Project highlight added!");
  };

  const removeProject = (projId: string) => {
    setProjects(projects.filter((p) => p.id !== projId));
  };

  const handleAddCert = () => {
    if (!newCert.name.trim()) {
      toast.error("Please enter the certification name");
      return;
    }
    setCertifications([
      ...certifications,
      {
        ...newCert,
        id: Date.now().toString(),
      },
    ]);
    setNewCert({ name: "", issuer: "", year: "" });
    toast.success("Certification added!");
  };

  const removeCert = (certId: string) => {
    setCertifications(certifications.filter((c) => c.id !== certId));
  };

  const handleSendMissingConfigRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.trim()) return;
    setSendingRequest(true);
    try {
      const res = await fetch("/api/config/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: requestSection,
          requestedData: requestData.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          "Request sent to administrator! They will review and update master taxonomies."
        );
        setMissingConfigOpen(false);
        setRequestData("");
      } else {
        toast.error(data.error?.message || "Failed to submit request");
      }
    } catch {
      toast.error("Network error while submitting metadata request");
    } finally {
      setSendingRequest(false);
    }
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        toast.error("Profile Title or Full Name is required");
        return false;
      }
      if (!designation.trim()) {
        toast.error("Primary Designation is required");
        return false;
      }
      if (experienceYears < 0) {
        toast.error("Experience years must be 0 or greater");
        return false;
      }
    } else if (currentStep === 2) {
      if (skills.length === 0) {
        toast.error("Please add at least one core technical skill");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async (status: "in_draft" | "in_review") => {
    setIsLoading(true);
    try {
      const certNames = certifications.map((c) => c.name);
      const res = await fetch(`/api/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          designation,
          experienceYears: Number(experienceYears),
          bio: bio || "Senior engineering professional at Zymr.",
          skills,
          certifications: certNames,
          aliasName: aliasName || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || "Failed to update profile");
      } else {
        if (status === "in_review") {
          await fetch(`/api/profiles/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "in_review" }),
          });
          toast.success("Talent Dossier updated & submitted for Review!");
        } else {
          toast.success("Profile updates saved as Draft!");
        }

        router.push(`/profiles/${id}`);
        router.refresh();
      }
    } catch {
      toast.error("Network error updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <PageTitle title="Edit Profile Dossier" />

      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link href={`/profiles/${id}`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <span>Edit Talent Profile</span>
              <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground">
              Modify engineering qualifications, client project highlights, and technical
              competencies.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setMissingConfigOpen(true)}
          className="gap-2 text-xs"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Request Missing Option
        </Button>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                type="button"
                key={step.id}
                className="font-inherit z-10 flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-inherit"
                onClick={() => {
                  if (step.id < currentStep || validateCurrentStep()) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : isCurrent
                        ? "border-primary bg-background text-primary ring-4 ring-primary/20"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrent ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="hidden text-[10px] text-muted-foreground sm:block">
                    {step.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="absolute left-0 top-5 -z-0 h-0.5 w-full bg-border" />
        <div
          className="absolute left-0 top-5 -z-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* STEP 1: Overview */}
      {currentStep === 1 && (
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Overview & Professional Identity</CardTitle>
            <CardDescription>
              Basic bio, official title, and client presentation alias.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Full Name or Profile Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Rahul Sharma"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Primary Designation *</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Lead Full Stack Architect"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears">Total Years of Experience *</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasName">Client Anonymized Alias (Optional)</Label>
                <Input
                  id="aliasName"
                  placeholder="e.g. RS-Cloud-Lead"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Executive Summary & Bio</Label>
              <textarea
                id="bio"
                rows={4}
                className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Accomplished cloud and software architect with proven track record in high-concurrency systems..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Skills */}
      {currentStep === 2 && (
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Core Technical Competencies</CardTitle>
            <CardDescription>
              List programming languages, cloud platforms, databases, and frameworks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input
                placeholder="Type a skill and press Enter (e.g. Kubernetes, Terraform)..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" onClick={() => addSkill()}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Assigned Technical Skills ({skills.length})
              </Label>
              <div className="flex min-h-[60px] flex-wrap gap-2 rounded-lg border border-border bg-muted/20 p-3">
                {skills.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No skills added yet. Select from below or type above.
                  </span>
                ) : (
                  skills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Suggested Competencies
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer gap-1 transition-colors hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addSkill(skill)}
                  >
                    <Plus className="h-3 w-3" /> {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Projects */}
      {currentStep === 3 && (
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Client Project Highlights</CardTitle>
            <CardDescription>
              Enterprise project accomplishments, architecture contributions, and
              deliverables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Add New Project Highlight</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Project Name (e.g. Next-Gen FinTech Portal)"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
                <Input
                  placeholder="Your Role (e.g. Lead Architect)"
                  value={newProject.role}
                  onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                />
              </div>
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Description of system architecture and client impact..."
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
              <Input
                placeholder="Tech Stack (e.g. React, Node.js, AWS, Redis)"
                value={newProject.technologies}
                onChange={(e) =>
                  setNewProject({ ...newProject, technologies: e.target.value })
                }
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddProject}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Highlight
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Added Projects ({projects.length})
              </Label>
              {projects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No projects added yet. Use the form above to add projects.
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="shadow-2xs flex items-start justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{proj.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {proj.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{proj.description}</p>
                      {proj.technologies && (
                        <p className="font-mono text-[11px] text-primary">
                          {proj.technologies}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(proj.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Credentials */}
      {currentStep === 4 && (
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Credentials & Education</CardTitle>
            <CardDescription>
              Academic degrees and professional industry certifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="education">Highest Academic Degree</Label>
              <Input
                id="education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Add Certification</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Certification Name"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                />
                <Input
                  placeholder="Issuing Body (e.g. AWS)"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                />
                <Input
                  placeholder="Year (e.g. 2024)"
                  value={newCert.year}
                  onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                />
              </div>
              <Button type="button" size="sm" onClick={handleAddCert} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Certification
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Certifications ({certifications.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="gap-1.5 px-2.5 py-1 text-xs"
                  >
                    {c.name} {c.issuer && `(${c.issuer})`}
                    <button
                      type="button"
                      onClick={() => removeCert(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Review & Submit */}
      {currentStep === 5 && (
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Review Updated Dossier</CardTitle>
            <CardDescription>
              Verify information before saving updates or submitting for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{title || "Untitled Profile"}</h2>
                  <p className="text-sm font-medium text-primary">{designation}</p>
                </div>
                <Badge variant="secondary">{experienceYears} Years Experience</Badge>
              </div>

              {aliasName && (
                <p className="text-xs text-muted-foreground">
                  <strong>Client Alias:</strong> {aliasName}
                </p>
              )}

              <p className="text-xs text-muted-foreground">{bio}</p>

              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Technical Competencies
                </Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isLoading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex gap-2">
          {currentStep < STEPS.length ? (
            <Button type="button" onClick={nextStep} className="gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleFinalSubmit("in_draft")}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => handleFinalSubmit("in_review")}
                className="gap-2 bg-primary"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit for Review
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Missing Config Notification Dialog */}
      <Dialog open={missingConfigOpen} onOpenChange={setMissingConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Request Missing Option
            </DialogTitle>
            <DialogDescription>
              Can't find a skill, designation, or dev tool? Submit a request to the
              platform administrators to add it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMissingConfigRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestSection">Section / Taxonomy Category</Label>
              <select
                id="requestSection"
                value={requestSection}
                onChange={(e) => setRequestSection(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Technology Skills">Technology Skills</option>
                <option value="Domain Skills">Domain Skills</option>
                <option value="Development Tools">Development Tools</option>
                <option value="Designation Levels">Designation Levels</option>
                <option value="Designation Roles">Designation Roles</option>
                <option value="Speciality Tracks">Speciality Tracks</option>
                <option value="Education Degrees">Education Degrees</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestData">Requested Option / Tag Name *</Label>
              <Input
                id="requestData"
                required
                placeholder="e.g. Apache Pulsar, LangChain, Snowflake"
                value={requestData}
                onChange={(e) => setRequestData(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMissingConfigOpen(false)}
                disabled={sendingRequest}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendingRequest || !requestData.trim()}>
                {sendingRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Request to Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
