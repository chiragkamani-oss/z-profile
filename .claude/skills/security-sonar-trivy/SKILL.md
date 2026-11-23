---
name: security-sonar-trivy
description: Automated security and static analysis checklist for SonarQube and Trivy container scanning
---

# Security, SonarQube & Trivy Compliance Checklist

Before committing or deploying code, verify compliance against the following automated checks:

### 1. SonarQube Static Application Security (SAST)
- [ ] **No Hardcoded Credentials**: Scan with `git diff` for API keys, passwords, or test tokens.
- [ ] **Constant-Time Comparison**: All password and cryptographic token verifications must use `timingSafeEqualStrings` to eliminate side-channel timing attacks.
- [ ] **Strict Input Sanitization**: All incoming route payloads must pass through Zod validators before entering services.
- [ ] **No eval / Dynamic Code**: Ensure zero usage of `eval()`, `new Function()`, or `setTimeout(string)`.
- [ ] **Strict Typing**: Zero `any` types in domain entities and repository returns.

### 2. Trivy Container & Dependency Scanning
- [ ] **Base Image**: Always build on `node:20-alpine`.
- [ ] **Non-Root Execution**: Container must run under unprivileged user `USER nextjs` (UID 1001).
- [ ] **Minimal Footprint**: Use multi-stage Docker build to exclude `npm`, build compilers, and devDependencies from runner stage.
- [ ] **Zero High/Critical Vulnerabilities**: Run `npm audit` and ensure 0 vulnerabilities.

### 3. HTTP Security Headers
- Ensure all security headers are active in `next.config.mjs`:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
