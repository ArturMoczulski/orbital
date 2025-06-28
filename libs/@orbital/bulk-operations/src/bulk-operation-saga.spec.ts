import { BulkOperation } from "./bulk-operation";
import { BulkOperationFailItem } from "./bulk-operation-result-item";
import { BulkOperationSaga, BulkSaga, saga } from "./bulk-operation-saga";
import { BulkOperationSagaBuilder } from "./bulk-operation-saga-bulider";
import { BulkOperationResponseStatus } from "./types";

describe("BulkOperationSaga", () => {
  it("should run through chapters and accumulate successes and failures", async () => {
    const items = [1, 2, 3, 4];

    // Chapter 1: only even numbers pass
    const filterEvens = async (arr: number[]) => arr.filter((n) => n % 2 === 0);

    // Chapter 2: only numbers divisible by 4 pass
    const filterDivByFour = async (arr: number[]) =>
      arr.filter((n) => n % 4 === 0);

    const sagaResponse = await BulkOperationSaga.itemized<number>(items, [
      filterEvens,
      filterDivByFour,
    ]);

    // After chapter1, 1 and 3 fail; after chapter2, 2 fails; only 4 succeeds.
    const successItems = sagaResponse.items.success.map((r) => r.item);
    const failItems = sagaResponse.items.fail.map((r) => r.item);

    expect(successItems).toEqual([4]);
    // Failures should include 1, 2, 3 in any order
    expect(failItems.sort()).toEqual([1, 2, 3]);
    expect(sagaResponse.status).toBe(
      BulkOperationResponseStatus.PARTIAL_SUCCESS
    );
  });

  it("should stop if a chapter throws and mark remaining items as failed", async () => {
    const items = ["a", "b", "c"];

    // Chapter 1: pass all items
    const passAll = async (arr: string[]) => arr;

    // Chapter 2: throw on all inputs
    const throwError = async (_: string[]) => {
      throw new Error("Test error");
    };

    const sagaResponse = await BulkOperationSaga.itemized<string>(items, [
      passAll,
      throwError,
      passAll, // should not be executed
    ]);

    // All items should appear in failures since chapter2 throws
    const failItems = sagaResponse.items.fail.map((r) => r.item);
    expect(failItems.sort()).toEqual(["a", "b", "c"]);
    expect(sagaResponse.items.success).toHaveLength(0);
    expect(sagaResponse.status).toBe(BulkOperationResponseStatus.FAIL);
  });

  it("should use provided chapter name in failure message", async () => {
    const items = [10, 20];

    // Named chapter that filters but ultimately throws for testing
    const namedThrow = async (arr: number[]) => {
      throw new Error("Oops");
    };
    Object.defineProperty(namedThrow, "name", { value: "MyChapter" });

    const passAll = async (arr: number[]) => arr;

    const sagaResponse = await BulkOperationSaga.itemized<number>(items, [
      { name: "CustomChapter", chapter: passAll },
      namedThrow,
    ]);

    // Inspect the first failure message from namedThrow
    const firstFail = sagaResponse.items.fail[0];
    expect(firstFail.error?.message).toMatch(/CustomChapter|MyChapter/);
  });

  it("should use the function name for unnamed chapter functions", async () => {
    const items = [1, 2];
    // Named function chapter that always throws
    async function myNamedChapter(arr: number[]): Promise<number[]> {
      throw new Error("Function fail");
    }

    const sagaResponse = await BulkOperationSaga.itemized<number>(items, [
      myNamedChapter,
    ]);

    // All items fail, and the error message should include the function name
    const firstFail = sagaResponse.items.fail[0];
    expect(firstFail.error?.message).toMatch(/myNamedChapter/);
  });

  it("should support chapters returning BulkItemizedResponse and pass only success items to next chapter", async () => {
    const items = [1, 2, 3, 4];

    // Chapter that returns an itemized response marking even numbers as success
    async function nestedItemized(arr: number[]) {
      return BulkOperation.itemized<number>(
        arr,
        async (items, success, fail) => {
          for (const item of items) {
            if (item % 2 === 0) {
              success(item, null);
            } else {
              fail(item, { message: "odd number" });
            }
          }
        }
      );
    }

    const sagaResponse = await BulkOperationSaga.itemized<number>(items, [
      nestedItemized,
    ]);

    // Only even numbers should be passed as successes: [2, 4]
    const successItems = sagaResponse.items.success.map((r) => r.item);
    expect(successItems.sort((a, b) => a - b)).toEqual([2, 4]);

    // Odd numbers should be failures
    const failedItems = sagaResponse.items.fail.map((r) => r.item);
    expect(failedItems.sort((a, b) => a - b)).toEqual([1, 3]);

    // Because some succeeded and some failed, overall status is PARTIAL_SUCCESS
    expect(sagaResponse.status).toBe(
      BulkOperationResponseStatus.PARTIAL_SUCCESS
    );
  });

  it("should record exactly one result per item even with multiple chapters", async () => {
    const items = [1, 2, 3];
    // Chapter that simply passes all items through
    const passAll = async (arr: number[]) => arr;

    // Run saga with three identical chapters
    const sagaResponse = await BulkOperationSaga.itemized<number>(items, [
      passAll,
      passAll,
      passAll,
    ]);

    // Combine success and failure entries
    const allResults = [
      ...sagaResponse.items.success,
      ...sagaResponse.items.fail,
    ];

    // There should be exactly one entry per input item
    expect(allResults.length).toBe(items.length);

    // Each item appears exactly once
    for (const item of items) {
      const occurrences = allResults.filter((r) => r.item === item).length;
      expect(occurrences).toBe(1);
    }

    // Since all chapters pass all items, all should be successes
    expect(sagaResponse.items.success.map((r) => r.item).sort()).toEqual(
      items.slice().sort()
    );
    expect(sagaResponse.items.fail).toHaveLength(0);

    // Overall status should be SUCCESS
    expect(sagaResponse.status).toBe(BulkOperationResponseStatus.SUCCESS);
  });

  it("should invoke onError handler for failures of a chapter without recovering items", async () => {
    const items = [1, 2, 3, 4, 5, 6];
    const failuresCaught: number[] = [];

    // Chapter 1: allow only even numbers
    const filterEvens = async (arr: number[]) => arr.filter((n) => n % 2 === 0);

    // Chapter 2: allow only numbers divisible by 3
    const filterDivByThree = async (arr: number[]) =>
      arr.filter((n) => n % 3 === 0);

    // onError handler should receive items that failed in Chapter 2 (i.e. [2,4] after Chapter 1)
    const onErrorHandler = async (failedItems: number[]) => {
      failuresCaught.push(...failedItems);
    };

    const sagaResponse = await BulkOperationSaga.itemized<number>(
      items,
      filterEvens
    )
      .next(filterDivByThree)
      .onError(onErrorHandler);

    // After Chapter 1 → [2,4,6]; Chapter 2 successes → [6], failures → [2,4]
    // Verify onError captured exactly [2,4]:
    expect(failuresCaught.sort((a, b) => a - b)).toEqual([2, 4]);

    // Final success list should be [6]
    const successItems = sagaResponse.items.success.map((r) => r.item);
    expect(successItems).toEqual([6]);

    // Parent failures should include:
    //   • Chapter 1 failures: [1,3,5]
    //   • Chapter 2 failures: [2,4]
    const allFailItems = sagaResponse.items.fail
      .map((r) => r.item)
      .sort((a, b) => a - b);
    expect(allFailItems).toEqual([1, 2, 3, 4, 5]);

    expect(sagaResponse.status).toBe(
      BulkOperationResponseStatus.PARTIAL_SUCCESS
    );
  });

  it("should invoke forFails handler for failures of a chapter and allow saving custom failure data", async () => {
    const items = [1, 2, 3, 4];
    const failuresCaught: BulkOperationFailItem[] = [];
    // Chapter: only even numbers pass
    const filterEvens = async (arr: number[]) => arr.filter((n) => n % 2 === 0);
    const sagaResponse = await BulkOperationSaga.itemized<number>(
      items,
      filterEvens
    ).forFails(async (failedItems, saveResult) => {
      failuresCaught.push(...failedItems);
      failedItems.forEach((item) =>
        saveResult!(item.item, `error${item.item}`)
      );
    });
    // After chapter, 1 and 3 failed
    expect(failuresCaught.sort((a, b) => a.item - b.item)[0].item).toEqual(1);
    expect(failuresCaught.sort((a, b) => a.item - b.item)[1].item).toEqual(3);
    const failEntries = sagaResponse.items.fail;
    expect(failEntries.map((r) => r.item).sort((a, b) => a - b)).toEqual([
      1, 3,
    ]);
    // The saved data should match custom error values
    expect(failEntries.map((r) => r.data)).toEqual(["error1", "error3"]);
    expect(sagaResponse.status).toBe(
      BulkOperationResponseStatus.PARTIAL_SUCCESS
    );
  });
});

