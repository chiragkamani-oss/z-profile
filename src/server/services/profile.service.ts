import { ProfileRepository } from "../repositories/profile.repository";
import {
  CreateProfileInput,
  UpdateProfileInput,
  UpdateStatusInput,
} from "../validators/profile.schema";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { serializeBigInt } from "@/lib/utils";

export interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  canShareProfile?: boolean;
}

export class ProfileService {
  /**
   * List profiles with RBAC data isolation.
   * - Engineers & Partners can ONLY list their own profiles.
   * - Administrators and users with share_zpp_profile capability can view all profiles.
   */
  static async listProfiles(currentUser: CurrentUser, search?: string, status?: string) {
    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    const authorId = isRestricted ? parseInt(currentUser.id, 10) : undefined;

    const profiles = await ProfileRepository.findMany({
      authorId,
      search,
      status,
    });

    return serializeBigInt(profiles);
  }

  /**
   * Get single profile by ID with permission checks.
   * If currentUser is omitted (public client link), allows viewing published/ready profiles.
   */
  static async getProfileById(id: number, currentUser?: CurrentUser) {
    const profile = await ProfileRepository.findById(id);
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    if (currentUser) {
      const isRestricted =
        currentUser.role === "engineer" || currentUser.role === "partner";
      if (isRestricted && profile.post_author.toString() !== currentUser.id) {
        throw new ForbiddenError("You are not authorized to view this profile");
      }
    }

    return serializeBigInt(profile);
  }

  /**
   * Create a new profile assigned to the current user.
   */
  static async createProfile(data: CreateProfileInput, currentUser: CurrentUser) {
    const authorId = parseInt(currentUser.id, 10);
    const profile = await ProfileRepository.create(authorId, data);
    return serializeBigInt(profile);
  }

  /**
   * Update profile. Engineers/Partners can only edit their own.
   */
  static async updateProfile(
    id: number,
    data: UpdateProfileInput,
    currentUser: CurrentUser
  ) {
    const existing = await ProfileRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Profile not found");
    }

    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    if (isRestricted && existing.post_author.toString() !== currentUser.id) {
      throw new ForbiddenError("You are not authorized to edit this profile");
    }

    const updated = await ProfileRepository.update(id, data);
    return serializeBigInt(updated);
  }

  /**
   * Update profile workflow status (e.g. submit for review, approve, request changes).
   */
  static async updateStatus(
    id: number,
    input: UpdateStatusInput,
    currentUser: CurrentUser
  ) {
    const existing = await ProfileRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Profile not found");
    }

    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    const isAdminOrManager =
      currentUser.role === "administrator" || currentUser.role === "manager";

    // Engineers can only transition their own profile to 'in_review'
    if (isRestricted) {
      if (existing.post_author.toString() !== currentUser.id) {
        throw new ForbiddenError(
          "You are not authorized to change this profile's status"
        );
      }
      if (input.status !== "in_review" && input.status !== "in_draft") {
        throw new ForbiddenError(
          "Engineers can only submit profiles for review or save as draft"
        );
      }
    }

    // Only Admin or Manager can mark as ready or request changes
    if (
      (input.status === "is_ready" ||
        input.status === "review_changes" ||
        input.status === "rejected") &&
      !isAdminOrManager
    ) {
      throw new ForbiddenError(
        "Only Administrators or Managers can approve or request changes"
      );
    }

    const updated = await ProfileRepository.updateStatus(
      id,
      input.status,
      input.feedback
    );
    return serializeBigInt(updated);
  }

  /**
   * Duplicate profile with auto-incremented version number
   */
  static async duplicateProfile(id: number, currentUser: CurrentUser) {
    const profile = await ProfileRepository.findById(id);
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    if (isRestricted && profile.post_author.toString() !== currentUser.id) {
      throw new ForbiddenError("You are not authorized to duplicate this profile");
    }

    const duplicated = await ProfileRepository.duplicate(
      id,
      parseInt(currentUser.id, 10)
    );
    if (!duplicated) {
      throw new NotFoundError("Failed to duplicate profile");
    }

    return serializeBigInt(duplicated);
  }

  /**
   * Delete profile by ID with permission checks.
   */
  static async deleteProfile(id: number, currentUser: CurrentUser) {
    const existing = await ProfileRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Profile not found");
    }

    const isRestricted =
      currentUser.role === "engineer" || currentUser.role === "partner";
    if (isRestricted && existing.post_author.toString() !== currentUser.id) {
      throw new ForbiddenError("You are not authorized to delete this profile");
    }

    await ProfileRepository.delete(id);
    return { success: true };
  }
}
