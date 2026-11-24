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
import { ArrowLeft, Loader2, Plus, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewProfilePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [designation, setDesignation] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["TypeScript", "React", "Node.js"]);
  const [isLoading, setIsLoading] = useState(false);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
      toast.info(`Added skill: ${trimmed}`);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          designation,
          experienceYears: Number(experienceYears),
          bio,
          skills,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || "Failed to create profile");
      } else {
        toast.success("Profile created successfully as Draft!");
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profiles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles
          </Button>
        </Link>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            Talent Profile Builder
          </div>
          <CardTitle className="text-2xl font-bold">
            Create Professional Profile
          </CardTitle>
          <CardDescription>
            Enter your technical expertise, total experience, and project background to
            showcase in the Zymr Talent Directory.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Profile Full Title / Engineer Name *</Label>
              <Input
                id="title"
                required
                placeholder="e.g. Senior Full Stack Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="designation">Primary Designation *</Label>
                <Input
                  id="designation"
                  required
                  placeholder="e.g. Lead Software Engineer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  required
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Core Technical Competencies *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill (e.g. Python, AWS, Docker, Kubernetes) and press Enter"
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
                  onClick={addSkill}
                  className="shrink-0"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Skill
                </Button>
              </div>
              <div className="flex min-h-9 flex-wrap gap-2 pt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="transition-colors hover:text-destructive"
                      title={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Executive Summary / Professional Bio</Label>
              <textarea
                id="bio"
                className="shadow-xs min-h-[140px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Highlight your key achievements, architecture background, cloud deliverables, and client impact..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>
          <div className="flex justify-end gap-3 rounded-b-xl border-t border-border bg-muted/20 p-6">
            <Link href="/profiles">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="shadow-xs font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile Draft
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
