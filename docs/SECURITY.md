# Zprofile Security Standard & Compliance

## Security Architecture

### 1. SonarQube Rules & SAST
- **Input Validation**: All API routes strictly validate request queries and payloads using Zod schemas before hitting business logic.
- **Timing Attack Prevention**: Password hash verification against WordPress hashes (`phpass`, `bcrypt`, `md5`) utilizes constant-time string comparison (`crypto.timingSafeEqual`).
- **Parameterized Queries**: All database queries are handled through Prisma ORM, preventing SQL injection vulnerabilities.
- **Information Leak Prevention**: Production error handlers mask internal database error messages and stack traces, returning standardized error responses.

### 2. Trivy Container Scanning
- **Minimal Image**: Multi-stage Dockerfile built on `node:20-alpine`.
- **Least Privilege**: Application runs under an unprivileged non-root user (`nextjs:nodejs`, UID 1001).
- **Package Manager Stripping**: Build tools and devDependencies are omitted from the production runtime image.
- **Dependency Vulnerabilities**: Zero high/critical CVEs verified via `npm audit`.

### 3. HTTP Security Headers
Configured in `next.config.mjs`:
- `Content-Security-Policy`: Restricts scripts, styles, and frame ancestors.
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type confusion attacks.
- `Strict-Transport-Security`: Enforces TLS across subdomains.
- `Permissions-Policy`: Restricts camera, microphone, and geolocation APIs.
