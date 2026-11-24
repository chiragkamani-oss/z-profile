import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProjectService } from "../services/project.service";
import { createProjectSchema, updateProjectSchema } from "../validators/project.schema";
import { successResponse, errorResponse } from "../utils/api-response";
import { UnauthorizedError } from "../utils/errors";
import { CurrentUser } from "../services/profile.service";

export class ProjectController {
  private static async getSessionUser(): Promise<CurrentUser> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError("Authentication required");
    }
    return session.user as CurrentUser;
  }

  static async listProjects(req: NextRequest) {
    try {
      const user = await this.getSessionUser();
      const { searchParams } = new URL(req.url);
      const clientId = searchParams.get("clientId")
        ? parseInt(searchParams.get("clientId")!, 10)
        : undefined;

      const projects = await ProjectService.listProjects(user, clientId);
      return successResponse(projects);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async getProjectById(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      await this.getSessionUser();
      const { id } = await params;
      const project = await ProjectService.getProjectById(parseInt(id, 10));
      return successResponse(project);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async createProject(req: NextRequest) {
    try {
      const user = await this.getSessionUser();
      const body = await req.json();
      const validatedData = createProjectSchema.parse(body);

      const project = await ProjectService.createProject(validatedData, user);
      return successResponse(project, 201);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async updateProject(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await this.getSessionUser();
      const { id } = await params;
      const body = await req.json();
      const validatedData = updateProjectSchema.parse(body);

      const project = await ProjectService.updateProject(
        parseInt(id, 10),
        validatedData,
        user
      );
      return successResponse(project);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async deleteProject(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await this.getSessionUser();
      const { id } = await params;
      const result = await ProjectService.deleteProject(parseInt(id, 10), user);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
