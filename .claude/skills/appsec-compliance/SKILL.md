---
name: appsec-compliance
description: Production standard for application security compliance covering SAST (SonarQube), Container Hardening (Trivy), and DAST (Runtime & OWASP ZAP)
---

# Application Security Compliance Standard

This skill defines the mandatory security controls, automated scan commands, and penetration test procedures for Zprofile Node.

---

### 1. Static Application Security Testing (SAST / SonarQube)
- **Secrets Management**: Zero credentials in source code. All secrets must resolve via `process.env` documented in `.env.example`.
- **Constant-Time Verification**: Always use `timingSafeEqualStrings` from `src/server/utils/password-hasher.ts` when verifying user passwords or authentication tokens to prevent timing side-channel attacks.
- **Strict Parameter Sanitization**: Every route dispatcher must parse query strings and body payloads through a Zod schema in `src/server/validators/`.
- **Typing Safety**: Avoid `any` types in controller and repository signatures.

---

### 2. Container & Supply Chain Security (Trivy)
- **Base Image**: Always build on official `node:20-alpine`.
- **Unprivileged Execution**: Runtime stage must run as `USER nextjs` (UID 1001).
- **Multi-Stage Build**: Exclude build toolchains, package managers, and development dependencies from the final container artifact.
- **Dependency Scan**:
  ```bash
  npm audit --audit-level=high
  ```

---

### 3. Dynamic Application Security Testing (DAST & IDOR)
Test runtime endpoints against authorization bypass, privilege escalation, and injection:

#### A. IDOR & Access Control Audit
- **Vertical Escalation**: Confirm non-admin tokens receive `HTTP 403 Forbidden` on `/api/users` and `/settings`.
- **Horizontal Escalation**: Confirm an engineer receives `HTTP 403 Forbidden` when attempting to read, update, duplicate, or delete a profile owned by another engineer.
- **Unauthenticated Probing**: Confirm requests lacking a valid NextAuth session token receive `HTTP 401 Unauthorized`.

#### B. Runtime Attack Fuzzing
- **SQLi**: Fuzz `?search=` and filter parameters with boolean and timing SQLi payloads; verify zero database syntax errors or schema leakage.
- **XSS**: Submit HTML/JavaScript payloads (`<script>`, `<img src=x onerror=...>`); verify React JSX and HTML sanitization prevent execution.

#### C. Automated OWASP ZAP Scan
```bash
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-report.html -I
```

---

### 4. HTTP Defensive Headers
Verify all HTTP responses include:
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Absence of `X-Powered-By`.
