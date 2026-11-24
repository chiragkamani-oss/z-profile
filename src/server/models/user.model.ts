export type UserRole =
  "administrator" | "manager" | "partner" | "sales-person" | "editor" | "engineer";

export interface UserModel {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  canShareProfile: boolean;
  registeredAt: string;
}

/**
 * Safely extracts role from serialized WordPress usermeta.
 */
export function extractRoleFromCapabilities(capString?: string | null): UserRole {
  if (!capString) return "engineer";
  if (capString.includes('"administrator"')) return "administrator";
  if (capString.includes('"manager"')) return "manager";
  if (capString.includes('"partner"')) return "partner";
  if (capString.includes('"sales-person"') || capString.includes('"sales_person"'))
    return "sales-person";
  if (capString.includes('"editor"')) return "editor";
  return "engineer";
}

/**
 * Mapper: Translates raw WordPress wp_users & wp_usermeta rows into a clean UserModel.
 */
export function toUserModel(user: any): UserModel {
  let capMetaValue = "";
  let canShare = false;

  if (Array.isArray(user.usermeta)) {
    const cap = user.usermeta.find(
      (m: any) => m.meta_key === "wp_capabilities" || m.meta_key?.endsWith("capabilities")
    );
    if (cap?.meta_value) {
      capMetaValue = cap.meta_value;
      canShare =
        capMetaValue.includes('"share_zpp_profile";b:1') ||
        capMetaValue.includes('"share_zpp_profile";s:1:"1"');
    }
  }

  return {
    id: user.ID?.toString() || "",
    username: user.user_login || "",
    displayName: user.display_name || user.user_nicename || user.user_login || "",
    email: user.user_email || "",
    role: extractRoleFromCapabilities(capMetaValue),
    canShareProfile: canShare,
    registeredAt:
      user.user_registered instanceof Date
        ? user.user_registered.toISOString()
        : String(user.user_registered || ""),
  };
}
