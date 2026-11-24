import { ProjectRepository } from "../repositories/project.repository";
import { CreateProjectInput, UpdateProjectInput } from "../validators/project.schema";
import { CurrentUser } from "./profile.service";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { serializeBigInt } from "@/lib/utils";

export class ProjectService {
  static async listProjects(currentUser: CurrentUser, clientId?: number) {
    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";

    const projects = await ProjectRepository.findMany({
      clientId,
      ...(isRestricted ? { authorId: Number.parseInt(currentUser.id, 10) } : {}),
    });

    return serializeBigInt(projects);
  }

  static async getProjectById(id: number) {
    const project = await ProjectRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return serializeBigInt(project);
  }

  static async createProject(data: CreateProjectInput, currentUser: CurrentUser) {
    const project = await ProjectRepository.create(
      Number.parseInt(currentUser.id, 10),
      data
    );
    return serializeBigInt(project);
  }

  static async updateProject(
    id: number,
    data: UpdateProjectInput,
    currentUser: CurrentUser
  ) {
    const existing = await ProjectRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    if (isRestricted && existing.post_author.toString() !== currentUser.id) {
      throw new ForbiddenError("You are not authorized to edit this project");
    }

    const updated = await ProjectRepository.update(id, data);
    return serializeBigInt(updated);
  }

  static async deleteProject(id: number, currentUser: CurrentUser) {
    const existing = await ProjectRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    if (isRestricted && existing.post_author.toString() !== currentUser.id) {
      throw new ForbiddenError("You are not authorized to delete this project");
    }

    await ProjectRepository.delete(id);
    return { success: true };
  }
}
