import { ConfigService } from "@/server/services/config.service";
import { ProjectService } from "@/server/services/project.service";
import { ClientService } from "@/server/services/client.service";
import { ProfileService } from "@/server/services/profile.service";
import { ProfileRepository } from "@/server/repositories/profile.repository";
import { EmailService } from "@/server/services/email.service";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError, BadRequestError } from "@/server/utils/errors";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wp_options: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    wp_posts: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wp_postmeta: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    wp_users: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wp_usermeta: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe("ConfigService", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns default config when option does not exist", async () => {
    (prisma.wp_options.findFirst as jest.Mock).mockResolvedValue(null);
    const config = await ConfigService.getConfig();
    expect(config.designation.levels).toContain("Senior");
  });

  it("returns parsed config when option exists in DB", async () => {
    (prisma.wp_options.findFirst as jest.Mock).mockResolvedValue({
      option_name: "_zprofile_master_config",
      option_value: JSON.stringify({
        designation: { levels: ["Lead Architect"] },
        domains: ["Custom Domain"],
      }),
    });
    const config = await ConfigService.getConfig();
    expect(config.designation.levels).toContain("Lead Architect");
    expect(config.domains).toContain("Custom Domain");
  });

  it("handles malformed JSON in DB gracefully", async () => {
    (prisma.wp_options.findFirst as jest.Mock).mockResolvedValue({
      option_name: "_zprofile_master_config",
      option_value: "invalid-json{",
    });
    const config = await ConfigService.getConfig();
    expect(config.designation.levels).toContain("Senior");
  });

  it("updates existing master config in wp_options", async () => {
    (prisma.wp_options.findFirst as jest.Mock).mockResolvedValue({
      option_id: BigInt(10),
      option_name: "_zprofile_master_config",
    });
    (prisma.wp_options.update as jest.Mock).mockResolvedValue({});

    const newCfg = {
      designation: { levels: ["Principal"], core_responsibility: [], speciality: [] },
      technologies: {},
      domains: ["AI"],
      tools: ["Git"],
      industries: {},
      education: { degrees: [], courses: [] },
    };

    const res = await ConfigService.updateConfig(newCfg);
    expect(prisma.wp_options.update).toHaveBeenCalled();
    expect(res.domains).toEqual(["AI"]);
  });

  it("creates new master config in wp_options if not found", async () => {
    (prisma.wp_options.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.wp_options.create as jest.Mock).mockResolvedValue({});

    const newCfg = {
      designation: { levels: ["Staff"], core_responsibility: [], speciality: [] },
      technologies: {},
      domains: [],
      tools: [],
      industries: {},
      education: { degrees: [], courses: [] },
    };

    const res = await ConfigService.updateConfig(newCfg);
    expect(prisma.wp_options.create).toHaveBeenCalled();
    expect(res.designation.levels).toEqual(["Staff"]);
  });
});

describe("ProjectService", () => {
  const adminUser = { id: "1", role: "administrator", email: "admin@zymr.com" };
  const engineerUser = { id: "2", role: "engineer", email: "eng@zymr.com" };

  afterEach(() => jest.clearAllMocks());

  it("lists all projects for admin without author filter", async () => {
    (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([
      {
        ID: BigInt(101),
        post_title: "Project Alpha",
        post_author: BigInt(2),
        postmeta: [],
      },
    ]);
    const projects = await ProjectService.listProjects(adminUser);
    expect(projects.length).toBe(1);
    expect(projects[0].ID).toBe("101");
  });

  it("filters projects by author for restricted engineer role", async () => {
    (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([
      {
        ID: BigInt(102),
        post_title: "Engineer Project",
        post_author: BigInt(2),
        postmeta: [],
      },
    ]);
    const projects = await ProjectService.listProjects(engineerUser);
    expect(projects[0].ID).toBe("102");
    expect(prisma.wp_posts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ post_author: BigInt(2) }),
      })
    );
  });

  it("gets project by ID or throws NotFoundError", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(ProjectService.getProjectById(999)).rejects.toThrow(NotFoundError);

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(101),
      post_title: "Found Project",
      post_author: BigInt(1),
      postmeta: [],
    });
    const found = await ProjectService.getProjectById(101);
    expect(found.post_title).toBe("Found Project");
  });

  it("creates project successfully", async () => {
    (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
      ID: BigInt(105),
      post_title: "New Project",
      post_author: BigInt(2),
      postmeta: [],
    });
    const created = await ProjectService.createProject(
      {
        name: "New Project",
        alias_name: "",
        type: "Web Application",
        category: "Cloud Native",
        cloud: "AWS",
        solution: "Sol",
        architecture: "",
        responsibilities: [],
        contributions: [],
        toolprocesses: "",
      },
      engineerUser
    );
    expect(created.ID).toBe("105");
  });

  it("updates project with author check for restricted users", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(105),
      post_author: BigInt(99), // different author
    });

    await expect(
      ProjectService.updateProject(105, { name: "Updated" }, engineerUser)
    ).rejects.toThrow(ForbiddenError);

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(105),
      post_author: BigInt(2), // matching author
    });
    (prisma.wp_posts.update as jest.Mock).mockResolvedValue({
      ID: BigInt(105),
      post_title: "Updated",
      post_author: BigInt(2),
      postmeta: [],
    });

    const updated = await ProjectService.updateProject(
      105,
      { name: "Updated" },
      engineerUser
    );
    expect(updated?.ID).toBe("105");
  });

  it("deletes project with author authorization check", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(105),
      post_author: BigInt(99),
    });
    await expect(ProjectService.deleteProject(105, engineerUser)).rejects.toThrow(
      ForbiddenError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(105),
      post_author: BigInt(1),
    });
    (prisma.wp_postmeta.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.wp_posts.delete as jest.Mock).mockResolvedValue({ ID: BigInt(105) });

    const result = await ProjectService.deleteProject(105, adminUser);
    expect(result.success).toBe(true);
  });
});

