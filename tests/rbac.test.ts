import { UserRepository } from "@/server/repositories/user.repository";
import { wp_usermeta } from "@prisma/client";

describe("UserRepository & RBAC Meta Extraction", () => {
  const createMeta = (key: string, value: string): wp_usermeta => ({
    umeta_id: BigInt(1),
    user_id: BigInt(1),
    meta_key: key,
    meta_value: value,
  });

  it("should extract administrator role correctly", () => {
    const metaList = [createMeta("wp_capabilities", 'a:1:{s:13:"administrator";b:1;}')];
    expect(UserRepository.extractRoleFromMeta(metaList)).toBe("administrator");
  });

  it("should extract manager role correctly", () => {
    const metaList = [createMeta("wp_capabilities", 'a:1:{s:7:"manager";b:1;}')];
    expect(UserRepository.extractRoleFromMeta(metaList)).toBe("manager");
  });

  it("should extract partner role correctly", () => {
    const metaList = [createMeta("wp_capabilities", 'a:1:{s:7:"partner";b:1;}')];
    expect(UserRepository.extractRoleFromMeta(metaList)).toBe("partner");
  });

  it("should fallback to engineer if capabilities specify engineer or default", () => {
    const metaList = [createMeta("wp_capabilities", 'a:1:{s:8:"engineer";b:1;}')];
    expect(UserRepository.extractRoleFromMeta(metaList)).toBe("engineer");
  });

  it("should detect share_zpp_profile capability", () => {
    const metaList = [
      createMeta(
        "wp_capabilities",
        'a:2:{s:8:"engineer";b:1;s:17:"share_zpp_profile";b:1;}'
      ),
    ];
    expect(UserRepository.hasCapability(metaList, "share_zpp_profile")).toBe(true);
  });

  it("should return false when capability is absent", () => {
    const metaList = [createMeta("wp_capabilities", 'a:1:{s:8:"engineer";b:1;}')];
    expect(UserRepository.hasCapability(metaList, "share_zpp_profile")).toBe(false);
  });
});
