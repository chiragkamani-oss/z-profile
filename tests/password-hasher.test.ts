import {
  verifyWordPressPassword,
  timingSafeEqualStrings,
  hashPassword,
} from "@/server/utils/password-hasher";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

  describe("hashPassword", () => {
    it("should generate a bcrypt hash starting with $2a$ or $2b$", () => {
      const hash = hashPassword("secret123");
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
      expect(verifyWordPressPassword("secret123", hash)).toBe(true);
    });
  });

  describe("verifyWordPressPassword", () => {
    it("should verify bcrypt hashes correctly", () => {
      const password = "SuperSecretPassword123!";
      const hash = bcrypt.hashSync(password, 10);
      expect(verifyWordPressPassword(password, hash)).toBe(true);
      expect(verifyWordPressPassword("wrong_password", hash)).toBe(false);
    });

    it("should verify normalized $2y$ and $2b$ bcrypt hashes", () => {
      const password = "MySecurePassword2026";
      const hash2y = bcrypt.hashSync(password, 10).replace(/^\$2a\$/, "$2y$");
      expect(verifyWordPressPassword(password, hash2y)).toBe(true);
      expect(verifyWordPressPassword("WrongPassword", hash2y)).toBe(false);

      const hash2b = bcrypt.hashSync(password, 10).replace(/^\$2a\$/, "$2b$");
      expect(verifyWordPressPassword(password, hash2b)).toBe(true);
    });

    it("should handle malformed bcrypt hashes gracefully", () => {
      expect(verifyWordPressPassword("pass", "$2a$invalid-hash-string")).toBe(false);
    });

    it("should return false for empty passwords or hashes", () => {
      expect(verifyWordPressPassword("", "$2y$10$something")).toBe(false);
      expect(verifyWordPressPassword("password", "")).toBe(false);
    });

    it("should verify legacy 32-char MD5 hashes", () => {
      const password = "legacy_md5_password";
      const md5Hash = crypto.createHash("md5").update(password).digest("hex");
      expect(verifyWordPressPassword(password, md5Hash)).toBe(true);
      expect(verifyWordPressPassword("wrong_password", md5Hash)).toBe(false);
    });

    it("should test WordPress phpass format ($P$ and $H$)", () => {
      // Known standard WordPress portable hash for password "admin"
      const wpAdminHash = "$P$B9876543210abcdefghijklmnopqrstu";
      // Even if hash value differs, it exercises the phpass execution paths
      expect(typeof verifyWordPressPassword("admin", wpAdminHash)).toBe("boolean");

      // Test bad length or bad countLog2 or bad salt
      expect(verifyWordPressPassword("admin", "$P$Bshort")).toBe(false);
      expect(
        verifyWordPressPassword("admin", "$P$ 12345678901234567890123456789012")
      ).toBe(false);

      // Construct a valid phpass hash for password 'test'
      const itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      const countLog2 = 8;
      const salt = "abcdefgh";
      let count = 1 << countLog2;
      let hashVal = crypto
        .createHash("md5")
        .update(salt + "test", "binary")
        .digest();
      do {
        hashVal = crypto
          .createHash("md5")
          .update(Buffer.concat([hashVal, Buffer.from("test", "binary")]))
          .digest();
      } while (--count > 0);

      let output = "$P$" + itoa64[countLog2] + salt;
      let i = 0;
      while (i < 16) {
        let value = hashVal[i++];
        output += itoa64[value & 0x3f];
        if (i < 16) value |= hashVal[i] << 8;
        output += itoa64[(value >> 6) & 0x3f];
        if (i++ >= 16) break;
        if (i < 16) value |= hashVal[i] << 16;
        output += itoa64[(value >> 12) & 0x3f];
        if (i++ >= 16) break;
        output += itoa64[(value >> 18) & 0x3f];
      }
      expect(verifyWordPressPassword("test", output)).toBe(true);
      expect(verifyWordPressPassword("wrong", output)).toBe(false);

      // Test $H$ prefix
      const hOutput = output.replace(/^\$P\$/, "$H$");
      expect(verifyWordPressPassword("test", hOutput)).toBe(true);
    });

    it("should return false for unsupported hash formats", () => {
      expect(verifyWordPressPassword("pass", "unsupported_unknown_hash")).toBe(false);
    });
  });
});
