---
name: dsa-performance
description: High-performance data structure and algorithm standards for sorting, caching, and tree-walking
---

# DSA Performance & Efficiency Standard

Follow proven algorithmic patterns to ensure fast response times and minimal server resource usage:

### 1. Min-Heap for Top-K Selection ($\mathcal{O}(M \log K)$)
When selecting top profiles, top projects, or highest-rated skills:
- **Avoid**: Naive full sorting `array.sort()` ($\mathcal{O}(M \log M)$ time, $\mathcal{O}(M)$ space).
- **Use**: Priority Queue Min-Heap (`src/lib/algorithms/min-heap.ts`).
  - Heap size is bounded to $K$.
  - Time complexity: $\mathcal{O}(M \log K)$.
  - Space complexity: $\mathcal{O}(K)$.

```typescript
import { MinHeap } from "@/lib/algorithms/min-heap";

const heap = new MinHeap<Profile>((a, b) => a.score - b.score);
for (const profile of allProfiles) {
  heap.push(profile);
  if (heap.size() > K) heap.pop();
}
const topK = heap.toArray().reverse();
```

### 2. In-Memory TTL Cache ($\mathcal{O}(1)$)
For frequently read, semi-static metadata (e.g. master taxonomy lists, configuration):
- **Use**: In-memory TTL Cache (`src/lib/cache/ttl-cache.ts`).
- Avoid querying the database repeatedly for identical taxonomy requests.
- Automatic expiration and single-flight read capability.

### 3. Zero-Allocation Tree Walker for BigInt Serialization
- **Avoid**: Wasteful `JSON.parse(JSON.stringify(data, replacer))` which causes double string allocations and high GC pressure.
- **Use**: Single-pass recursive object visitor `serializeBigInt` (`src/lib/utils.ts`) that mutates in $\mathcal{O}(V)$ time with zero intermediate JSON serialization overhead.
