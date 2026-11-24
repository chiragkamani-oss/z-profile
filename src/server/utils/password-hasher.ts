import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Constant-time string comparison to prevent timing attacks (SonarQube Security).
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * WordPress phpass hashing verification.
 * Standard WP passwords use portable phpass hashes starting with $P$ or $H$.
 */
function verifyPhpass(password: string, hash: string): boolean {
  const itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  if (hash.length !== 34) return false;

  const countLog2 = itoa64.indexOf(hash[3]);
  if (countLog2 < 7 || countLog2 > 30) return false;

  let count = 1 << countLog2;
  const salt = hash.substring(4, 12);
  if (salt.length !== 8) return false;

  // prettier-ignore
  let hashVal = crypto.createHash("md5").update(salt + password, "binary").digest(); // NOSONAR
  do {
    // prettier-ignore
    hashVal = crypto.createHash("md5").update(Buffer.concat([hashVal, Buffer.from(password, "binary")])).digest(); // NOSONAR
  } while (--count > 0);

  let output = hash.substring(0, 12);
  let i = 0;
  while (i < 16) {
    let value = hashVal[i++];
    output += itoa64[value & 0x3f];
    if (i < 16) {
      value |= hashVal[i] << 8;
    }
    output += itoa64[(value >> 6) & 0x3f];
    if (i++ >= 16) break;
    if (i < 16) {
      value |= hashVal[i] << 16;
    }
    output += itoa64[(value >> 12) & 0x3f];
    if (i++ >= 16) break;
    output += itoa64[(value >> 18) & 0x3f];
  }

  return timingSafeEqualStrings(output.substring(0, 34), hash);
}

/**
 * Verifies a plaintext password against WordPress hashes:
 * 1. Standard bcrypt ($2y$, $2a$, $2b$)
 * 2. WordPress portable phpass ($P$ or $H$)
 * 3. Legacy MD5
 */
export function verifyWordPressPassword(
  plainPassword: string,
  storedHash: string
): boolean {
  if (!plainPassword || !storedHash) {
    return false;
  }

  // 1. Check bcrypt
  if (
    storedHash.startsWith("$2y$") ||
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$")
  ) {
    const normalizedHash = storedHash.startsWith("$2y$")
      ? "$2a$" + storedHash.slice(4)
      : storedHash;
    try {
      return bcrypt.compareSync(plainPassword, normalizedHash);
    } catch {
      return false;
    }
  }

  // 2. Check WordPress phpass
  if (storedHash.startsWith("$P$") || storedHash.startsWith("$H$")) {
    return verifyPhpass(plainPassword, storedHash);
  }

  // 3. Fallback: Legacy 32-char MD5
  if (storedHash.length === 32) {
    const md5Hash = crypto.createHash("md5").update(plainPassword).digest("hex"); // NOSONAR: Required for legacy WordPress MD5 hash verification
    return timingSafeEqualStrings(md5Hash, storedHash);
  }

  return false;
}

/**
 * Hash a password using bcrypt with standard salt rounds.
 * Generated hashes start with $2a$ or $2b$, which are natively verified
 * by verifyWordPressPassword.
 */
export function hashPassword(plainPassword: string): string {
  return bcrypt.hashSync(plainPassword, 10);
}
