"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

export default function NewProfilePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Basic Information
  const [title, setTitle] = useState("");
  const [designation, setDesignation] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [bio, setBio] = useState("");

  // Step 2: Skills
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["TypeScript", "React", "Node.js"]);

  // Step 3: Projects
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: "1",
      name: "Enterprise Cloud Migration",
      role: "Lead Architect",
      description:
        "Architected scalable microservices backend transitioning from legacy monolith to AWS ECS.",
      technologies: "Node.js, Docker, AWS, PostgreSQL",
    },
  ]);
  const [newProject, setNewProject] = useState<Omit<ProjectItem, "id">>({
    name: "",
    role: "",
    description: "",
    technologies: "",
  });

  // Step 4: Certifications & Education
  const [education, setEducation] = useState("B.Tech in Computer Science & Engineering");
  const [certifications, setCertifications] = useState<CertificationItem[]>([
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      year: "2024",
    },
  ]);
  const [newCert, setNewCert] = useState<Omit<CertificationItem, "id">>({
    name: "",
    issuer: "",
    year: "",
  });

  // Skill Handlers
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

  // Project Handlers
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

  const removeProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  // Certification Handlers
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

  const removeCert = (id: string) => {
    setCertifications(certifications.filter((c) => c.id !== id));
  };

  // Step Navigation Validation
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

  // Final Submit
  const handleFinalSubmit = async (status: "in_draft" | "in_review") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          designation,
          experienceYears: Number(experienceYears),
          bio: bio || "Senior engineering professional at Zymr.",
          skills,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || "Failed to create profile");
      } else {
        const profileId = data.data.id;

        // If user submitted directly for review, update status
        if (status === "in_review") {
          await fetch(`/api/profiles/${profileId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "in_review" }),
          });
          toast.success("Talent Dossier submitted for Review!");
        } else {
          toast.success("Profile saved as Draft!");
        }

        router.push("/profiles");
        router.refresh();
      }
    } catch {
      toast.error("Network error while submitting profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Top Header / Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/profiles">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles Directory
          </Button>
        </Link>
        <span className="text-xs font-medium text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep || validateCurrentStep()) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`group flex flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-all ${
                  isCurrent
                    ? "bg-primary/10 font-semibold text-primary"
                    : isCompleted
                      ? "text-emerald-600 hover:bg-muted/50 dark:text-emerald-400"
                      : "text-muted-foreground opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                      : isCompleted
                        ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                        : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden text-xs sm:inline">{step.label}</span>
                <span className="hidden text-[10px] text-muted-foreground md:inline">
                  {step.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Cards */}
      <Card className="border border-border shadow-sm">
        {/* STEP 1: Overview */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                Step 1: Executive Overview
              </div>
              <CardTitle className="text-2xl font-bold">Candidate Information</CardTitle>
              <CardDescription>
                Provide the engineer's core profile title, official designation, and
                executive summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Full Name or Profile Headline *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Parshva Mehta - Principal Cloud Architect"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="designation">Primary Designation *</Label>
                  <Input
                    id="designation"
                    placeholder="e.g. Lead Software Engineer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Executive Bio</Label>
                <textarea
                  id="bio"
                  rows={4}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Senior software engineer with deep specialization in cloud architectures, microservices, and distributed high-throughput data processing..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 2: Skills */}
        {currentStep === 2 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Layers className="h-4 w-4" />
                Step 2: Core Competencies
              </div>
              <CardTitle className="text-2xl font-bold">
                Technical Skills & Stacks
              </CardTitle>
              <CardDescription>
                Add programming languages, frameworks, cloud platforms, and tooling
                expertise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Add Pills */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Quick-add recommended enterprise skills:
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addSkill(item)}
                      disabled={skills.includes(item)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        skills.includes(item)
                          ? "border-primary/30 bg-primary/10 text-primary opacity-60"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {skills.includes(item) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <Label>Add Specific Technical Skill</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type skill name (e.g. Terraform, Apache Kafka, Rust) and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addSkill()}
                    className="shrink-0"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Selected Skills List */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected Skills ({skills.length})
                </Label>
                {skills.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">
                    No skills added yet. Add at least one skill to continue.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary shadow-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="rounded-full p-0.5 hover:bg-primary/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 3: Projects */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <FolderGit2 className="h-4 w-4" />
                Step 3: Client Projects & Portfolio
              </div>
              <CardTitle className="text-2xl font-bold">
                Key Project Engagements
              </CardTitle>
              <CardDescription>
                Detail major project deliveries, client implementations, and architectural
                contributions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Projects List */}
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="relative rounded-lg border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{proj.name}</h4>
                        <p className="text-xs font-medium text-primary">{proj.role}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProject(proj.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {proj.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {proj.description}
                      </p>
                    )}
                    {proj.technologies && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {proj.technologies.split(",").map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Project Card */}
              <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/10 p-4">
                <h4 className="text-sm font-semibold text-foreground">
                  Add Project Experience
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Project Name (e.g. Telehealth Video Platform)"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Role (e.g. Senior Frontend Engineer)"
                    value={newProject.role}
                    onChange={(e) =>
                      setNewProject({ ...newProject, role: e.target.value })
                    }
                  />
                </div>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Key contributions and architecture highlights..."
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                />
                <Input
                  placeholder="Technologies used (comma separated, e.g. React, WebRTC, Tailwind)"
                  value={newProject.technologies}
                  onChange={(e) =>
                    setNewProject({ ...newProject, technologies: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProject}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Save Project Item
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 4: Credentials */}
        {currentStep === 4 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <GraduationCap className="h-4 w-4" />
                Step 4: Education & Certifications
              </div>
              <CardTitle className="text-2xl font-bold">
                Academic & Professional Credentials
              </CardTitle>
              <CardDescription>
                Highlight university degrees, professional credentials, and vendor
                certifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="education">Highest Academic Qualification</Label>
                <Input
                  id="education"
                  placeholder="e.g. Master of Science in Software Engineering"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>

              {/* Certifications List */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Certifications ({certifications.length})
                </Label>
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.issuer} {cert.year ? `• ${cert.year}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCert(cert.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Certification */}
              <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/10 p-4">
                <h4 className="text-sm font-semibold text-foreground">
                  Add Certification
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Certification Name"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  />
                  <Input
                    placeholder="Issuing Organization"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  />
                  <Input
                    placeholder="Year (e.g. 2024)"
                    value={newCert.year}
                    onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCert}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Save Certification
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 5: Review */}
        {currentStep === 5 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <FileText className="h-4 w-4" />
                Step 5: Executive Dossier Review
              </div>
              <CardTitle className="text-2xl font-bold">
                Review & Publish Profile
              </CardTitle>
              <CardDescription>
                Verify candidate details before generating the official Zymr talent
                dossier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview Box */}
              <div className="space-y-6 rounded-xl border border-border bg-muted/20 p-6">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {title || "Untitled Profile"}
                    </h3>
                    <p className="text-sm font-medium text-primary">
                      {designation || "Designation not set"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {experienceYears} Years Total Experience • {education}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  >
                    Draft Preview
                  </Badge>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Executive Summary
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground">
                    {bio || "No summary provided."}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Competencies ({skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {projects.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Featured Projects ({projects.length})
                    </h4>
                    <div className="space-y-2">
                      {projects.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-md border border-border/60 bg-background/50 p-3"
                        >
                          <p className="text-sm font-semibold">
                            {p.name}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({p.role})
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* Stepper Controls Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/10 p-6">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleFinalSubmit("in_draft")}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleFinalSubmit("in_review")}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Submit for Review
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
