import { prisma } from "@/lib/prisma";
import { wp_usermeta } from "@prisma/client";
import { hashPassword } from "@/server/utils/password-hasher";
import { BadRequestError, NotFoundError } from "@/server/utils/errors";
import { CreateUserInput, UpdateUserInput } from "../validators/user.schema";

export class UserRepository {
  /**
   * Safely extracts WordPress roles from wp_capabilities serialized string.
   */
  static extractRoleFromMeta(metaList: wp_usermeta[]): string {
    const capMeta = metaList.find(
      (m) => m.meta_key === "wp_capabilities" || m.meta_key?.endsWith("capabilities")
    );
    if (!capMeta?.meta_value) {
      return "engineer"; // default fallback
    }

    const val = capMeta.meta_value;
    if (val.includes('"administrator"')) return "administrator";
    if (val.includes('"manager"')) return "manager";
    if (val.includes('"partner"')) return "partner";
    if (val.includes('"sales-person"') || val.includes('"sales_person"'))
      return "sales-person";
    if (val.includes('"editor"')) return "editor";
    if (val.includes('"engineer"')) return "engineer";

    return "engineer";
  }

  /**
   * Checks whether a custom capability exists in user's wp_capabilities meta.
   */
  static hasCapability(metaList: wp_usermeta[], capability: string): boolean {
    const capMeta = metaList.find(
      (m) => m.meta_key === "wp_capabilities" || m.meta_key?.endsWith("capabilities")
    );
    if (!capMeta?.meta_value) return false;

    return (
      capMeta.meta_value.includes(`"${capability}";b:1`) ||
      capMeta.meta_value.includes(`"${capability}";s:1:"1"`)
    );
  }

  /**
   * Builds serialized WordPress capabilities string.
   */
  static buildCapabilitiesMeta(role: string, canShareProfile: boolean): string {
    if (canShareProfile) {
      return `a:2:{s:${role.length}:"${role}";b:1;s:18:"share_zpp_profile";b:1;}`;
    }
    return `a:1:{s:${role.length}:"${role}";b:1;}`;
  }

  /**
   * Returns WordPress user level corresponding to role.
   */
  static getRoleUserLevel(role: string): string {
    switch (role) {
      case "administrator":
        return "10";
      case "manager":
        return "7";
      case "partner":
      case "sales-person":
        return "2";
      default:
        return "1";
    }
  }

  /**
   * List all users with their roles and capabilities for Admin management.
   */
  static async findMany() {
    const users = await prisma.wp_users.findMany({
      orderBy: { ID: "desc" },
      take: 200,
      include: {
        usermeta: true,
      },
    });

    return users.map((u) => ({
      id: u.ID.toString(),
      username: u.user_login,
      displayName: u.display_name || u.user_nicename || u.user_login,
      email: u.user_email,
      registered: u.user_registered,
      role: this.extractRoleFromMeta(u.usermeta),
      canShareProfile: this.hasCapability(u.usermeta, "share_zpp_profile"),
    }));
  }

