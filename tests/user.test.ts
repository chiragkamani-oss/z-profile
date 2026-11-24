import { createUserSchema, updateUserSchema } from "@/server/validators/user.schema";
import { UserRepository } from "@/server/repositories/user.repository";
import { hashPassword, verifyWordPressPassword } from "@/server/utils/password-hasher";
import { EmailService } from "@/server/services/email.service";

describe("User Management & Password Verification", () => {
  it("validates valid user creation payload", () => {
    const valid = {
      username: "alex.smith",
      displayName: "Alex Smith",
      email: "alex.smith@zymr.com",
      password: "securePassword123",
      role: "engineer",
      canShareProfile: true,
    };
    const result = createUserSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid usernames and short passwords", () => {
    const invalid = {
      username: "alex smith!", // spaces not allowed
      displayName: "Alex",
      email: "not-an-email",
      password: "123", // too short
      role: "unknown_role",
    };
    const result = createUserSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("builds correct serialized WordPress capabilities", () => {
    const metaWithShare = UserRepository.buildCapabilitiesMeta("engineer", true);
    expect(metaWithShare).toContain('"engineer";b:1');
    expect(metaWithShare).toContain('"share_zpp_profile";b:1');

    const metaWithoutShare = UserRepository.buildCapabilitiesMeta("manager", false);
    expect(metaWithoutShare).toContain('"manager";b:1');
    expect(metaWithoutShare).not.toContain('"share_zpp_profile"');
  });

  it("maps roles to WordPress user levels", () => {
    expect(UserRepository.getRoleUserLevel("administrator")).toBe("10");
    expect(UserRepository.getRoleUserLevel("manager")).toBe("7");
    expect(UserRepository.getRoleUserLevel("partner")).toBe("2");
    expect(UserRepository.getRoleUserLevel("sales-person")).toBe("2");
    expect(UserRepository.getRoleUserLevel("engineer")).toBe("1");
  });

  it("hashes password with bcrypt and verifies with verifyWordPressPassword", () => {
    const rawPass = "ZymrSuperSecret2026!";
    const hash = hashPassword(rawPass);

    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    expect(verifyWordPressPassword(rawPass, hash)).toBe(true);
    expect(verifyWordPressPassword("WrongPassword", hash)).toBe(false);
  });

  it("formats and executes missing config notification email without throwing", async () => {
    const result = await EmailService.sendMissingConfigNotification({
      employeeName: "Jane Doe",
      employeeEmail: "jane.doe@zymr.com",
      section: "Technology Skills",
      requestedData: "Apache Kafka",
    });

    expect(result.success).toBe(true);
  });
});
