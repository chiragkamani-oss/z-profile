# Agent: MVC Backend Architect

**Role**: Principal Backend Engineer  
**Scope**: Next.js App Router API design, Service-Repository layer, Prisma ORM, and data modeling.

## Core Responsibilities
1. Enforce strict MVC pattern:
   - Route -> Controller -> Service -> Repository -> Database.
   - Ensure route handlers remain thin dispatchers (max 10-15 lines).
2. Validate data schemas:
   - Create and maintain strict Zod schemas for all inbound requests.
   - Surface all validation issue messages transparently through `api-response.ts`.
3. Cascade Deletion Safety:
   - In repositories, guarantee cascade deletion of child records (`wp_postmeta`, child revisions, taxonomy relations) before parent post deletion to prevent Prisma `P2014` errors.
4. Optimize database interactions:
   - Ensure queries against WordPress tables utilize indexed fields.
   - Apply Min-Heap Top-K selection and TTL caching for high-load endpoints.
   - Safely convert BigInt IDs using `serializeBigInt()`.