describe("ClientService", () => {
  const adminUser = { id: "1", role: "administrator", email: "admin@zymr.com" };
  const engineerUser = { id: "2", role: "engineer", email: "eng@zymr.com" };

  afterEach(() => jest.clearAllMocks());

  it("lists clients with role-based author filter", async () => {
    (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([
      { ID: BigInt(1), post_title: "Client A", post_author: BigInt(1), postmeta: [] },
    ]);
    const clients = await ClientService.listClients(adminUser);
    expect(clients.length).toBe(1);

    await ClientService.listClients(engineerUser);
    expect(prisma.wp_posts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ post_author: BigInt(2) }),
      })
    );
  });

  it("gets client by ID or throws NotFoundError", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(ClientService.getClientById(999, adminUser)).rejects.toThrow(
      NotFoundError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(1),
      post_title: "Kingsley",
      post_author: BigInt(1),
      postmeta: [],
    });
    const client = await ClientService.getClientById(1, adminUser);
    expect(client.post_title).toBe("Kingsley");
  });

  it("creates client and sets metadata", async () => {
    (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
      ID: BigInt(2),
      post_title: "Acme Corp",
      post_author: BigInt(1),
      postmeta: [],
    });
    const created = await ClientService.createClient(
      {
        name: "Acme Corp",
        description: "Acme desc",
        industry: "Tech",
        website: "https://acme.com",
      },
      adminUser
    );
    expect(created.ID).toBe("2");
  });

  it("updates and deletes client with permission verification", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(2),
      post_author: BigInt(99),
    });
    await expect(
      ClientService.updateClient(2, { name: "New Name" }, engineerUser)
    ).rejects.toThrow(ForbiddenError);

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(2),
      post_author: BigInt(1),
    });
    (prisma.wp_posts.update as jest.Mock).mockResolvedValue({
      ID: BigInt(2),
      post_title: "New Name",
      post_author: BigInt(1),
      postmeta: [],
    });
    const updated = await ClientService.updateClient(2, { name: "New Name" }, adminUser);
    expect(updated?.ID).toBe("2");

    (prisma.wp_posts.delete as jest.Mock).mockResolvedValue({ ID: BigInt(2) });
    const deleted = await ClientService.deleteClient(2, adminUser);
    expect(deleted.success).toBe(true);

    // Update with website existing meta and without existing meta
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(2),
      post_author: BigInt(1),
    });
    (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValueOnce({
      meta_id: BigInt(50),
      meta_value: "https://old.com",
    });
    await ClientService.updateClient(2, { website: "https://new.com" }, adminUser);
    expect(prisma.wp_postmeta.update).toHaveBeenCalled();

    (prisma.wp_postmeta.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await ClientService.updateClient(2, { website: "https://brandnew.com" }, adminUser);
    expect(prisma.wp_postmeta.create).toHaveBeenCalled();

    // deleteClient error branches
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await expect(ClientService.deleteClient(999, adminUser)).rejects.toThrow(
      NotFoundError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce({
      ID: BigInt(2),
      post_author: BigInt(99),
    });
    await expect(ClientService.deleteClient(2, engineerUser)).rejects.toThrow(
      ForbiddenError
    );
  });
});

