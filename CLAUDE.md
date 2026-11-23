# CLAUDE.md — Zprofile Node

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Stack: Next.js 16 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Prisma ORM (MySQL / MariaDB on legacy WordPress schema) · NextAuth.js (JWT + WordPress credential hashing) · ESLint + Prettier + Husky (pre-commit)

## Commands

```bash
npm run dev                    # Run Next.js dev server on http://localhost:3000
npm run build                  # Prisma generate + Next.js standalone production build
npm start                      # Start production build server
npm run lint                   # Run ESLint (Flat Config with core-web-vitals + Prettier)
npm run lint:fix               # Automatically fix ESLint warnings/errors
npm run format                 # Format entire codebase with Prettier
npm run format:check           # Check Prettier formatting compliance
npm run prisma:generate        # Regenerate Prisma Client types
npm run prisma:pull            # Introspect/pull schema changes from existing MySQL DB
```

## Mandatory Rules & Standards

### 1. Security & Compliance (SonarQube & Trivy Standards)
- **Zero Secrets in Code**: Never commit or hardcode database passwords, JWT secrets, or API keys. Always use environment variables (`process.env`) verified by `env.example`.
- **Strict Input Validation**: Every API endpoint MUST validate request query parameters and body payloads with Zod schemas (`src/server/validators/`) before reaching services or repositories.
- **Timing Attacks**: Use `timingSafeEqualStrings` from `src/server/utils/password-hasher.ts` when comparing passwords or secret tokens.
- **Error Obfuscation**: Never leak raw database queries, connection strings, or stack traces to clients. Always return standardized API responses via `src/server/utils/api-response.ts`.
- **Trivy Container Standard**: Keep the multi-stage `Dockerfile` running as unprivileged `nextjs:nodejs` on `node:20-alpine`.

### 2. Architecture: Strict MVC Separation in Next.js
- **View / Router**: `src/app/`
  - Routes in `src/app/api/.../route.ts` must be thin dispatchers (delegate immediately to Controllers).
  - UI pages in `src/app/(dashboard)/...` use React Server & Client Components with shadcn/ui.
- **Controllers [C]**: `src/server/controllers/`
  - Extract session, parse params, validate with Zod, call Service, return HTTP responses.
- **Services [Business Logic]**: `src/server/services/`
  - Enforce RBAC rules, format WordPress postmeta, orchestrate notifications.
- **Repositories [M]**: `src/server/repositories/`
  - Pure database access layer utilizing Prisma Client (`src/lib/prisma.ts`).

### 3. Role-Based Access Control (RBAC)
- **Administrator**: Full access across all profiles, clients, and global settings.
- **Manager**: Reviewer access; can approve profiles, request changes, and view all profiles.
- **Engineer**: Isolated access; can ONLY query/edit their own profile (`post_author = user.id`) and submit profiles for review (`in_review`). Client list filtered to self-created clients.
- **Partner**: Isolated access identical to Engineer for external contractors.
- **share_zpp_profile**: Capability flag allowing profile search, viewing all profiles, and PDF export.

### 4. Git & Commit Trailer
- **End every commit message with:**
  ```text
  Authored-By: Zymr, Inc.
  ```
  Do **not** add `Co-Authored-By: Claude ...` or tool attribution trailers.
