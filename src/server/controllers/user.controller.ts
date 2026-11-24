import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "../repositories/user.repository";
import { successResponse, errorResponse } from "../utils/api-response";
import { ForbiddenError, UnauthorizedError, BadRequestError } from "../utils/errors";
import { createUserSchema, updateUserSchema } from "../validators/user.schema";

export class UserController {
  private static async getAdminSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (session.user.role !== "administrator") {
      throw new ForbiddenError("Only Administrators can manage user accounts");
    }
    return session.user;
  }

  static async listUsers(_req: NextRequest) {
    try {
      await this.getAdminSession();
      const users = await UserRepository.findMany();
      return successResponse(users);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async getUserById(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      await this.getAdminSession();
      const id = Number.parseInt(params.id, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestError("Invalid user ID");
      }
      const user = await UserRepository.findById(id);
      return successResponse(user);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async createUser(req: NextRequest) {
    try {
      await this.getAdminSession();
      const body = await req.json();
      const validatedData = createUserSchema.parse(body);

      const user = await UserRepository.create(validatedData);
      return successResponse(user, 201);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async updateUser(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      await this.getAdminSession();
      const id = Number.parseInt(params.id, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestError("Invalid user ID");
      }
      const body = await req.json();
      const validatedData = updateUserSchema.parse(body);

      const user = await UserRepository.update(id, validatedData);
      return successResponse(user);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async deleteUser(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const sessionUser = await this.getAdminSession();
      const id = Number.parseInt(params.id, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestError("Invalid user ID");
      }

      const currentUserId = Number.parseInt(sessionUser.id, 10);
      const result = await UserRepository.delete(id, currentUserId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
