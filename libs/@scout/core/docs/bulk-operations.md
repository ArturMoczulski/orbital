# Bulk Operations Framework

First-class support for bulk operations in TypeScript—standardizing status, counts, and itemized results.
Provides:

- **Status operations**: overall success/fail/partial
- **Counted operations**: aggregate success/fail counts
- **Itemized operations**: per-item success/fail detail
- **Grouped operations**: split items by discriminator
- **Sagas**: multi-step, per-chapter processing with metadata

---

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
3. [Basic Usage](#basic-usage)
   - [Status](#status)
   - [Counted](#counted)
   - [Itemized](#itemized)
4. [Grouped Operations](#grouped-operations)
5. [BulkOperationSaga](#bulkoperationsaga)
6. [Tips & Best Practices](#tips--best-practices)

---

---

## Core Concepts

A **bulk operation** processes a collection of items and returns a standardized result indicating overall success or failure. This package provides four operation types:

- **Status** (`BulkOperation.status`): returns only an overall status (SUCCESS, FAIL, or PARTIAL_SUCCESS). Use when you need a Boolean-style outcome.
- **Counted** (`BulkOperation.counted`): returns counts of successes and failures plus status. Status is PARTIAL_SUCCESS if both successes and failures occur.
- **Itemized** (`BulkOperation.itemized`): returns per-item results (success or failure) with optional data or error details for each item, along with aggregate counts and status.
- **Saga** (`BulkOperationSaga.itemized` / `saga()`): advanced multi-chapter flows. Chain multiple steps (“chapters”), each filtering or transforming items, with per-chapter results, failure hooks, and optional timing metadata.

---

## Basic Usage

### Status

Simple overall status:

```ts
import { BulkOperation, BulkOperationResponseStatus } from "./bulk-operations";

const items = [1, 2, 3];

const res = await BulkOperation.status(items, async (items, response) => {
  // do something
  return BulkOperationResponseStatus.SUCCESS;
});

console.log(res.status === BulkOperationResponseStatus.SUCCESS);
```

### Counted

Aggregate success/fail counts:

```ts
import { BulkOperation } from "./bulk-operations";

const users = ["a", "b", "c"];

const counted = await BulkOperation.counted(users, async (items, resp) => {
  // mark two as success
  return 2;
});

console.log(counted.counts); // { success: 2, fail: 1 }
console.log(counted.toString()); // e.g. "BulkCountedResponse (2) | Total: 3: ✅ 2 ❌ 1"
```

### Itemized

Per-item success/fail with data or error detail:

```ts
import { BulkOperation } from "./bulk-operations";

const numbers = [1, 2, 3, 4, 5];

const itemized = await BulkOperation.itemized<number, string>(
  numbers,
  async (items, success, fail, resp) => {
    for (const x of items) {
      if (x % 2 === 0) {
        success(x, `even:${x}`);
      } else {
        fail(x, { message: "odd" }, `odd:${x}`);
      }
    }
  }
);

console.log(itemized.items.success.length); // 2
console.log(itemized.items.fail.length); // 3
console.log(itemized.status); // PARTIAL_SUCCESS
```

---

## Grouped Operations

Split items into named buckets:

```ts
import { BulkOperation } from "./bulk-operations";

const all = [1, 2, 3, 4, 5, 6];

const result = await BulkOperation.counted(all, {
  evens: {
    groupBy: (n) => n % 2 === 0,
    operation: async (groupItems, resp) => groupItems.length,
  },
  odds: {
    groupBy: (n) => n % 2 !== 0,
    operation: async (groupItems, resp) => groupItems.length,
  },
});

console.log(result.counts.evens); // { success: 3, fail: 0 }
console.log(result.counts.odds); // { success: 3, fail: 0 }
```

Grouped itemized is similar under `.itemized()`.

---

## BulkOperationSaga

Multi‐step processing with chapters:

```ts
import { saga, BulkOperationResponseStatus } from "./bulk-operations";

const items = [1, 2, 3, 4];

const response = await saga("FilterSaga", items)
  .first("KeepEvens", async (xs) => xs.filter((x) => x % 2 === 0))
  .next("KeepDivByFour", async (xs) => xs.filter((x) => x % 4 === 0))
  .run();

console.log(response.items.success.map((r) => r.item)); // [4]
console.log(response.status === BulkOperationResponseStatus.PARTIAL_SUCCESS);
```

- Use `.forFails()` or `.onError()` to catch failures per-chapter.
- Pass `{ metadata: true, name: "MySaga" }` to capture timing.

---

## Tips & Best Practices

- **Idempotent callbacks**: only one success/fail per item; duplicates are ignored.
- **Error wrapping**: any thrown error yields a `BulkOperationError` with attached response.
- **Preprocess**: use `preprocess` option to normalize items.
- **Type-safety**: responses are strongly typed when using generics.

---

Happy bulk processing!
