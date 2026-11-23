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
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewProfilePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [designation, setDesignation] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["TypeScript", "React", "Node.js"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        setError(data.error?.message || "Failed to create profile");
      } else {
        router.push("/profiles");
        router.refresh();
      }
    } catch {
      setError("Network error while submitting profile.");
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

      <Card>
        <CardHeader>
          <CardTitle>Create Talent Profile</CardTitle>
          <CardDescription>
            Fill out your technical details and skills for the Zymr Profile database.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
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
              <Label>Core Skills *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill (e.g. Python, AWS, Docker)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Summary / Bio</Label>
              <textarea
                id="bio"
                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Brief summary of domain expertise, projects, and key achievements..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>
          <div className="flex justify-end gap-3 border-t p-6">
            <Link href="/profiles">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
