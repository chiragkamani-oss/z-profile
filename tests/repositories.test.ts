import { ProfileRepository } from "../src/server/repositories/profile.repository";
import { ProjectRepository } from "../src/server/repositories/project.repository";
import { UserRepository } from "../src/server/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import { BadRequestError, NotFoundError } from "@/server/utils/errors";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wp_posts: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wp_postmeta: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    wp_users: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wp_usermeta: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe("Repositories Suite", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ProfileRepository", () => {
    it("finds many profiles with filters", async () => {
      (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([{ ID: BigInt(1) }]);

      const res = await ProfileRepository.findMany({
        authorId: 2,
        status: "publish",
        search: "cloud",
      });

      expect(res.length).toBe(1);
      expect(prisma.wp_posts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            post_type: "profile-builder",
            post_author: BigInt(2),
            post_status: "publish",
            OR: [
              { post_title: { contains: "cloud" } },
              { post_content: { contains: "cloud" } },
            ],
          }),
        })
      );
    });

    it("finds profile by ID", async () => {
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(10),
        post_title: "Profile 10",
      });

      const res = await ProfileRepository.findById(10);
      expect(res?.post_title).toBe("Profile 10");
    });

    it("creates profile with default draft status and meta", async () => {
      (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
        ID: BigInt(15),
        post_title: "Profile 15",
      });

      const res = await ProfileRepository.create(2, {
        title: "Profile 15",
        designation: "Cloud Architect",
        experienceYears: 10,
        skills: ["AWS", "Terraform"],
        certifications: [],
        bio: "Bio text",
        aliasName: "Architect 1",
      });

      expect(res.post_title).toBe("Profile 15");
      expect(prisma.wp_posts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            post_author: BigInt(2),
            post_title: "Profile 15",
            post_status: "in_draft",
          }),
        })
      );
    });

    it("updates profile and existing meta", async () => {
      (prisma.wp_posts.update as jest.Mock).mockResolvedValue({ ID: BigInt(15) });
      (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValue({
        meta_id: BigInt(100),
        meta_value: JSON.stringify({ skills: ["AWS"] }),
      });
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(15),
        post_title: "Updated Title",
      });

      const res = await ProfileRepository.update(15, {
        title: "Updated Title",
        skills: ["AWS", "GCP"],
      });

      expect(prisma.wp_postmeta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { meta_id: BigInt(100) },
        })
      );
      expect(res?.post_title).toBe("Updated Title");
    });

    it("updates profile when meta does not previously exist", async () => {
      (prisma.wp_posts.update as jest.Mock).mockResolvedValue({ ID: BigInt(16) });
      (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(16),
        post_title: "New Meta Profile",
      });

      await ProfileRepository.update(16, {
        designation: "Principal Engineer",
        experienceYears: 8,
      });

      expect(prisma.wp_postmeta.create).toHaveBeenCalled();
    });

    it("updates profile status and adds feedback when provided", async () => {
      (prisma.wp_posts.update as jest.Mock).mockResolvedValue({ ID: BigInt(20) });
      (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValue({
        meta_id: BigInt(201),
      });
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({ ID: BigInt(20) });

      await ProfileRepository.updateStatus(20, "review_changes", "Please update summary");

      expect(prisma.wp_postmeta.update).toHaveBeenCalledWith({
        where: { meta_id: BigInt(201) },
        data: { meta_value: "review_changes" },
      });
      expect(prisma.wp_postmeta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            meta_value: "Please update summary",
          }),
        })
      );
    });

    it("updates profile status when status meta does not exist", async () => {
      (prisma.wp_posts.update as jest.Mock).mockResolvedValue({ ID: BigInt(21) });
      (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({ ID: BigInt(21) });

      await ProfileRepository.updateStatus(21, "is_ready");

      expect(prisma.wp_postmeta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            meta_key: "profile_status",
            meta_value: "is_ready",
          }),
        })
      );
    });

    it("returns null when duplicating non-existent profile", async () => {
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue(null);
      const res = await ProfileRepository.duplicate(999, 2);
      expect(res).toBeNull();
    });

    it("duplicates profile with version increment ver01 -> ver02", async () => {
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(30),
        post_title: "John Doe Senior Architect ver01",
        post_content: "Content",
        post_excerpt: "Excerpt",
        postmeta: [
          { meta_key: "profile_data", meta_value: "{}" },
          { meta_key: "share_with", meta_value: "user@client.com" },
          { meta_key: "_edit_lock", meta_value: "123" },
        ],
      });
      (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
        ID: BigInt(31),
        post_title: "John Doe Senior Architect ver02",
      });

      const res = await ProfileRepository.duplicate(30, 2);
      expect(res?.post_title).toBe("John Doe Senior Architect ver02");
      expect(prisma.wp_posts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            post_title: "John Doe Senior Architect ver02",
            post_status: "in_draft",
          }),
        })
      );
    });

    it("duplicates profile without existing version suffix", async () => {
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(32),
        post_title: "Jane Doe Senior Architect",
        post_content: "Content",
        post_excerpt: "Excerpt",
        postmeta: [],
      });
      (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
        ID: BigInt(33),
        post_title: "Jane Doe Senior Architect ver02",
      });

      const res = await ProfileRepository.duplicate(32, 2);
      expect(res?.post_title).toBe("Jane Doe Senior Architect ver02");
      expect(prisma.wp_posts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            post_title: "Jane Doe Senior Architect ver02",
          }),
        })
      );
    });

    it("deletes profile by ID", async () => {
      (prisma.wp_posts.delete as jest.Mock).mockResolvedValue({ ID: BigInt(40) });
      const res = await ProfileRepository.delete(40);
      expect(res.ID).toEqual(BigInt(40));
    });
  });

  describe("ProjectRepository", () => {
    it("finds projects with clientId filter", async () => {
      (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([
        {
          ID: BigInt(1),
          post_title: "Project 1",
          postmeta: [{ meta_key: "client", meta_value: "50" }],
        },
        {
          ID: BigInt(2),
          post_title: "Project 2",
          postmeta: [{ meta_key: "client", meta_value: "51" }],
        },
      ]);

      const projects = await ProjectRepository.findMany({ clientId: 50, authorId: 2 });
      expect(projects.length).toBe(1);
      expect(projects[0].post_title).toBe("Project 1");
    });

    it("finds project by ID", async () => {
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(10),
        post_title: "Project 10",
      });

      const res = await ProjectRepository.findById(10);
      expect(res?.post_title).toBe("Project 10");
    });

    it("creates project with single string responsibilities and contributions", async () => {
      (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
        ID: BigInt(11),
        post_title: "New Project",
      });

      const res = await ProjectRepository.create(2, {
        name: "New Project",
        clientId: 50,
        responsibilities: "Single responsibility",
        contributions: "Single contribution",
      } as any);

      expect(res.post_title).toBe("New Project");
      expect(prisma.wp_posts.create).toHaveBeenCalled();
    });

    it("updates project with existing meta", async () => {
      (prisma.wp_posts.update as jest.Mock).mockResolvedValue({ ID: BigInt(12) });
      (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValue({
        meta_id: BigInt(500),
        meta_value: JSON.stringify({ project_name: "Old Name" }),
      });
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
        ID: BigInt(12),
        post_title: "Updated Project",
      });

      const res = await ProjectRepository.update(12, {
        name: "Updated Project",
        solution: "Cloud migration",
      });

      expect(prisma.wp_postmeta.update).toHaveBeenCalled();
      expect(res?.post_title).toBe("Updated Project");
    });

    it("updates project when meta does not exist", async () => {
      (prisma.wp_posts.update as jest.Mock).mockResolvedValue({ ID: BigInt(13) });
      (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({ ID: BigInt(13) });

      await ProjectRepository.update(13, {
        name: "New Meta Project",
      });

      expect(prisma.wp_postmeta.create).toHaveBeenCalled();
    });

    it("deletes project and its postmeta", async () => {
      (prisma.wp_postmeta.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.wp_posts.delete as jest.Mock).mockResolvedValue({ ID: BigInt(14) });

      const res = await ProjectRepository.delete(14);
      expect(prisma.wp_postmeta.deleteMany).toHaveBeenCalledWith({
        where: { post_id: BigInt(14) },
      });
      expect(res.ID).toEqual(BigInt(14));
    });
  });

  describe("UserRepository", () => {
    it("extracts WordPress roles accurately from usermeta", () => {
      expect(
        UserRepository.extractRoleFromMeta([
          {
            meta_key: "wp_capabilities",
            meta_value: 'a:1:{s:13:"administrator";b:1;}',
          } as any,
        ])
      ).toBe("administrator");

      expect(
        UserRepository.extractRoleFromMeta([
          { meta_key: "wp_capabilities", meta_value: 'a:1:{s:7:"manager";b:1;}' } as any,
        ])
      ).toBe("manager");

      expect(
        UserRepository.extractRoleFromMeta([
          { meta_key: "wp_capabilities", meta_value: 'a:1:{s:7:"partner";b:1;}' } as any,
        ])
      ).toBe("partner");

      expect(
        UserRepository.extractRoleFromMeta([
          {
            meta_key: "wp_capabilities",
            meta_value: 'a:1:{s:12:"sales-person";b:1;}',
          } as any,
        ])
      ).toBe("sales-person");

      expect(
        UserRepository.extractRoleFromMeta([
          { meta_key: "wp_capabilities", meta_value: 'a:1:{s:6:"editor";b:1;}' } as any,
        ])
      ).toBe("editor");

      expect(
        UserRepository.extractRoleFromMeta([
          { meta_key: "wp_capabilities", meta_value: 'a:1:{s:8:"engineer";b:1;}' } as any,
        ])
      ).toBe("engineer");

      expect(UserRepository.extractRoleFromMeta([])).toBe("engineer");
    });

    it("checks custom capabilities with hasCapability", () => {
      expect(
        UserRepository.hasCapability(
          [{ meta_key: "wp_capabilities", meta_value: '"share_zpp_profile";b:1' } as any],
          "share_zpp_profile"
        )
      ).toBe(true);

      expect(
        UserRepository.hasCapability(
          [
            {
              meta_key: "wp_capabilities",
              meta_value: '"share_zpp_profile";s:1:"1"',
            } as any,
          ],
          "share_zpp_profile"
        )
      ).toBe(true);

      expect(UserRepository.hasCapability([], "share_zpp_profile")).toBe(false);
    });

    it("builds serialized capabilities meta", () => {
      const withShare = UserRepository.buildCapabilitiesMeta("engineer", true);
      expect(withShare).toContain("share_zpp_profile");

      const withoutShare = UserRepository.buildCapabilitiesMeta("engineer", false);
      expect(withoutShare).not.toContain("share_zpp_profile");
    });

    it("determines correct user level for roles", () => {
      expect(UserRepository.getRoleUserLevel("administrator")).toBe("10");
      expect(UserRepository.getRoleUserLevel("manager")).toBe("7");
      expect(UserRepository.getRoleUserLevel("partner")).toBe("2");
      expect(UserRepository.getRoleUserLevel("sales-person")).toBe("2");
      expect(UserRepository.getRoleUserLevel("engineer")).toBe("1");
    });

    it("finds many users with parsed roles", async () => {
      (prisma.wp_users.findMany as jest.Mock).mockResolvedValue([
        {
          ID: BigInt(1),
          user_login: "admin",
          user_email: "admin@zymr.com",
          display_name: "Admin User",
          user_registered: new Date(),
          usermeta: [
            {
              meta_key: "wp_capabilities",
              meta_value: 'a:1:{s:13:"administrator";b:1;}',
            },
          ],
        },
      ]);

      const users = await UserRepository.findMany();
      expect(users.length).toBe(1);
      expect(users[0].role).toBe("administrator");
    });

    it("finds user by ID or throws NotFoundError", async () => {
      (prisma.wp_users.findUnique as jest.Mock).mockResolvedValueOnce({
        ID: BigInt(5),
        user_login: "dev",
        user_email: "dev@zymr.com",
        display_name: "Developer",
        user_registered: new Date(),
        usermeta: [],
      });

      const user = await UserRepository.findById(5);
      expect(user.username).toBe("dev");

      (prisma.wp_users.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(UserRepository.findById(999)).rejects.toThrow(NotFoundError);
    });

    it("creates user successfully", async () => {
      (prisma.wp_users.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wp_users.create as jest.Mock).mockResolvedValue({
        ID: BigInt(10),
        user_login: "john",
        display_name: "John Doe",
        user_email: "john@zymr.com",
        usermeta: [],
      });

      const user = await UserRepository.create({
        username: "john",
        displayName: "John Doe",
        email: "john@zymr.com",
        password: "Password123!",
        role: "engineer",
        canShareProfile: true,
      });

      expect(user.username).toBe("john");
    });

    it("throws BadRequestError on duplicate username or email during creation", async () => {
      (prisma.wp_users.findFirst as jest.Mock).mockResolvedValueOnce({
        user_login: "duplicateuser",
        user_email: "other@zymr.com",
      });

      await expect(
        UserRepository.create({
          username: "duplicateuser",
          displayName: "Dup",
          email: "unique@zymr.com",
          password: "Pass",
          role: "engineer",
          canShareProfile: false,
        })
      ).rejects.toThrow("already in use");

      (prisma.wp_users.findFirst as jest.Mock).mockResolvedValueOnce({
        user_login: "otheruser",
        user_email: "duplicate@zymr.com",
      });

      await expect(
        UserRepository.create({
          username: "uniqueuser",
          displayName: "Dup",
          email: "duplicate@zymr.com",
          password: "Pass",
          role: "engineer",
          canShareProfile: false,
        })
      ).rejects.toThrow("already registered");
    });

    it("sets user meta entry (upsert)", async () => {
      (prisma.wp_usermeta.findFirst as jest.Mock).mockResolvedValueOnce({
        umeta_id: BigInt(99),
      });

      await UserRepository.setMeta(BigInt(10), "first_name", "Alice");
      expect(prisma.wp_usermeta.update).toHaveBeenCalledWith({
        where: { umeta_id: BigInt(99) },
        data: { meta_value: "Alice" },
      });

      (prisma.wp_usermeta.findFirst as jest.Mock).mockResolvedValueOnce(null);
      await UserRepository.setMeta(BigInt(10), "last_name", "Smith");
      expect(prisma.wp_usermeta.create).toHaveBeenCalledWith({
        data: {
          user_id: BigInt(10),
          meta_key: "last_name",
          meta_value: "Smith",
        },
      });
    });

    it("updates user fields and handles duplicate email check", async () => {
      (prisma.wp_users.findUnique as jest.Mock).mockResolvedValue({
        ID: BigInt(10),
        user_email: "old@zymr.com",
        usermeta: [],
      });
      (prisma.wp_users.findFirst as jest.Mock).mockResolvedValueOnce({
        ID: BigInt(11),
      });

      await expect(
        UserRepository.update(10, { email: "taken@zymr.com" })
      ).rejects.toThrow(BadRequestError);

      (prisma.wp_users.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.wp_users.update as jest.Mock).mockResolvedValue({ ID: BigInt(10) });

      // Mock for findById inside update
      (prisma.wp_users.findUnique as jest.Mock).mockResolvedValue({
        ID: BigInt(10),
        user_login: "alice",
        display_name: "Alice Wonderland",
        user_email: "alice@zymr.com",
        user_registered: new Date(),
        usermeta: [],
      });

      const updated = await UserRepository.update(10, {
        displayName: "Alice Wonderland",
        email: "alice@zymr.com",
        role: "manager",
        canShareProfile: true,
      });

      expect(updated.displayName).toBe("Alice Wonderland");
    });

    it("deletes user and associated meta, preventing self-deletion", async () => {
      await expect(UserRepository.delete(1, 1)).rejects.toThrow(
        "You cannot delete your own active administrator account"
      );

      (prisma.wp_users.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(UserRepository.delete(5, 1)).rejects.toThrow(NotFoundError);

      (prisma.wp_users.findUnique as jest.Mock).mockResolvedValueOnce({
        ID: BigInt(5),
      });
      (prisma.wp_usermeta.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.wp_users.delete as jest.Mock).mockResolvedValue({ ID: BigInt(5) });

      const res = await UserRepository.delete(5, 1);
      expect(res.deleted).toBe(true);
    });
  });
});
