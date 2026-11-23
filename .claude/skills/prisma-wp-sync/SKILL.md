---
name: prisma-wp-sync
description: Guide for safely synchronizing Prisma ORM with the legacy WordPress database without schema corruption
---

# Prisma ORM & WordPress Database Synchronization

Zprofile Node shares the existing MySQL database with legacy WordPress tables (`wp_users`, `wp_posts`, `wp_postmeta`, `wp_usermeta`). Follow these procedures to maintain data integrity:

### 1. Pulling Schema Updates
When WordPress plugins or administrators alter the MySQL database schema:
```bash
npm run prisma:pull
npm run prisma:generate
```

### 2. Golden Rules for Legacy Tables
1. **Never Run `prisma migrate dev` or `prisma db push` Against Legacy DB**:
   - Running `db push` or automated migrations can drop legacy indexes or modify column constraints required by WordPress core.
2. **BigInt Handling**:
   - WordPress primary keys (`ID`, `umeta_id`, `meta_id`) are `BigInt`.
   - JavaScript cannot natively serialize `BigInt` with `JSON.stringify()`.
   - Always wrap responses with `serializeBigInt()` from `@/lib/utils`.
3. **Serialized Meta Parsing**:
   - Legacy WordPress stores complex objects as PHP serialized strings (e.g. `a:2:{s:4:...}`).
   - New records created by the Next.js app should store meta as valid JSON in `meta_value`, while repository getters should safely parse both JSON and legacy formats.
