import {
  createProfileSchema,
  updateStatusSchema,
} from "@/server/validators/profile.schema";
import { createClientSchema } from "@/server/validators/client.schema";

describe("Zod Request Validators", () => {
  describe("createProfileSchema", () => {
    it("should validate a correct profile input", () => {
      const input = {
        title: "Senior Full Stack Engineer",
        designation: "Staff Software Engineer",
        experienceYears: 7,
        bio: "Experienced developer in TypeScript and React.",
        skills: ["TypeScript", "Next.js", "Docker"],
      };

      const result = createProfileSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail when title is too short", () => {
      const input = {
        title: "A",
        designation: "Developer",
        experienceYears: 3,
        skills: ["React"],
      };

      const result = createProfileSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should fail when experienceYears is negative", () => {
      const input = {
        title: "Developer",
        designation: "Dev",
        experienceYears: -2,
        skills: ["React"],
      };

      const result = createProfileSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should fail when skills array is empty", () => {
      const input = {
        title: "Developer",
        designation: "Dev",
        experienceYears: 2,
        skills: [],
      };

      const result = createProfileSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updateStatusSchema", () => {
    it("should accept valid profile workflow statuses", () => {
      expect(updateStatusSchema.safeParse({ status: "in_review" }).success).toBe(true);
      expect(updateStatusSchema.safeParse({ status: "is_ready" }).success).toBe(true);
      expect(
        updateStatusSchema.safeParse({ status: "review_changes", feedback: "Please fix" })
          .success
      ).toBe(true);
    });

    it("should reject invalid statuses", () => {
      expect(updateStatusSchema.safeParse({ status: "unknown_status" }).success).toBe(
        false
      );
    });
  });

  describe("createClientSchema", () => {
    it("should validate client data with valid website URL", () => {
      const input = {
        name: "Acme Healthcare",
        industry: "HealthTech",
        website: "https://acme.example.com",
        description: "Global healthcare client",
      };
      expect(createClientSchema.safeParse(input).success).toBe(true);
    });

    it("should reject invalid website URL", () => {
      const input = {
        name: "Acme Corp",
        website: "not-a-valid-url",
      };
      expect(createClientSchema.safeParse(input).success).toBe(false);
    });
  });
});