  /**
   * Find a single user by ID.
   */
  static async findById(id: number) {
    const user = await prisma.wp_users.findUnique({
      where: { ID: BigInt(id) },
      include: { usermeta: true },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return {
      id: user.ID.toString(),
      username: user.user_login,
      displayName: user.display_name || user.user_nicename || user.user_login,
      email: user.user_email,
      registered: user.user_registered,
      role: this.extractRoleFromMeta(user.usermeta),
      canShareProfile: this.hasCapability(user.usermeta, "share_zpp_profile"),
    };
  }

  /**
   * Create a new WordPress user account.
   */
  static async create(data: CreateUserInput) {
    const existing = await prisma.wp_users.findFirst({
      where: {
        OR: [{ user_login: data.username }, { user_email: data.email }],
      },
    });

    if (existing) {
      if (existing.user_login === data.username) {
        throw new BadRequestError(`Username "${data.username}" is already in use`);
      }
      throw new BadRequestError(`Email "${data.email}" is already registered`);
    }

    const hashedPassword = hashPassword(data.password);
    const firstName = data.displayName.split(" ")[0] || data.username;
    const lastName = data.displayName.split(" ").slice(1).join(" ");
    const capabilities = this.buildCapabilitiesMeta(data.role, !!data.canShareProfile);
    const userLevel = this.getRoleUserLevel(data.role);

    const newUser = await prisma.wp_users.create({
      data: {
        user_login: data.username,
        user_pass: hashedPassword,
        user_nicename: data.displayName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        user_email: data.email,
        user_url: "",
        user_registered: new Date(),
        user_status: 0,
        display_name: data.displayName,
        usermeta: {
          create: [
            { meta_key: "nickname", meta_value: data.displayName },
            { meta_key: "first_name", meta_value: firstName },
            { meta_key: "last_name", meta_value: lastName },
            { meta_key: "wp_capabilities", meta_value: capabilities },
            { meta_key: "wp_user_level", meta_value: userLevel },
          ],
        },
      },
      include: { usermeta: true },
    });

    return {
      id: newUser.ID.toString(),
      username: newUser.user_login,
      displayName: newUser.display_name,
      email: newUser.user_email,
      role: data.role,
      canShareProfile: !!data.canShareProfile,
    };
  }

  /**
   * Upsert a user meta entry by user_id and meta_key.
   */
  static async setMeta(userId: bigint, metaKey: string, metaValue: string) {
    const existing = await prisma.wp_usermeta.findFirst({
      where: {
        user_id: userId,
        meta_key: metaKey,
      },
    });

    if (existing) {
      await prisma.wp_usermeta.update({
        where: { umeta_id: existing.umeta_id },
        data: { meta_value: metaValue },
      });
    } else {
      await prisma.wp_usermeta.create({
        data: {
          user_id: userId,
          meta_key: metaKey,
          meta_value: metaValue,
        },
      });
    }
  }

  /**
   * Update an existing user account.
   */
  static async update(id: number, data: UpdateUserInput) {
    const user = await prisma.wp_users.findUnique({
      where: { ID: BigInt(id) },
      include: { usermeta: true },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    const updateFields: Record<string, unknown> = {};
    if (data.displayName) {
      updateFields.display_name = data.displayName;
    }
    if (data.email) {
      // Check email uniqueness if changed
      if (data.email !== user.user_email) {
        const emailExists = await prisma.wp_users.findFirst({
          where: { user_email: data.email, ID: { not: BigInt(id) } },
        });
        if (emailExists) {
          throw new BadRequestError(
            `Email "${data.email}" is already used by another account`
          );
        }
        updateFields.user_email = data.email;
      }
    }
    if (data.password) {
      updateFields.user_pass = hashPassword(data.password);
    }

    if (Object.keys(updateFields).length > 0) {
      await prisma.wp_users.update({
        where: { ID: BigInt(id) },
        data: updateFields,
      });
    }

    const userIdBigInt = BigInt(id);

    // Update names in meta if displayName changed
    if (data.displayName) {
      const firstName = data.displayName.split(" ")[0];
      const lastName = data.displayName.split(" ").slice(1).join(" ");
      await this.setMeta(userIdBigInt, "first_name", firstName);
      await this.setMeta(userIdBigInt, "last_name", lastName);
    }

    // Update role and capabilities if provided
    const currentRole = this.extractRoleFromMeta(user.usermeta);
    const targetRole = data.role || currentRole;
    const currentCanShare = this.hasCapability(user.usermeta, "share_zpp_profile");
    const targetCanShare =
      data.canShareProfile !== undefined ? data.canShareProfile : currentCanShare;

    if (data.role !== undefined || data.canShareProfile !== undefined) {
      const newCapabilities = this.buildCapabilitiesMeta(targetRole, targetCanShare);
      const newUserLevel = this.getRoleUserLevel(targetRole);

      await this.setMeta(userIdBigInt, "wp_capabilities", newCapabilities);
      await this.setMeta(userIdBigInt, "wp_user_level", newUserLevel);
    }

    return this.findById(id);
  }

  /**
   * Delete user and all associated usermeta.
   */
  static async delete(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestError(
        "You cannot delete your own active administrator account"
      );
    }

    const user = await prisma.wp_users.findUnique({
      where: { ID: BigInt(id) },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Delete user meta first
    await prisma.wp_usermeta.deleteMany({
      where: { user_id: BigInt(id) },
    });

    // Delete user
    await prisma.wp_users.delete({
      where: { ID: BigInt(id) },
    });

    return { id: id.toString(), deleted: true };
  }
}
