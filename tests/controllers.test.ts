import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { ClientController } from "../src/server/controllers/client.controller";
import { DashboardController } from "../src/server/controllers/dashboard.controller";
import { ProfileController } from "../src/server/controllers/profile.controller";
import { ProjectController } from "../src/server/controllers/project.controller";
import { UserController } from "../src/server/controllers/user.controller";
import { ClientService } from "../src/server/services/client.service";
import { ProfileService } from "../src/server/services/profile.service";
import { ProjectService } from "../src/server/services/project.service";
import { UserRepository } from "../src/server/repositories/user.repository";
import { prisma } from "@/lib/prisma";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wp_posts: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    wp_users: {
      count: jest.fn(),
    },
  },
}));

jest.mock("../src/server/services/client.service");
jest.mock("../src/server/services/profile.service");
jest.mock("../src/server/services/project.service");
jest.mock("../src/server/repositories/user.repository");

describe("Controllers Suite", () => {
  const adminSession = {
    user: { id: "1", name: "Admin", email: "admin@zymr.com", role: "administrator" },
  };
  const engineerSession = {
    user: { id: "2", name: "Engineer", email: "eng@zymr.com", role: "engineer" },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ClientController", () => {
    it("lists clients when authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ClientService.listClients as jest.Mock).mockResolvedValue([
        { id: "10", name: "Kingsley Gate" },
      ]);

      const req = new NextRequest("http://localhost:3000/api/clients");
      const res = await ClientController.listClients(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].name).toBe("Kingsley Gate");
    });

    it("returns 401 when listing clients unauthenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/clients");
      const res = await ClientController.listClients(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("gets client by id", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ClientService.getClientById as jest.Mock).mockResolvedValue({
        id: "10",
        name: "Client A",
      });

      const req = new NextRequest("http://localhost:3000/api/clients/10");
      const res = await ClientController.getClientById(req, {
        params: Promise.resolve({ id: "10" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.name).toBe("Client A");
    });

    it("creates client with valid payload", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ClientService.createClient as jest.Mock).mockResolvedValue({
        id: "11",
        name: "New Client",
      });

      const req = new NextRequest("http://localhost:3000/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "New Client",
          industry: "Tech",
          website: "https://example.com",
        }),
      });
      const res = await ClientController.createClient(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data.id).toBe("11");
    });

    it("returns 400 on invalid client create payload", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);

      const req = new NextRequest("http://localhost:3000/api/clients", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await ClientController.createClient(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("updates client successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ClientService.updateClient as jest.Mock).mockResolvedValue({
        id: "10",
        name: "Updated",
      });

      const req = new NextRequest("http://localhost:3000/api/clients/10", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      });
      const res = await ClientController.updateClient(req, {
        params: Promise.resolve({ id: "10" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.name).toBe("Updated");
    });

    it("deletes client successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ClientService.deleteClient as jest.Mock).mockResolvedValue({ success: true });

      const req = new NextRequest("http://localhost:3000/api/clients/10", {
        method: "DELETE",
      });
      const res = await ClientController.deleteClient(req, {
        params: Promise.resolve({ id: "10" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.success).toBe(true);
    });
  });

  describe("DashboardController", () => {
    it("returns dashboard stats for administrator", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([
        {
          ID: BigInt(1),
          post_title: "Profile 1",
          post_status: "is_ready",
          post_excerpt: "Architect",
          post_date: new Date(),
          postmeta: [{ meta_value: JSON.stringify({ skills: ["React", "Node"] }) }],
          author: { display_name: "John", user_email: "john@zymr.com" },
        },
        {
          ID: BigInt(2),
          post_title: "Profile 2",
          post_status: "in_review",
          post_excerpt: "Engineer",
          post_date: new Date(),
          postmeta: [{ meta_value: "invalid-json" }],
          author: { display_name: "Jane", user_email: "jane@zymr.com" },
        },
        {
          ID: BigInt(3),
          post_title: "Profile 3",
          post_status: "review_changes",
          post_excerpt: "Lead",
          post_date: new Date(),
          postmeta: [],
          author: null,
        },
        {
          ID: BigInt(4),
          post_title: "Profile 4",
          post_status: "draft",
          post_excerpt: "",
          post_date: new Date(),
          postmeta: [],
          author: null,
        },
      ]);
      (prisma.wp_posts.count as jest.Mock).mockResolvedValue(12);
      (prisma.wp_users.count as jest.Mock).mockResolvedValue(45);

      const req = new NextRequest("http://localhost:3000/api/dashboard");
      const res = await DashboardController.getStats(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.totalProfiles).toBe(4);
      expect(data.data.readyCount).toBe(1);
      expect(data.data.inReviewCount).toBe(1);
      expect(data.data.reviewChangesCount).toBe(1);
      expect(data.data.draftCount).toBe(1);
      expect(data.data.topSkills[0].name).toBe("React");
    });

    it("returns restricted dashboard stats for engineer", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);
      (prisma.wp_posts.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.wp_posts.count as jest.Mock).mockResolvedValue(5);
      (prisma.wp_users.count as jest.Mock).mockResolvedValue(10);

      const req = new NextRequest("http://localhost:3000/api/dashboard");
      const res = await DashboardController.getStats(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.totalProfiles).toBe(0);
      expect(prisma.wp_posts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ post_author: BigInt(2) }),
        })
      );
    });

    it("returns 401 when unauthorized", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/dashboard");
      const res = await DashboardController.getStats(req);
      expect(res.status).toBe(401);
    });
  });

  describe("ProfileController", () => {
    it("lists profiles with query params", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ProfileService.listProfiles as jest.Mock).mockResolvedValue([{ ID: "100" }]);

      const req = new NextRequest(
        "http://localhost:3000/api/profiles?search=alex&status=is_ready"
      );
      const res = await ProfileController.listProfiles(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(ProfileService.listProfiles).toHaveBeenCalledWith(
        adminSession.user,
        "alex",
        "is_ready"
      );
      expect(data.data[0].ID).toBe("100");
    });

    it("gets profile by ID (public view without session)", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      (ProfileService.getProfileById as jest.Mock).mockResolvedValue({
        ID: "100",
        post_title: "Profile",
      });

      const req = new NextRequest("http://localhost:3000/api/profiles/100");
      const res = await ProfileController.getProfileById(req, { params: { id: "100" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(ProfileService.getProfileById).toHaveBeenCalledWith(100, undefined);
    });

    it("creates profile with valid data", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);
      (ProfileService.createProfile as jest.Mock).mockResolvedValue({ ID: "101" });

      const req = new NextRequest("http://localhost:3000/api/profiles", {
        method: "POST",
        body: JSON.stringify({
          title: "Senior Architect",
          designation: "Architect",
          experienceYears: 5,
          skills: ["AWS", "Node.js"],
        }),
      });
      const res = await ProfileController.createProfile(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data.ID).toBe("101");
    });

    it("returns 400 when creating profile with invalid data", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);

      const req = new NextRequest("http://localhost:3000/api/profiles", {
        method: "POST",
        body: JSON.stringify({ experienceYears: -5 }),
      });
      const res = await ProfileController.createProfile(req);
      expect(res.status).toBe(400);
    });

    it("updates profile with valid input", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);
      (ProfileService.updateProfile as jest.Mock).mockResolvedValue({ ID: "101" });

      const req = new NextRequest("http://localhost:3000/api/profiles/101", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await ProfileController.updateProfile(req, { params: { id: "101" } });
      expect(res.status).toBe(200);
    });

    it("updates profile workflow status", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);
      (ProfileService.updateStatus as jest.Mock).mockResolvedValue({
        ID: "101",
        post_status: "in_review",
      });

      const req = new NextRequest("http://localhost:3000/api/profiles/101/status", {
        method: "POST",
        body: JSON.stringify({ status: "in_review" }),
      });
      const res = await ProfileController.updateStatus(req, { params: { id: "101" } });
      expect(res.status).toBe(200);
    });

    it("deletes profile", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);
      (ProfileService.deleteProfile as jest.Mock).mockResolvedValue({ success: true });

      const req = new NextRequest("http://localhost:3000/api/profiles/101", {
        method: "DELETE",
      });
      const res = await ProfileController.deleteProfile(req, { params: { id: "101" } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.data.success).toBe(true);
    });
  });

  describe("ProjectController", () => {
    it("lists projects with clientId filter", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ProjectService.listProjects as jest.Mock).mockResolvedValue([{ ID: "201" }]);

      const req = new NextRequest("http://localhost:3000/api/projects?clientId=5");
      const res = await ProjectController.listProjects(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(ProjectService.listProjects).toHaveBeenCalledWith(adminSession.user, 5);
      expect(data.data[0].ID).toBe("201");
    });

    it("gets project by ID", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ProjectService.getProjectById as jest.Mock).mockResolvedValue({
        ID: "201",
        post_title: "Project Alpha",
      });

      const req = new NextRequest("http://localhost:3000/api/projects/201");
      const res = await ProjectController.getProjectById(req, {
        params: Promise.resolve({ id: "201" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.post_title).toBe("Project Alpha");
    });

    it("creates project successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ProjectService.createProject as jest.Mock).mockResolvedValue({ ID: "202" });

      const req = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: "Project Omega",
          clientId: 10,
          type: "Internal",
        }),
      });
      const res = await ProjectController.createProject(req);
      expect(res.status).toBe(201);
    });

    it("updates project successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ProjectService.updateProject as jest.Mock).mockResolvedValue({ ID: "202" });

      const req = new NextRequest("http://localhost:3000/api/projects/202", {
        method: "PUT",
        body: JSON.stringify({
          name: "Project Omega Renamed",
        }),
      });
      const res = await ProjectController.updateProject(req, {
        params: Promise.resolve({ id: "202" }),
      });
      expect(res.status).toBe(200);
    });

    it("deletes project successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (ProjectService.deleteProject as jest.Mock).mockResolvedValue({ success: true });

      const req = new NextRequest("http://localhost:3000/api/projects/202", {
        method: "DELETE",
      });
      const res = await ProjectController.deleteProject(req, {
        params: Promise.resolve({ id: "202" }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.data.success).toBe(true);
    });
  });

  describe("UserController", () => {
    it("lists users when user is administrator", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (UserRepository.findMany as jest.Mock).mockResolvedValue([
        { ID: "1", user_login: "admin" },
      ]);

      const req = new NextRequest("http://localhost:3000/api/users");
      const res = await UserController.listUsers(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data[0].user_login).toBe("admin");
    });

    it("returns 403 when non-admin accesses user controller", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(engineerSession);

      const req = new NextRequest("http://localhost:3000/api/users");
      const res = await UserController.listUsers(req);
      expect(res.status).toBe(403);
    });

    it("gets user by ID with valid integer ID", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (UserRepository.findById as jest.Mock).mockResolvedValue({
        ID: "5",
        user_login: "dev1",
      });

      const req = new NextRequest("http://localhost:3000/api/users/5");
      const res = await UserController.getUserById(req, { params: { id: "5" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.user_login).toBe("dev1");
    });

    it("returns 400 when user ID is NaN", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);

      const req = new NextRequest("http://localhost:3000/api/users/abc");
      const res = await UserController.getUserById(req, { params: { id: "abc" } });
      expect(res.status).toBe(400);
    });

    it("creates user successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (UserRepository.create as jest.Mock).mockResolvedValue({
        ID: "15",
        username: "newuser",
      });

      const req = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: "newuser",
          displayName: "New User",
          email: "new@zymr.com",
          password: "SecurePass123!",
          role: "engineer",
        }),
      });
      const res = await UserController.createUser(req);
      expect(res.status).toBe(201);
    });

    it("returns 400 on user create validation failure", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);

      const req = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({ user_login: "" }),
      });
      const res = await UserController.createUser(req);
      expect(res.status).toBe(400);
    });

    it("updates user successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (UserRepository.update as jest.Mock).mockResolvedValue({
        ID: "15",
        display_name: "Updated",
      });

      const req = new NextRequest("http://localhost:3000/api/users/15", {
        method: "PUT",
        body: JSON.stringify({ display_name: "Updated" }),
      });
      const res = await UserController.updateUser(req, { params: { id: "15" } });
      expect(res.status).toBe(200);
    });

    it("returns 400 when updating user with invalid ID", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);

      const req = new NextRequest("http://localhost:3000/api/users/xyz", {
        method: "PUT",
        body: JSON.stringify({ display_name: "Updated" }),
      });
      const res = await UserController.updateUser(req, { params: { id: "xyz" } });
      expect(res.status).toBe(400);
    });

    it("deletes user successfully", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);
      (UserRepository.delete as jest.Mock).mockResolvedValue({ success: true });

      const req = new NextRequest("http://localhost:3000/api/users/15", {
        method: "DELETE",
      });
      const res = await UserController.deleteUser(req, { params: { id: "15" } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.success).toBe(true);
    });

    it("returns 400 when deleting user with invalid ID", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(adminSession);

      const req = new NextRequest("http://localhost:3000/api/users/invalid", {
        method: "DELETE",
      });
      const res = await UserController.deleteUser(req, { params: { id: "invalid" } });
      expect(res.status).toBe(400);
    });
  });
});
