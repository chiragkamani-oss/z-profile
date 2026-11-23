import { prisma } from "@/lib/prisma";
import { wp_usermeta } from "@prisma/client";

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
   * List all users with their roles and capabilities for Admin management.
   */
  static async findMany() {
    const users = await prisma.wp_users.findMany({
      orderBy: { ID: "desc" },
      take: 100,
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
}
