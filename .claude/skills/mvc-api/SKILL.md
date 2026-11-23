---
name: mvc-api
description: Guide and scaffold standard for adding new MVC endpoints in Next.js App Router
---

# MVC API Development Standard

When adding or modifying an API endpoint in Zprofile Node, strictly adhere to the 4-tier MVC structure:

### 1. Validator (`src/server/validators/<domain>.schema.ts`)
Create a strict Zod schema for input sanitization:
```typescript
import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(2).max(100),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;
```

### 2. Repository (`src/server/repositories/<domain>.repository.ts`)
Encapsulate all database operations with Prisma:
```typescript
import { prisma } from "@/lib/prisma";

export class ItemRepository {
  static async findById(id: number) {
    return prisma.wp_posts.findUnique({ where: { ID: BigInt(id) } });
  }
}
```

### 3. Service (`src/server/services/<domain>.service.ts`)
Implement business logic and RBAC checks:
```typescript
import { ItemRepository } from "../repositories/item.repository";
import { ForbiddenError } from "../utils/errors";
import { serializeBigInt } from "@/lib/utils";

export class ItemService {
  static async getItem(id: number, currentUser: CurrentUser) {
    const item = await ItemRepository.findById(id);
    if (!item) throw new NotFoundError("Item not found");
    // RBAC check
    if (currentUser.role === "engineer" && item.post_author.toString() !== currentUser.id) {
      throw new ForbiddenError("Forbidden");
    }
    return serializeBigInt(item);
  }
}
```

### 4. Controller (`src/server/controllers/<domain>.controller.ts`)
Handle session extraction and HTTP formatting:
```typescript
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils/api-response";

export class ItemController {
  static async getItem(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await this.getSessionUser();
      const item = await ItemService.getItem(parseInt(params.id, 10), user);
      return successResponse(item);
    } catch (err) {
      return errorResponse(err);
    }
  }
}
```

### 5. Thin Route (`src/app/api/<domain>/[id]/route.ts`)
```typescript
import { NextRequest } from "next/server";
import { ItemController } from "@/server/controllers/item.controller";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return ItemController.getItem(req, { params: resolved });
}
```
