import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "../repositories/user.repository";
import { successResponse, errorResponse } from "../utils/api-response";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

export class UserController {
  static async listUsers(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        throw new UnauthorizedError("Authentication required");
      }

      if (session.user.role !== "administrator") {
        throw new ForbiddenError("Only Administrators can view user management");
      }

      const users = await UserRepository.findMany();
      return successResponse(users);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
