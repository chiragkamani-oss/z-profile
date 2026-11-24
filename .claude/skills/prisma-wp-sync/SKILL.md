---
name: prisma-wp-sync
description: Guide for safely synchronizing Prisma ORM with the legacy WordPress database and TiDB Cloud Serverless without schema corruption
---

# Prisma ORM & WordPress Database Synchronization

Zprofile Node shares the existing MySQL / TiDB Cloud database with legacy WordPress tables (`wp_users`, `wp_posts`, `wp_postmeta`, `wp_usermeta`). Follow these procedures to maintain data integrity:

### 1. Pulling Schema Updates
When WordPress plugins or administrators alter the MySQL database schema:
```bash
npm run prisma:pull
npm run prisma:generate
```

### 2. Golden Rules for Legacy Tables
1. **Never Run `prisma migrate dev` or `prisma db push` Against Legacy DB**:
   - Running `db push` or automated migrations can drop legacy indexes or fail on zero-date constraints (`0000-00-00 00:00:00`).
2. **Cascade Deletions Required**:
   - Because `wp_postmeta` references `wp_posts` in Prisma relations, deleting a post directly will trigger:
     `P2014: The change you are trying to make would violate the required relation 'wp_postmetaTowp_posts'`.
   - Always delete child metadata (`wp_postmeta`), child revisions (`post_parent = id`), and taxonomy relations (`wp_term_relationships`) before deleting the main post record:
     ```typescript
     await prisma.wp_postmeta.deleteMany({ where: { post_id: BigInt(id) } });
     await prisma.wp_term_relationships.deleteMany({ where: { object_id: BigInt(id) } });
     await prisma.wp_posts.delete({ where: { ID: BigInt(id) } });
     ```
3. **Distributed Cloud Database (TiDB Serverless) Compatibility**:
   - Distributed auto-increment: IDs are allocated in cached blocks of 30,000 (`AUTO_ID_CACHE = 30000`). New records will have IDs jumping into high numbers (e.g., `30007`). Code must never rely on sequential $+1$ incremental logic.
   - Strict SQL Mode: Zero dates (`0000-00-00 00:00:00`) are rejected. Ensure all date defaults use `DEFAULT CURRENT_TIMESTAMP` or `new Date()`.
   - Collations: Prefer `utf8mb4_unicode_ci` over `utf8mb4_unicode_520_ci`.
4. **BigInt Handling**:
   - WordPress primary keys (`ID`, `umeta_id`, `meta_id`) are `BigInt`.
   - Always wrap responses with `serializeBigInt()` from `@/lib/utils` before JSON serialization.