describe("ProfileService & Workflow Transitions", () => {
  const adminUser = { id: "1", role: "administrator", email: "admin@zymr.com" };
  const engineerUser = { id: "2", role: "engineer", email: "eng@zymr.com" };

  afterEach(() => jest.clearAllMocks());

  it("queries profiles with search and status filters", async () => {
    (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([
      { ID: BigInt(5), post_title: "Profile 5", post_status: "publish", postmeta: [] },
    ]);
    const profiles = await ProfileService.listProfiles(adminUser, "cloud", "is_ready");
    expect(profiles.length).toBe(1);
  });

  it("enforces role restrictions when fetching profiles for engineer", async () => {
    (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([]);
    await ProfileService.listProfiles(engineerUser);
    expect(prisma.wp_posts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ post_author: BigInt(2) }),
      })
    );
  });

  it("fetches single profile and parses metadata correctly", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(5),
      post_title: "Rahul Sharma",
      post_status: "publish",
      post_author: BigInt(2),
      postmeta: [
        {
          meta_key: "profile_data",
          meta_value: JSON.stringify({ skills: ["AWS", "Node.js"], experienceYears: 7 }),
        },
      ],
    });

    const res = await ProfileService.getProfileById(5, engineerUser);
    expect(res.post_title).toBe("Rahul Sharma");
  });

  it("creates a new profile with ver01 title", async () => {
    (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
      ID: BigInt(6),
      post_title: "Jane Doe Senior Architect ver01",
      post_author: BigInt(2),
      postmeta: [],
    });
    const created = await ProfileService.createProfile(
      {
        title: "Jane Doe",
        designation: "Senior Architect",
        experienceYears: 6,
        bio: "Bio",
        skills: ["Go"],
        certifications: [],
      },
      engineerUser
    );
    expect(created.ID).toBe("6");
  });

  it("triggers correct transactional emails on status change", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(6),
      post_title: "Jane Doe ver01",
      post_author: BigInt(2),
      post_status: "in_draft",
      author: { display_name: "Jane Doe", user_email: "jane@zymr.com" },
      postmeta: [],
    });
    (prisma.wp_posts.update as jest.Mock).mockResolvedValue({
      ID: BigInt(6),
      post_status: "in_review",
      postmeta: [],
    });

    const sendEmailSpy = jest.spyOn(EmailService, "sendProfileSubmittedNotification");
    await ProfileService.updateStatus(6, { status: "in_review" }, engineerUser);
    expect(sendEmailSpy).toHaveBeenCalled();

    const approveSpy = jest.spyOn(EmailService, "sendProfileApprovedNotification");
    (prisma.wp_posts.update as jest.Mock).mockResolvedValue({
      ID: BigInt(6),
      post_status: "is_ready",
      postmeta: [],
    });
    await ProfileService.updateStatus(6, { status: "is_ready" }, adminUser);
    expect(approveSpy).toHaveBeenCalled();

    const requestSpy = jest.spyOn(EmailService, "sendChangesRequestedNotification");
    (prisma.wp_posts.update as jest.Mock).mockResolvedValue({
      ID: BigInt(6),
      post_status: "review_changes",
      postmeta: [],
    });
    await ProfileService.updateStatus(
      6,
      { status: "review_changes", feedback: "Add more cloud projects" },
      adminUser
    );
    expect(requestSpy).toHaveBeenCalled();
  });

  it("duplicates profile with version increment and error branches", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await expect(ProfileService.duplicateProfile(999, adminUser)).rejects.toThrow(
      NotFoundError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce({
      ID: BigInt(6),
      post_author: BigInt(99),
    });
    await expect(ProfileService.duplicateProfile(6, engineerUser)).rejects.toThrow(
      ForbiddenError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce({
      ID: BigInt(6),
      post_author: BigInt(2),
    });
    jest.spyOn(ProfileRepository, "duplicate").mockResolvedValueOnce(null);
    await expect(ProfileService.duplicateProfile(6, engineerUser)).rejects.toThrow(
      NotFoundError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValue({
      ID: BigInt(6),
      post_title: "Jane Doe ver01",
      post_author: BigInt(2),
      post_content: "Content",
      post_excerpt: "Excerpt",
      postmeta: [{ meta_key: "profile_status", meta_value: "publish" }],
    });
    (prisma.wp_posts.create as jest.Mock).mockResolvedValue({
      ID: BigInt(7),
      post_title: "Jane Doe ver02",
      postmeta: [],
    });

    const dup = await ProfileService.duplicateProfile(6, engineerUser);
    expect(dup.ID).toBe("7");
  });

  it("deletes profile with authorization verification and error handling", async () => {
    (prisma.wp_posts.findFirst as jest.Mock).mockReset();
    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await expect(ProfileService.deleteProfile(999, adminUser)).rejects.toThrow(
      NotFoundError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce({
      ID: BigInt(6),
      post_author: BigInt(99),
    });
    await expect(ProfileService.deleteProfile(6, engineerUser)).rejects.toThrow(
      ForbiddenError
    );

    (prisma.wp_posts.findFirst as jest.Mock).mockResolvedValueOnce({
      ID: BigInt(6),
      post_author: BigInt(2),
    });
    (prisma.wp_postmeta.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.wp_posts.delete as jest.Mock).mockResolvedValue({ ID: BigInt(6) });

    const res = await ProfileService.deleteProfile(6, engineerUser);
    expect(res.success).toBe(true);
  });
});
