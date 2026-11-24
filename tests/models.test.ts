import {
  toProfileModel,
  toProjectModel,
  toClientModel,
  toUserModel,
  extractRoleFromCapabilities,
} from "@/server/models";

describe("Domain Models & Mappers Suite", () => {
  describe("ProfileModel & toProfileModel", () => {
    it("maps raw WordPress post to clean ProfileModel", () => {
      const now = new Date();
      const rawPost = {
        ID: BigInt(101),
        post_author: BigInt(5),
        post_title: "John Doe Principal Architect ver01",
        post_excerpt: "Principal Architect",
        post_content: "Architect with 10+ years experience",
        post_status: "is_ready",
        post_date: now,
        post_modified: now,
        postmeta: [
          {
            meta_key: "profile_data",
            meta_value: JSON.stringify({
              designation: "Principal Architect",
              experienceYears: 12,
              skills: ["AWS", "Node.js", "Docker"],
              certifications: ["AWS Solutions Architect"],
              aliasName: "Architect JD",
            }),
          },
        ],
        author: {
          ID: BigInt(5),
          display_name: "John Doe",
          user_email: "john@zymr.com",
          user_login: "johndoe",
        },
      };

      const model = toProfileModel(rawPost);

      expect(model.id).toBe("101");
      expect(model.authorId).toBe("5");
      expect(model.title).toBe("John Doe Principal Architect ver01");
      expect(model.designation).toBe("Principal Architect");
      expect(model.experienceYears).toBe(12);
      expect(model.skills).toEqual(["AWS", "Node.js", "Docker"]);
      expect(model.aliasName).toBe("Architect JD");
      expect(model.status).toBe("is_ready");
      expect(model.author?.email).toBe("john@zymr.com");
    });

    it("handles legacy/corrupt profile metadata gracefully", () => {
      const rawPost = {
        ID: BigInt(102),
        post_title: "Fallback Profile",
        postmeta: [{ meta_key: "profile_data", meta_value: "invalid-json" }],
      };

      const model = toProfileModel(rawPost);
      expect(model.id).toBe("102");
      expect(model.skills).toEqual([]);
      expect(model.experienceYears).toBe(0);
      expect(model.status).toBe("in_draft");
    });
  });

  describe("ProjectModel & toProjectModel", () => {
    it("maps project post with metadata to clean ProjectModel", () => {
      const now = new Date();
      const rawPost = {
        ID: BigInt(201),
        post_author: BigInt(3),
        post_title: "Cloud Migration",
        post_excerpt: "Project Alpha",
        post_content: "AWS cloud migration",
        post_date: now,
        post_modified: now,
        postmeta: [
          {
            meta_key: "projects",
            meta_value: JSON.stringify({
              project_name: "Cloud Migration",
              client_id: "50",
              type: "Infrastructure",
              category: "Cloud Native",
              cloud: "AWS",
              responsibilities: ["Lead design", "Implement IaC"],
              contributions: ["Reduced latency by 40%"],
              toolprocesses: "Terraform, Ansible",
            }),
          },
        ],
        author: {
          display_name: "Lead Eng",
          user_email: "lead@zymr.com",
        },
      };

      const model = toProjectModel(rawPost);

      expect(model.id).toBe("201");
      expect(model.name).toBe("Cloud Migration");
      expect(model.clientId).toBe("50");
      expect(model.type).toBe("Infrastructure");
      expect(model.responsibilities).toContain("Lead design");
      expect(model.contributions).toContain("Reduced latency by 40%");
      expect(model.author?.displayName).toBe("Lead Eng");
    });

    it("extracts clientId from individual meta_key fallback", () => {
      const rawPost = {
        ID: BigInt(202),
        post_title: "Project Beta",
        postmeta: [{ meta_key: "client", meta_value: "88" }],
      };

      const model = toProjectModel(rawPost);
      expect(model.clientId).toBe("88");
      expect(model.responsibilities).toEqual([]);
    });
  });

  describe("ClientModel & toClientModel", () => {
    it("maps client post & metadata to clean ClientModel", () => {
      const now = new Date();
      const rawPost = {
        ID: BigInt(301),
        post_title: "Kingsley Gate",
        post_content: "Global executive search firm",
        post_date: now,
        post_modified: now,
        postmeta: [
          { meta_key: "industry", meta_value: "Executive Search" },
          { meta_key: "website", meta_value: "https://kingsleygate.com" },
        ],
      };

      const model = toClientModel(rawPost);

      expect(model.id).toBe("301");
      expect(model.name).toBe("Kingsley Gate");
      expect(model.industry).toBe("Executive Search");
      expect(model.website).toBe("https://kingsleygate.com");
      expect(model.description).toBe("Global executive search firm");
    });
  });

  describe("UserModel & toUserModel", () => {
    it("maps user and extracts roles and capabilities", () => {
      const now = new Date();
      const rawUser = {
        ID: BigInt(1),
        user_login: "admin.user",
        display_name: "Admin User",
        user_email: "admin@zymr.com",
        user_registered: now,
        usermeta: [
          {
            meta_key: "wp_capabilities",
            meta_value: 'a:2:{s:13:"administrator";b:1;s:18:"share_zpp_profile";b:1;}',
          },
        ],
      };

      const model = toUserModel(rawUser);

      expect(model.id).toBe("1");
      expect(model.username).toBe("admin.user");
      expect(model.role).toBe("administrator");
      expect(model.canShareProfile).toBe(true);
    });

    it("tests role extraction helper", () => {
      expect(extractRoleFromCapabilities(null)).toBe("engineer");
      expect(extractRoleFromCapabilities('a:1:{s:7:"manager";b:1;}')).toBe("manager");
      expect(extractRoleFromCapabilities('a:1:{s:7:"partner";b:1;}')).toBe("partner");
      expect(extractRoleFromCapabilities('a:1:{s:12:"sales-person";b:1;}')).toBe(
        "sales-person"
      );
      expect(extractRoleFromCapabilities('a:1:{s:6:"editor";b:1;}')).toBe("editor");
      expect(extractRoleFromCapabilities('a:1:{s:8:"engineer";b:1;}')).toBe("engineer");
    });
  });
});
