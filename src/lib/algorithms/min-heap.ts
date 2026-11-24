/**
 * Generic Binary Min-Heap Priority Queue.
 *
 * Provides O(1) minimum retrieval and O(log K) insertion/deletion.
 * Used for streaming Top-K items ranking in O(N log K) time and O(K) space,
 * avoiding expensive O(N log N) full array sorts.
 */
export class MinHeap<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  /**
   * @param comparator - Returns negative if a < b, positive if a > b, 0 if equal.
   */
  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  push(value: T): void {
    this.heap.push(value);
    this.siftUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.siftDown(0);
    }
    return top;
  }

  /**
   * Top-K streaming maintainer:
   * Maintains exactly at most `capacity` largest items using a Min-Heap.
   * If value is greater than the current minimum, replace root in O(log K).
   */
  pushTopK(value: T, capacity: number): void {
    if (capacity <= 0) return;

    if (this.heap.length < capacity) {
      this.push(value);
    } else if (this.comparator(value, this.heap[0]) > 0) {
      this.heap[0] = value;
      this.siftDown(0);
    }
  }

  /**
   * Returns elements sorted in descending order (highest priority first).
   */
  toSortedDescending(): T[] {
    const copy = [...this.heap];
    return copy.sort((a, b) => this.comparator(b, a));
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.comparator(this.heap[index], this.heap[parent]) < 0) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[parent];
        this.heap[parent] = temp;
        index = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    const length = this.heap.length;
    while ((index << 1) + 1 < length) {
      let smallest = (index << 1) + 1;
      const right = smallest + 1;
      if (right < length && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (this.comparator(this.heap[smallest], this.heap[index]) < 0) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}
