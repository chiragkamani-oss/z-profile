import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileService, CurrentUser } from "../services/profile.service";
import {
  createProfileSchema,
  updateProfileSchema,
  updateStatusSchema,
} from "../validators/profile.schema";
import { successResponse, errorResponse } from "../utils/api-response";
import { UnauthorizedError } from "../utils/errors";

export class ProfileController {
  private static async getSessionUser(): Promise<CurrentUser> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError("Authentication required");
    }
    return session.user as CurrentUser;
  }

  static async listProfiles(req: NextRequest) {
    try {
      const user = await this.getSessionUser();
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || undefined;
      const status = searchParams.get("status") || undefined;

      const profiles = await ProfileService.listProfiles(user, search, status);
      return successResponse(profiles);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async getProfileById(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const session = await getServerSession(authOptions);
      const user = session?.user as CurrentUser | undefined;
      const id = parseInt(params.id, 10);
      const profile = await ProfileService.getProfileById(id, user);
      return successResponse(profile);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async createProfile(req: NextRequest) {
    try {
      const user = await this.getSessionUser();
      const body = await req.json();
      const validatedData = createProfileSchema.parse(body);

      const profile = await ProfileService.createProfile(validatedData, user);
      return successResponse(profile, 201);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async updateProfile(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await this.getSessionUser();
      const id = parseInt(params.id, 10);
      const body = await req.json();
      const validatedData = updateProfileSchema.parse(body);

      const profile = await ProfileService.updateProfile(id, validatedData, user);
      return successResponse(profile);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async updateStatus(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await this.getSessionUser();
      const id = parseInt(params.id, 10);
      const body = await req.json();
      const validatedData = updateStatusSchema.parse(body);

      const profile = await ProfileService.updateStatus(id, validatedData, user);
      return successResponse(profile);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async deleteProfile(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await this.getSessionUser();
      const id = parseInt(params.id, 10);
      const result = await ProfileService.deleteProfile(id, user);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