describe("itemizedSaga.next()", () => {
  it("should allow chaining chapters via .next()", async () => {
    const items = [1, 2, 3, 4, 5, 6];

    // Chapter 1: filter evens
    const filterEvens = async (arr: number[]) => arr.filter((n) => n % 2 === 0);
    // Chapter 2: filter divisible by 4
    const filterDivByFour = async (arr: number[]) =>
      arr.filter((n) => n % 4 === 0);

    // Use builder to chain
    const builder = BulkOperationSaga.itemized<number>(items, filterEvens).next(
      filterDivByFour
    );

    const sagaResponse = await builder;

    // After chapter1: [2, 4, 6]; after chapter2: [4]
    // Tests for forFails handler
    it("should not invoke forFails when all items pass", async () => {
      const items = [2, 4, 6];
      const captured: BulkOperationFailItem[] = [];
      const sagaResponse = await BulkOperationSaga.itemized<number>(
        items,
        async (arr) => arr
      ).forFails(async (fail, save) => {
        captured.push(...fail);
        fail.forEach((item) => save!(item.item, "fail"));
      });
      // No failures => captured array remains empty
      expect(captured).toEqual([]);
      expect(sagaResponse.items.fail).toHaveLength(0);
      expect(sagaResponse.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });

    it("should invoke forFails separately for each chapter and save custom data", async () => {
      const items = [1, 2, 3, 4];
      const resultsA: BulkOperationFailItem[][] = [];
      const resultsB: BulkOperationFailItem[][] = [];
      const sagaResponse = await BulkOperationSaga.itemized<number>(
        items,
        async (arr) => arr.filter((n) => n > 1)
      )
        .forFails(async (fail, save) => {
          resultsA.push([...fail]);
          fail.forEach((item) => save!(item.item, item.item * 10));
        })
        .next(async (arr) => arr.filter((n) => n > 2))
        .forFails(async (fail, save) => {
          resultsB.push([...fail]);
          fail.forEach((item) => save!(item.item, item.item * 100));
        })
        .run();
      // After first chapter, only [1] failed
      expect(resultsA).toEqual([[1]]);
      // After second chapter, only [2] failed
      expect(resultsB).toEqual([[2]]);
      // Fail entries should be 1 and 2 with correct data
      const failEntries = sagaResponse.items.fail.sort(
        (a, b) => a.item - b.item
      );
      expect(failEntries.map((r) => r.item)).toEqual([1, 2]);
      expect(failEntries.map((r) => r.data)).toEqual([10, 200]);
      expect(sagaResponse.status).toBe(
        BulkOperationResponseStatus.PARTIAL_SUCCESS
      );
    });
    const successItems = sagaResponse.items.success.map((r) => r.item);
    const failItems = sagaResponse.items.fail.map((r) => r.item);

    expect(successItems).toEqual([4]);
    // Failures should include 1,2,3,5,6 in any order
    expect(failItems.sort((a, b) => a - b)).toEqual([1, 2, 3, 5, 6]);
    expect(sagaResponse.status).toBe(
      BulkOperationResponseStatus.PARTIAL_SUCCESS
    );
  });

  it("should support multiple .next() calls", async () => {
    const items = [8, 9, 10, 11, 12];

    // Chapter 1: keep > 8
    const keepGreaterThanEight = async (arr: number[]) =>
      arr.filter((n) => n > 8);
    // Chapter 2: keep even numbers
    const keepEven = async (arr: number[]) => arr.filter((n) => n % 2 === 0);
    // Chapter 3: keep divisible by 3
    const keepDivByThree = async (arr: number[]) =>
      arr.filter((n) => n % 3 === 0);

    const sagaResponse = await BulkOperationSaga.itemized<number>(
      items,
      keepGreaterThanEight
    )
      .next(keepEven)
      .next(keepDivByThree);

    // After chapter1: [9,10,11,12]; chapter2: [10,12]; chapter3: [12]
    const successItems = sagaResponse.items.success.map((r) => r.item);
    const failItems = sagaResponse.items.fail.map((r) => r.item);

    expect(successItems).toEqual([12]);
    expect(failItems.sort((a, b) => a - b)).toEqual([8, 9, 10, 11]);
    expect(sagaResponse.status).toBe(
      BulkOperationResponseStatus.PARTIAL_SUCCESS
    );
  });

  describe("itemizedSaga builder chaining with named chapters (using saga())", () => {
    it("should allow chaining named chapters via .saga().next()", async () => {
      const items = [1, 2, 3, 4, 5, 6];

      // Chapter “FilterEvens”: only even numbers pass
      const filterEvens = async (arr: number[]) =>
        arr.filter((n) => n % 2 === 0);
      // Chapter “FilterDivByFour”: only numbers divisible by 4 pass
      const filterDivByFour = async (arr: number[]) =>
        arr.filter((n) => n % 4 === 0);

      // Start the saga with a named chapter, then chain another named chapter
      const sagaResponse = await saga<number>("testSaga", items)
        .first("FilterEvens", filterEvens)
        .finally("FilterDivByFour", filterDivByFour);

      // After “FilterEvens” → [2, 4, 6]; then “FilterDivByFour” → [4]
      const successItems = sagaResponse.items.success.map((r) => r.item);
      const failItems = sagaResponse.items.fail.map((r) => r.item);

      expect(successItems).toEqual([4]);
      // All other inputs (1, 2, 3, 5, 6) should end up in fail
      expect(failItems.sort((a, b) => a - b)).toEqual([1, 2, 3, 5, 6]);
      expect(sagaResponse.status).toBe(
        BulkOperationResponseStatus.PARTIAL_SUCCESS
      );

      // Verify that failure messages reference the correct chapter names
      // (pick one failure, e.g. “2” was dropped at “FilterDivByFour”)
      const failEntryFor2 = sagaResponse.items.fail.find((r) => r.item === 2)!;
      expect(failEntryFor2.error?.message).toMatch(/FilterDivByFour/);
    });

    it("should support mixing named and unnamed chapters", async () => {
      const items = [10, 11, 12, 13];

      // Unnamed chapter (index “0” in saga)
      const keepAboveTen = async (arr: number[]) => arr.filter((n) => n > 10);
      // Named chapter “KeepEven”
      const keepEven = async (arr: number[]) => arr.filter((n) => n % 2 === 0);

      // Use a named chapter first, then an unnamed chapter, then another named chapter
      const sagaResponse = await saga<number>("testSaga", items)
        .first("KeepAboveTen", keepAboveTen)
        .next(keepEven) // this arrow function has no explicit name, so index “1” will be used
        .finally("KeepDivByThree", async (arr) =>
          arr.filter((n) => n % 3 === 0)
        );

      // After “KeepAboveTen” → [11, 12, 13]
      // After unnamed “keepEven”     → [12]
      // After “KeepDivByThree”       → [12] (12 % 3 === 0)
      const successItems = sagaResponse.items.success.map((r) => r.item);
      const failItems = sagaResponse.items.fail.map((r) => r.item);

      expect(successItems).toEqual([12]);
      // Items that failed at any stage: 10, 11, 13 (order insensitive)
      expect(failItems.sort((a, b) => a - b)).toEqual([10, 11, 13]);
      expect(sagaResponse.status).toBe(
        BulkOperationResponseStatus.PARTIAL_SUCCESS
      );

      // Item 10 should fail at the "KeepAboveTen" chapter
      const failEntryFor10 = sagaResponse.items.fail.find(
        (r) => r.item === 10
      )!;
      expect(failEntryFor10.error?.message).toMatch(/KeepAboveTen/);

      // Item 11 should fail at the "keepEven" chapter
      const failEntryFor11 = sagaResponse.items.fail.find(
        (r) => r.item === 11
      )!;
      expect(failEntryFor11.error?.message).toMatch(/keepEven/);

      // Check that failure for “13” mentions "keepEven" chapter
      const failEntryFor13 = sagaResponse.items.fail.find(
        (r) => r.item === 13
      )!;
      expect(failEntryFor13.error?.message).toMatch(/keepEven/);
    });
  });

  describe("BulkOperationSaga.itemized saveResult callback", () => {
    it("should record chapterResults only for chapters that call saveResult", async () => {
      const items = ["x", "y", "z"];

      // Chapter “first”: uses saveResult to store uppercase value
      const firstChapter = {
        name: "first",
        chapter: async (
          arr: string[],
          saveResult: (item: string, value: any) => void
        ) => {
          arr.forEach((item) => {
            saveResult(item, item.toUpperCase());
          });
          return arr; // pass all items to next chapter
        },
      };

      // Chapter “second”: does not call saveResult (just filters out “y”)
      const secondChapter = {
        name: "second",
        chapter: async (arr: string[]) => {
          // drop “y” but do not call saveResult at all
          return arr.filter((item) => item !== "y");
        },
      };

      // Chapter “third”: uses saveResult to store item length
      const thirdChapter = {
        name: "third",
        chapter: async (
          arr: string[],
          saveResult: (item: string, value: any) => void
        ) => {
          arr.forEach((item) => {
            saveResult(item, item.length);
          });
          return arr.filter((item) => item !== "z"); // drop “z”
        },
      };

      // Run all three chapters in sequence
      const response = await BulkOperationSaga.itemized<string>(items, [
        firstChapter,
        secondChapter,
        thirdChapter,
      ]);

      // After first → all three remain; after second → “x” and “z”; after third → only “x” remains
      expect(response.items.success.map((r) => r.item)).toEqual(["x"]);
      expect(response.items.fail.map((r) => r.item).sort()).toEqual(["y", "z"]);

      // Check “x” (the sole success) has both “first” and “third” keys in chapterResults
      const successEntry = response.items.success.find((r) => r.item === "x")!;
      expect(successEntry.chapterResults).toEqual({
        first: "X",
        third: 1, // length of "x"
      });

      // Check “y” failed in chapter “second”; it should still have firstChapter’s result but no “second” or “third”
      const failY = response.items.fail.find((r) => r.item === "y")!;
      expect(failY.chapterResults).toEqual({
        first: "Y",
      });
      expect(failY.chapterResults).not.toHaveProperty("second");
      expect(failY.chapterResults).not.toHaveProperty("third");

      // Check “z” failed in chapter “third”; it should have “first” and “third” but not “second”
      const failZ = response.items.fail.find((r) => r.item === "z")!;
      expect(failZ.chapterResults).toEqual({
        first: "Z",
        third: 1, // length of "z"
      });
      expect(failZ.chapterResults).not.toHaveProperty("second");

      // Overall status is PARTIAL_SUCCESS
      expect(response.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should preserve earlier chapterResults for items that fail in a later chapter", async () => {
      const items = ["p", "q"];

      // First chapter: saveResult and filter out "q"
      const firstChapter = {
        name: "first",
        chapter: async (
          arr: string[],
          saveResult: (item: string, value: any) => void
        ) => {
          arr.forEach((item) => {
            saveResult(item, item + "1");
          });
          // Only "p" passes to next chapter
          return arr.filter((item) => item === "p");
        },
      };

      // Second chapter: saveResult only for "p"
      const secondChapter = {
        name: "second",
        chapter: async (
          arr: string[],
          saveResult: (item: string, value: any) => void
        ) => {
          arr.forEach((item) => {
            saveResult(item, item + "2");
          });
          // Keep all passed items
          return arr;
        },
      };

      const response = await BulkOperationSaga.itemized<string>(items, [
        firstChapter,
        secondChapter,
      ]);

      // "p" succeeds through both chapters
      const successEntry = response.items.success.find((r) => r.item === "p")!;
      expect(successEntry.chapterResults).toEqual({
        first: "p1",
        second: "p2",
      });

      // "q" fails in the first chapter and only has the first-chapter result
      const failEntry = response.items.fail.find((r) => r.item === "q")!;
      expect(failEntry.chapterResults).toEqual({
        first: "q1",
      });

      expect(response.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });
  });

  describe("BulkOperationSaga metadata", () => {
    it("should populate metadata when { metadata: true } is passed", async () => {
      const items = ["apple", "banana", "cherry"];

      // Chapter 1: filter out anything not starting with “b”
      // and record its start/stop time
      const filterB = {
        name: "filterB",
        chapter: async (arr: string[]) => {
          return arr.filter((item) => item.startsWith("b"));
        },
      };

      // Chapter 2: map to uppercase using saveResult, then pass all along
      const mapUpper = {
        name: "mapUpper",
        chapter: async (
          arr: string[],
          saveResult: (item: string, val: any) => void
        ) => {
          arr.forEach((item) => {
            saveResult(item, item.toUpperCase());
          });
          return arr;
        },
      };

      // Run with metadata option
      const response = await BulkOperationSaga.itemized<string>(
        items,
        [filterB, mapUpper],
        { metadata: true }
      );

      // The saga should have filtered out “apple” and “cherry” in chapter “filterB”
      expect(response.items.success.map((r) => r.item)).toEqual(["banana"]);
      expect(response.items.fail.map((r) => r.item).sort()).toEqual([
        "apple",
        "cherry",
      ]);

      // Metadata should exist
      expect(response.metadata).toBeDefined();
      const metadata = response.metadata!;

      // Overall profile should be a non-negative number
      expect(typeof metadata.profile).toBe("number");
      expect(metadata.profile).toBeGreaterThanOrEqual(0);

      // Should have exactly two chapters recorded
      expect(Object.keys(metadata.chapters).sort()).toEqual(
        ["filterB", "mapUpper"].sort()
      );

      // Check chapter “filterB” metadata
      const metaFilterB = metadata.chapters["filterB"];
      expect(metaFilterB).toBeDefined();
      // In “filterB”: initial items length 3, passed only 1 (“banana”) → success=1, failed=2
      expect(metaFilterB.success).toBe(1);
      expect(metaFilterB.failed).toBe(2);
      expect(metaFilterB.error).toBeUndefined();
      expect(typeof metaFilterB.profile).toBe("number");
      expect(metaFilterB.profile).toBeGreaterThanOrEqual(0);

      // Check chapter “mapUpper” metadata
      const metaMapUpper = metadata.chapters["mapUpper"];
      expect(metaMapUpper).toBeDefined();
      // At entry to “mapUpper” only “banana” remains → success=1, failed=0
      expect(metaMapUpper.success).toBe(1);
      expect(metaMapUpper.failed).toBe(0);
      expect(metaMapUpper.error).toBeUndefined();
      expect(typeof metaMapUpper.profile).toBe("number");
      expect(metaMapUpper.profile).toBeGreaterThanOrEqual(0);

      // Overall saga status should be PARTIAL_SUCCESS
      expect(response.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should not include metadata when no options or { metadata: false } is passed", async () => {
      const items = ["apple", "banana", "cherry"];

      // Single chapter that passes everything
      const passAll = async (arr: string[]) => arr;

      // Call without options
      const respNoOpt = await BulkOperationSaga.itemized<string>(items, [
        passAll,
      ]);
      expect(respNoOpt.metadata).toBeUndefined();

      // Call explicitly with metadata: false
      const respFalse = await BulkOperationSaga.itemized<string>(
        items,
        [passAll],
        { metadata: false }
      );
      expect(respFalse.metadata).toBeUndefined();
    });
  });

  describe("BulkOperationSaga options.name", () => {
    it("should save the provided saga name in metadata.name", async () => {
      const items = [1, 2, 3];

      // Simple chapter that passes all items
      const passAll = async (arr: number[]) => arr;

      // Run saga with explicit name
      const response = await BulkOperationSaga.itemized<number>(
        items,
        [passAll],
        { metadata: true, name: "MyCustomSaga" }
      );

      expect(response.metadata).toBeDefined();
      expect(response.metadata!.name).toBe("MyCustomSaga");
      expect(response.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });
  });

  describe("@Saga Decorator", () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService();
    });

    it("should create and inject a BulkOperationSagaBuilder with the explicit name", async () => {
      const items = [1, 2, 3];
      // Call method without passing a saga; decorator must create one
      const response = await service.withExplicitName(items);

      // Check overall response status
      expect(response.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);

      // Inspect metadata name
      expect(response.metadata).toBeDefined();
      expect(response.metadata!.name).toBe("explicitSagaName");

      // The first chapter “step1” filters out 1, so only [2,3] enter final step
      // Final step multiplies by 10, so success items should be [20, 30]
      const successItems = response.items.success.map((r) => r.item);
      expect(successItems.sort((a, b) => a - b)).toEqual([20, 30]);
    });

    it("should fall back to using the method name when no name is passed", async () => {
      const items = ["a", "b", "c"];
      // Call method without passing a saga; decorator must create one named “withoutName”
      const response = await service.withoutName(items);

      expect(response.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);

      // Metadata name should equal the method name "withoutName"
      expect(response.metadata).toBeDefined();
      expect(response.metadata!.name).toBe("withoutName");

      // The chapter “uppercase” should convert all to uppercase
      const successItems = response.items.success.map((r) => r.item);
      expect(successItems.sort()).toEqual(["A", "B", "C"]);
    });

    it("should use the provided saga builder if one is passed in", async () => {
      const items = [true, false];
      // Create a custom builder with a different name
      const customBuilder = new BulkOperationSagaBuilder<boolean>(items, {
        metadata: true,
        name: "customName",
      });
      // Add a chapter that flips booleans
      customBuilder.first("flip", async (arr) => arr.map((b) => !b));

      const response = await service.withProvidedSaga(items, customBuilder);

      // Because we passed in customBuilder, its name should be used, not the decorator’s name
      expect(response.metadata).toBeDefined();
      expect(response.metadata!.name).toBe("customName");

      // The “flip” chapter should flip both values: [false, true]
      const successItems = response.items.success.map((r) => r.item);
      expect(successItems.sort()).toEqual([false, true]);
    });
  });
});

class TestService {
  // Decorator with explicit name and metadata enabled
  // @ts-ignore
  @BulkSaga("explicitSagaName", { metadata: true })
  async withExplicitName(
    items: number[] | number[],
    saga?: BulkOperationSagaBuilder<number>
  ) {
    // Inside, saga should be a valid builder with name “explicitSagaName”
    return saga!
      .first("step1", async (arr) => arr.filter((n) => n > 1))
      .finally("step2", async (arr) => arr.map((n) => n * 10))
      .run();
  }

  // Decorator without a name, metadata enabled
  // @ts-ignore
  @BulkSaga({ metadata: true })
  async withoutName(
    items: string[] | string[],
    saga?: BulkOperationSagaBuilder<string>
  ) {
    // Inside, saga should be a valid builder with name equal to method name “withoutName”
    return saga!
      .next("uppercase", async (arr) => arr.map((s) => s.toUpperCase()))
      .run();
  }

  // If saga is provided explicitly, decorator should not overwrite it, but enable metadata if decorator is used
  // @ts-ignore
  @BulkSaga("ignoredName", { metadata: true })
  async withProvidedSaga(
    items: boolean[] | boolean[],
    saga?: BulkOperationSagaBuilder<boolean>
  ) {
    // Append an extra trivial chapter and return
    return saga!.next("passthrough", async (arr) => arr).run();
  }
}
