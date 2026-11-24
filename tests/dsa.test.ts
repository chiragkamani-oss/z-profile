import { MinHeap } from "@/lib/algorithms/min-heap";
import { TTLCache } from "@/lib/cache/ttl-cache";
import { serializeBigInt } from "@/lib/utils";

describe("Data Structures & Algorithms (DSA) Suite", () => {
  describe("MinHeap Priority Queue", () => {
    it("initializes empty heap", () => {
      const heap = new MinHeap<number>((a, b) => a - b);
      expect(heap.size).toBe(0);
      expect(heap.isEmpty()).toBe(true);
      expect(heap.peek()).toBeUndefined();
      expect(heap.pop()).toBeUndefined();
    });

    it("maintains min-heap property on push and pop", () => {
      const heap = new MinHeap<number>((a, b) => a - b);
      [42, 10, 5, 23, 1, 100].forEach((n) => heap.push(n));

      expect(heap.size).toBe(6);
      expect(heap.peek()).toBe(1);

      const sorted: number[] = [];
      while (!heap.isEmpty()) {
        sorted.push(heap.pop()!);
      }

      expect(sorted).toEqual([1, 5, 10, 23, 42, 100]);
    });

    it("maintains Top-K largest items in O(N log K)", () => {
      const heap = new MinHeap<{ name: string; count: number }>(
        (a, b) => a.count - b.count
      );

      const items = [
        { name: "Python", count: 12 },
        { name: "TypeScript", count: 45 },
        { name: "Go", count: 20 },
        { name: "Java", count: 35 },
        { name: "React", count: 50 },
        { name: "Kubernetes", count: 28 },
        { name: "Docker", count: 40 },
        { name: "Terraform", count: 18 },
        { name: "AWS", count: 60 },
      ];

      // Keep Top 3 items
      items.forEach((item) => heap.pushTopK(item, 3));

      expect(heap.size).toBe(3);
      const top3 = heap.toSortedDescending();

      expect(top3.map((x) => x.name)).toEqual(["AWS", "React", "TypeScript"]);
      expect(top3[0].count).toBe(60);
      expect(top3[1].count).toBe(50);
      expect(top3[2].count).toBe(45);
    });

    it("handles zero or negative capacity gracefully in pushTopK", () => {
      const heap = new MinHeap<number>((a, b) => a - b);
      heap.pushTopK(10, 0);
      expect(heap.size).toBe(0);
    });
  });

  describe("TTLCache O(1) Cache", () => {
    it("stores and retrieves values", () => {
      const cache = new TTLCache<string, { role: string }>(10000);
      cache.set("admin", { role: "administrator" });

      expect(cache.has("admin")).toBe(true);
      expect(cache.get("admin")?.role).toBe("administrator");
      expect(cache.size).toBe(1);
    });

    it("returns undefined for missing or deleted keys", () => {
      const cache = new TTLCache<string, string>();
      expect(cache.get("nonexistent")).toBeUndefined();
      expect(cache.has("nonexistent")).toBe(false);

      cache.set("key1", "val1");
      expect(cache.delete("key1")).toBe(true);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("expires keys after TTL", () => {
      const cache = new TTLCache<string, string>(-1); // negative TTL means expired immediately
      cache.set("expiredKey", "expiredVal");

      expect(cache.has("expiredKey")).toBe(false);
      expect(cache.get("expiredKey")).toBeUndefined();
    });

    it("clears all stored keys", () => {
      const cache = new TTLCache<string, number>();
      cache.set("a", 1);
      cache.set("b", 2);
      expect(cache.size).toBe(2);

      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe("serializeBigInt Tree Walker", () => {
    it("serializes nested BigInt and Date values without JSON string overhead", () => {
      const now = new Date();
      const input = {
        id: BigInt(9007199254740991),
        title: "Principal Engineer",
        date: now,
        meta: [
          { key: "experience", value: BigInt(12) },
          { key: "active", value: true },
        ],
        empty: null,
        missing: undefined,
      };

      const serialized = serializeBigInt(input);

      expect(serialized.id as unknown).toBe("9007199254740991");
      expect(serialized.date).toBe(now.toISOString());
      expect(serialized.meta[0].value as unknown).toBe("12");
      expect(serialized.meta[1].value).toBe(true);
      expect(serialized.empty).toBeNull();
      expect(serialized.missing).toBeUndefined();
    });

    it("handles primitives directly", () => {
      expect(serializeBigInt("hello")).toBe("hello");
      expect(serializeBigInt(123)).toBe(123);
      expect(serializeBigInt(null)).toBeNull();
      expect(serializeBigInt(undefined)).toBeUndefined();
      expect(serializeBigInt(BigInt(42)) as unknown).toBe("42");
    });
  });
});
