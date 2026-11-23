import {
  verifyWordPressPassword,
  timingSafeEqualStrings,
} from "@/server/utils/password-hasher";
import bcrypt from "bcryptjs";

describe("Password Hasher & Timing Attack Defense", () => {
  describe("timingSafeEqualStrings", () => {
    it("should return true for identical strings", () => {
      expect(timingSafeEqualStrings("secret_token_123", "secret_token_123")).toBe(true);
    });

    it("should return false for different strings with same length", () => {
      expect(timingSafeEqualStrings("secret_token_123", "secret_token_456")).toBe(false);
    });

    it("should return false for strings with different lengths", () => {
      expect(timingSafeEqualStrings("short", "much_longer_string")).toBe(false);
    });

    it("should return false for non-string types", () => {
      expect(timingSafeEqualStrings(null as any, "test")).toBe(false);
      expect(timingSafeEqualStrings("test", undefined as any)).toBe(false);
    });
  });

  describe("verifyWordPressPassword", () => {
    it("should verify bcrypt hashes correctly", () => {
      const password = "SuperSecretPassword123!";
      const hash = bcrypt.hashSync(password, 10);
      expect(verifyWordPressPassword(password, hash)).toBe(true);
      expect(verifyWordPressPassword("wrong_password", hash)).toBe(false);
    });

    it("should verify normalized $2y$ bcrypt hashes", () => {
      const password = "MySecurePassword2026";
      const hash = bcrypt.hashSync(password, 10).replace(/^\$2a\$/, "$2y$");
      expect(verifyWordPressPassword(password, hash)).toBe(true);
      expect(verifyWordPressPassword("WrongPassword", hash)).toBe(false);
    });

    it("should return false for empty passwords or hashes", () => {
      expect(verifyWordPressPassword("", "$2y$10$something")).toBe(false);
      expect(verifyWordPressPassword("password", "")).toBe(false);
    });
  });
});
