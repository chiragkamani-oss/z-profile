# CLAUDE.md — Zprofile Node

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Stack: Next.js 16 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Prisma ORM (MySQL / TiDB Cloud Serverless on legacy WordPress schema) · NextAuth.js (JWT + WordPress credential hashing) · Jest (Unit & Coverage Tests) · ESLint + Prettier + Husky (pre-commit)

## Commands

```bash
npm run dev                    # Run Next.js dev server on http://localhost:3000
npm run build                  # Prisma generate + Next.js standalone production build
npm start                      # Start production build server
npm test                       # Run Jest unit test suite
npm run test:coverage          # Run test suite with coverage report (must meet >=90% threshold)
npm run lint                   # Run ESLint (Flat Config with core-web-vitals + Prettier)
npm run lint:fix               # Automatically fix ESLint warnings/errors
npm run format                 # Format entire codebase with Prettier
npm run format:check           # Check Prettier formatting compliance
npm run prisma:generate        # Regenerate Prisma Client types
npm run prisma:pull            # Introspect/pull schema changes from existing MySQL DB
```

## Mandatory Rules & Standards

### 1. Security & Compliance (SonarQube, Trivy & DAST Standards)
- **Zero Secrets in Code**: Never commit or hardcode database passwords, JWT secrets, or API keys. Always use environment variables (`process.env`) verified by `env.example`.
- **Strict Input Validation**: Every API endpoint MUST validate request query parameters and body payloads with Zod schemas (`src/server/validators/`) before reaching services or repositories.
- **Timing Attacks**: Use `timingSafeEqualStrings` from `src/server/utils/password-hasher.ts` when comparing passwords or secret tokens.
- **Error Visibility & Sanitization**: Never leak raw SQL or stack traces to clients, but ALWAYS extract and surface specific human-readable Zod validation issue messages in `data.error.message` so frontend forms and toast notifications can show the user exactly what went wrong.
- **Trivy Container Standard**: Keep the multi-stage `Dockerfile` running as unprivileged `nextjs:nodejs` on `node:20-alpine`.
- **DAST & IDOR Enforcement**: Execute regular dynamic tests against live endpoints to verify horizontal privilege boundaries (engineers cannot read/modify other profiles) and vertical boundaries (admin endpoints reject non-admin sessions). Ensure OWASP defensive headers (CSP, HSTS, X-Frame-Options) and secure cookie flags (`HttpOnly; Secure; SameSite=Lax`) are active.

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

### 3. Database Integrity & Cascade Deletions
- **Cascade Deletion Required**: When deleting records from `wp_posts` (profiles, projects, clients), ALWAYS delete dependent `wp_postmeta` (and `wp_term_relationships`) first. Failing to do so triggers Prisma `P2014` foreign key relation errors.
- **Revisions & Children**: Always identify child revisions (`post_parent = id`) and clean up their metadata before deleting the parent post.
- **Distributed Database (TiDB / MySQL) Compatibility**:
  - Never assume auto-increment IDs are sequential increments of $1$. TiDB Serverless uses distributed ID caching (`AUTO_ID_CACHE = 30000`), so new IDs jump into allocated batches (e.g. 30007).
  - Never insert or default to legacy zero-dates (`'0000-00-00 00:00:00'`). Use `DEFAULT CURRENT_TIMESTAMP` or `new Date()`.
  - Use `utf8mb4_unicode_ci` collation for cross-cloud compatibility.

### 4. Data Structures & Algorithms (DSA) Performance
- **Top-K Selection**: Use Min-Heap (`src/lib/algorithms/min-heap.ts`) for high-throughput ranking and filtering ($\mathcal{O}(M \log K)$ runtime and $\mathcal{O}(K)$ auxiliary space) instead of naive full sorting ($\mathcal{O}(M \log M)$).
- **TTL Caching**: Cache expensive static or semi-static read queries (such as taxonomy configurations) using in-memory TTL cache (`src/lib/cache/ttl-cache.ts`) with $\mathcal{O}(1)$ lookups.
- **Zero-Allocation Serialization**: Use single-pass recursive object visitor `serializeBigInt` (`src/lib/utils.ts`) instead of `JSON.parse(JSON.stringify())` to eliminate memory pressure and CPU overhead during BigInt transformation.

### 5. UI, Responsive Layout & Validation Feedback Standard
- **Responsive Layout & Mobile-First Adaptation**:
  - All views must seamlessly adapt from mobile ($375\text{px}$) to desktop ($1280\text{px}+$); avoid hardcoded widths that trigger horizontal scrolling.
  - Tables must always be wrapped in an `overflow-x-auto` container with min-width constraints on the table element (`min-w-[640px]`).
  - Use responsive dialog actions (`flex-col-reverse sm:flex-row sm:justify-end gap-2`).
- **Semantic Design Tokens**: Never hardcode hex values or arbitrary colors. Always use theme variables (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `bg-primary`, `bg-muted`) to ensure consistent dark and light mode rendering.
- **Toast Notifications**: Every form submission handler MUST display `data.error?.message` in `toast.error()` on failure so validation constraints (e.g. username character rules, password minimums) are immediately visible.
- **Inline Alert Banners**: In dialogs and complex forms, provide inline alert banners for errors (`<AlertCircle />` with clear message) so the user does not lose their form context.

### 6. Testing & Quality Gate
- **Coverage Requirement**: Maintain $\ge 90\%$ code coverage across all files in `src/server/` (controllers, repositories, services, utils, validators).
- **Pre-Commit Verification**: Always run `npx tsc --noEmit && npm run test:coverage` to ensure type safety and full test compliance before committing.

### 7. Git & Commit Trailer
- **End every commit message with:**
  ```text
  Authored-By: Zymr, Inc.
  ```
  Do **not** add `Co-Authored-By: Claude ...` or tool attribution trailers.
