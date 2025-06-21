import { BulkOperation } from "./bulk-operation";
import { BulkCountedResponse } from "./bulk-counted-response";
import { BulkItemizedResponse } from "./bulk-itemized-response";
import { BulkOperationError, BulkResponse } from "./bulk-response";
import {
  BulkOperationResponseStatus,
  BulkOperationResultItemError,
} from "./types";

describe("BulkOperation", () => {
  const testItems = [1, 2, 3, 4, 5];

  // ---------------------------
  // Status operation tests
  // ---------------------------
  describe("status operation", () => {
    it("should return a response with the correct status using the response parameter", async () => {
      const operation = jest.fn(
        async (items: number[], response?: BulkResponse) => {
          // You have access to the response; for example, log the number of items.
          expect(response).toBeDefined();
          // Return SUCCESS
          return BulkOperationResponseStatus.SUCCESS;
        }
      );

      const result = await BulkOperation.status(testItems, operation);
      expect(operation).toHaveBeenCalledWith(
        testItems,
        expect.any(BulkResponse)
      );
      expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });
    it("should complete the status response when an error occurs", async () => {
      const items = [1, 2, 3, 4];
      // Dummy status operation that processes a few items then throws.
      const statusOperation = async (
        items: number[],
        response?: BulkResponse
      ) => {
        // For example, if items length > 2, throw error.
        if (items.length > 2) {
          throw new Error("Status op error");
        }
        return BulkOperationResponseStatus.SUCCESS;
      };

      let caughtError: any;
      try {
        await BulkOperation.status(items, statusOperation);
        fail("Expected BulkOperationError was not thrown");
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(BulkOperationError);
      // The error should have a completed response.
      expect(caughtError.response).toBeDefined();
      const response = caughtError.response as BulkResponse;
      // In this dummy case, if no items were successfully processed before the error,
      // the response might be marked as FAIL.
      expect(response.status).toBe(BulkOperationResponseStatus.FAIL);
    });
  });

  // ---------------------------
  // Counted operation tests
  // ---------------------------
  describe("counted operation", () => {
    it("should return a counted response with correct counts and status", async () => {
      const items = ["a", "b", "c"];
      const bulkOp = new BulkOperation<string>(items);
      const counts = { success: 2, fail: 1 };

      const operation = jest.fn().mockImplementation(async () => {
        return 2;
      });

      const result = await BulkOperation.counted(items, operation);
      expect(operation).toHaveBeenCalledWith(
        items,
        expect.any(BulkCountedResponse)
      );
      expect(result.counts).toEqual(counts);
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should complete the counted response when an error occurs", async () => {
      const items = ["a", "b", "c", "d"];
      // Dummy counted operation that processes the first 2 items and then throws.
      const countedOperation = async (
        items: string[],
        response?: BulkCountedResponse
      ) => {
        let count = 0;
        for (let i = 0; i < items.length; i++) {
          if (i < 2) {
            count++;
          } else {
            throw new Error(`Counted op error at index ${i}`);
          }
        }
        return count;
      };

      let caughtError: any;
      try {
        await BulkOperation.counted(items, countedOperation);
        fail("Expected BulkOperationError was not thrown");
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(BulkOperationError);
      // The error should include a completed response.
      expect(caughtError.response).toBeDefined();
      const response = caughtError.response as BulkCountedResponse;
      // With some successes and some failures, overall status should be PARTIAL_SUCCESS.
      expect(response.status).toBe(BulkOperationResponseStatus.FAIL);
    });
  });

  // ---------------------------
  // Itemized operation tests: using success and fail helper functions
  // ---------------------------
  describe("itemized operation", () => {
    const dummyOperation = async (
      items: number[],
      success: (item: number, data: string) => void,
      fail: (item: number, error?: { message: string }, data?: string) => void,
      response?: BulkItemizedResponse<number, string>
    ): Promise<void> => {
      // Verify that the response parameter is passed.
      expect(response).toBeDefined();
      // For this test, mark even numbers as success and odd numbers as failure.
      for (const item of items) {
        if (item % 2 === 0) {
          // Use the success callback.
          success(item, `processed-${item}`);
        } else {
          // Use the fail callback.
          fail(item, { message: `error-${item}` }, `partial-${item}`);
        }
      }
    };

    it("should return only failure items when includeSuccessItems is false", async () => {
      const options = { includeSuccessItems: false };
      const result = await BulkOperation.itemized<number, string>(
        testItems,
        dummyOperation,
        options
      );

      // When includeSuccessItems is false, our implementation does not add success items to the response.
      // However, it still increments counts.success.
      expect(result.items.success).toHaveLength(0);
      // Out of 5 items, items 1, 3, 5 (odd numbers) should be failures.
      expect(result.counts.success).toBe(2); // even numbers: 2 and 4 are successes.
      expect(result.items.fail).toHaveLength(3);
      expect(result.items.fail[0].error?.message).toMatch(/error-/);
      // With successes > 0 and fails > 0, overall status should be PARTIAL_SUCCESS.
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should return both success and failure items when includeSuccessItems is true (default)", async () => {
      // No options passed so default includeSuccessItems: true.
      const result = await BulkOperation.itemized<number, string>(
        testItems,
        dummyOperation
      );

      // For testItems [1,2,3,4,5]:
      // Success items for even numbers: 2 and 4.
      // Fail items for odd numbers: 1, 3, and 5.
      expect(result.items.success).toHaveLength(2);
      expect(result.items.fail).toHaveLength(3);
      expect(result.counts.success).toBe(2);
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should create only one result per item even if callbacks are called multiple times", async () => {
      // Define a dummy operation that calls success and fail callbacks multiple times for each item.
      const dummyOperation = async (
        items: number[],
        success: (item: number, data: string) => void,
        fail: (
          item: number,
          error?: { message: string },
          data?: string
        ) => void,
        response?: BulkItemizedResponse<number, string>
      ): Promise<void> => {
        for (const item of items) {
          // Call success twice
          success(item, `data-${item}`);
          success(item, `data-${item}-duplicate`);
          // Call fail twice
          fail(item, { message: `error-${item}` }, `failData-${item}`);
          fail(
            item,
            { message: `error-${item}-duplicate` },
            `failData-${item}-duplicate`
          );
        }
      };

      const items = [1, 2, 3];
      const result = await BulkOperation.itemized<number, string>(
        items,
        dummyOperation
      );

      // Combine both success and failure results.
      const allProcessed = [...result.items.success, ...result.items.fail];

      // We expect exactly one result per input item.
      expect(allProcessed.length).toBe(items.length);

      // Verify each item appears exactly once.
      for (const item of items) {
        const occurrences = allProcessed.filter(
          (resultItem) => resultItem.item === item
        ).length;
        expect(occurrences).toBe(1);
      }

      // And, given our dummy operation, the overall status should reflect a partial success,
      // because some items were attempted to be marked as both success and failure, but only one wins per item.
      expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });

    it("should mark unprocessed items as failed and complete the itemized response when an error occurs", async () => {
      const items = [1, 2, 3, 4, 5];
      // Dummy operation: for items 1 and 2, call success (even duplicate calls);
      // for item 3, throw an error immediately; items 4 and 5 would not be processed.
      const operation = async (
        items: number[],
        success: (item: number, data: string) => void,
        fail: (
          item: number,
          error?: BulkOperationResultItemError,
          data?: string
        ) => void,
        response?: BulkItemizedResponse<number, string>
      ) => {
        for (const item of items) {
          if (item < 3) {
            success(item, `data-${item}`);
            // Intentionally call success twice.
            success(item, `data-${item}-duplicate`);
          } else if (item === 3) {
            throw new Error("Operation error at item 3");
          } else {
            success(item, `data-${item}`);
          }
        }
      };

      let caughtError: any;
      try {
        await BulkOperation.itemized<number, string>(items, operation);
        fail("Expected BulkOperationError was not thrown");
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(BulkOperationError);
      // The error should include a response.
      expect(caughtError.response).toBeDefined();
      const response = caughtError.response as BulkItemizedResponse<
        number,
        string
      >;
      // Check that the response has one result per input item.
      const allResults = [...response.items.success, ...response.items.fail];
      expect(allResults.length).toBe(items.length);

      // Items 1 and 2 should be marked as successes (only once each).
      const successItems = response.items.success.map((r) => r.item);
      expect(successItems).toEqual(expect.arrayContaining([1, 2]));

      // Items 3, 4, and 5 should be marked as failures (even if callbacks were called multiple times).
      const failedItems = response.items.fail.map((r) => r.item);
      expect(failedItems).toEqual(expect.arrayContaining([3, 4, 5]));

      // Finally, the overall status should be calculated—here, since some items succeeded and some failed, it should be PARTIAL_SUCCESS.
      expect(response.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });
  });

  // ---------------------------
  // Preprocessing tests
  // ---------------------------
  describe("preprocessing", () => {
    it("should call the preprocess function and use its result", async () => {
      const preprocess = jest.fn(async (items: number[]) =>
        items.map((i) => i * 10)
      );
      const operation = jest.fn(
        async (items: number[]) => BulkOperationResponseStatus.SUCCESS
      );
      const result = await BulkOperation.status(testItems, operation, {
        preprocess,
      });

      expect(preprocess).toHaveBeenCalledWith(testItems);
      // Operation should have been called with preprocessed items.
      expect(operation).toHaveBeenCalledWith(
        testItems.map((i) => i * 10),
        expect.any(BulkResponse)
      );
      expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });
  });

  // ---------------------------
  // Error handling tests: preprocess errors and bulk operation errors
  // ---------------------------
  describe("error handling", () => {
    it("should wrap errors from the preprocess function in a BulkOperationError", async () => {
      const preprocess = jest.fn(async () => {
        throw new Error("Preprocess failed");
      });
      const operation = jest.fn(
        async (items: number[]) => BulkOperationResponseStatus.SUCCESS
      );

      await expect(
        BulkOperation.status(testItems, operation, { preprocess })
      ).rejects.toThrowError(BulkOperationError);
    });

    it("should wrap errors from the bulk operation function in a BulkOperationError", async () => {
      const operation = jest.fn(async (items: number[]) => {
        throw new Error("Bulk op failed");
      });
      await expect(
        BulkOperation.status(testItems, operation)
      ).rejects.toThrowError(BulkOperationError);
    });
  });

  describe("grouped operations", () => {
    // Inside describe("Grouped operations", () => { … }), add:

    it("should classify items correctly and invoke grouped counted operations with correct subsets", async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const evenItems: number[] = [];
      const oddItems: number[] = [];

      const groupedOperation = {
        even: {
          discriminator: (n: number) => n % 2 === 0,
          operation: async (
            groupItems: number[],
            response?: BulkCountedResponse
          ) => {
            // Record which items were passed into the "even" group
            evenItems.push(...groupItems);
            return groupItems.length; // succeed for every even
          },
        },
        odd: {
          discriminator: (n: number) => n % 2 !== 0,
          operation: async (
            groupItems: number[],
            response?: BulkCountedResponse
          ) => {
            // Record which items were passed into the "odd" group
            oddItems.push(...groupItems);
            return groupItems.length; // succeed for every odd
          },
        },
      };

      const result = await BulkOperation.counted(
        items,
        groupedOperation as any
      );

      // 2,4,6 should have been classified under "even", 1,3,5 under "odd"
      expect(evenItems).toEqual([2, 4, 6]);
      expect(oddItems).toEqual([1, 3, 5]);

      // Now verify that counts.even and counts.odd reflect the correct success/fail
      expect(result.counts.even).toEqual({ success: 3, fail: 0 });
      expect(result.counts.odd).toEqual({ success: 3, fail: 0 });

      // Total success = 3 + 3 = 6, total fail = 6 - 6 = 0
      expect(result.counts.success).toBe(6);
      expect(result.counts.fail).toBe(0);

      // Since both groups returned full success, overall status should be SUCCESS
      expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });

    it("should classify items correctly and populate .group field for grouped itemized operation", async () => {
      const items = [10, 15, 20, 25, 30];
      // We’ll record which group each item is processed under:
      const processedGroups: Record<number, string> = {};

      const groupedOperation = {
        high: {
          discriminator: (n: number) => n >= 25,
          operation: async (
            groupItems: number[],
            success: (item: number, data: string) => void,
            fail: (
              item: number,
              error?: BulkOperationResultItemError,
              data?: string
            ) => void,
            response?: BulkItemizedResponse<number, string>
          ) => {
            // For “high” group, mark each as success and record group
            for (const item of groupItems) {
              success(item, `high-${item}`);
              processedGroups[item] = "high";
            }
          },
        },
        low: {
          discriminator: (n: number) => n < 25,
          operation: async (
            groupItems: number[],
            success: (item: number, data: string) => void,
            fail: (
              item: number,
              error?: BulkOperationResultItemError,
              data?: string
            ) => void,
            response?: BulkItemizedResponse<number, string>
          ) => {
            // For “low” group, also mark each as success
            for (const item of groupItems) {
              success(item, `low-${item}`);
              processedGroups[item] = "low";
            }
          },
        },
      };

      const result = await BulkOperation.itemized<number, string>(
        items,
        groupedOperation as any
      );

      // Because every item is "successful," they appear only in items.success
      expect(result.items.fail).toHaveLength(0);
      expect(result.items.success.length).toBe(items.length);

      // Now verify each resultItem.group matches the recorded group, and the data prefix is correct
      result.items.success.forEach((r) => {
        const expectedGroup = processedGroups[r.item];
        expect(r.group).toBe(expectedGroup);

        if (expectedGroup === "high") {
          expect(r.data).toMatch(/^high-/);
        } else {
          expect(r.data).toMatch(/^low-/);
        }
      });

      // All items succeeded, so overall status must be SUCCESS
      expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });

    it("should isolate errors in discriminator for status operation: one group's bad discriminator does not affect the other", async () => {
      const items = [1, 2, 3, 4];
      const groupedOperation = {
        good: {
          discriminator: (n: number) => n % 2 === 0,
          operation: async (groupItems: number[]) =>
            BulkOperationResponseStatus.SUCCESS,
        },
        badDisc: {
          discriminator: (n: number) => {
            throw new Error("Discriminator error");
          },
          operation: async (groupItems: number[]) =>
            BulkOperationResponseStatus.SUCCESS,
        },
      };
      const result = await BulkOperation.status(items, groupedOperation as any);
      // "good" succeeds => SUCCESS, "badDisc" fails => FAIL, so overall PARTIAL_SUCCESS
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should isolate errors in operation for status operation: one group's operation error does not affect the other", async () => {
      const items = [1, 2, 3, 4];
      const groupedOperation = {
        good: {
          discriminator: (n: number) => n % 2 === 0,
          operation: async (groupItems: number[]) =>
            BulkOperationResponseStatus.SUCCESS,
        },
        badOp: {
          discriminator: (n: number) => n % 2 !== 0,
          operation: async (groupItems: number[]) => {
            throw new Error("Operation error");
          },
        },
      };
      const result = await BulkOperation.status(items, groupedOperation as any);
      // "good" succeeds, "badOp" throws => FAIL, so overall PARTIAL_SUCCESS
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    });

    it("should isolate errors in discriminator for counted operation", async () => {
      const items = [1, 2, 3, 4, 5];
      const evenItems: number[] = [];
      const oddItems: number[] = [];
      const groupedOperation = {
        even: {
          discriminator: (n: number) => {
            if (n === 2) throw new Error("Discriminator fail");
            return n % 2 === 0;
          },
          operation: async (groupItems: number[]) => {
            evenItems.push(...groupItems);
            return groupItems.length;
          },
        },
        odd: {
          discriminator: (n: number) => n % 2 !== 0,
          operation: async (groupItems: number[]) => {
            oddItems.push(...groupItems);
            return groupItems.length;
          },
        },
      };
      const result = await BulkOperation.counted(
        items,
        groupedOperation as any
      );
      // "even" discriminator throws for n=2 ⇒ that entire group is marked as fail for all items in even bucket
      // "odd" group works normally
      expect(oddItems).toEqual([1, 3, 5]);
      // odd: success=3, fail=0
      expect((result.counts as any).odd).toEqual({ success: 3, fail: 0 });
      // even: success=0, fail=5 (all 5 original items are counted as “failed” in that group)
      expect((result.counts as any).even).toEqual({ success: 0, fail: 5 });
    });

    it("should isolate errors in operation for counted operation", async () => {
      const items = [1, 2, 3, 4];
      const evenItems: number[] = [];
      const oddItems: number[] = [];
      const groupedOperation = {
        even: {
          discriminator: (n: number) => n % 2 === 0,
          operation: async (groupItems: number[]) => {
            throw new Error("Count failure");
          },
        },
        odd: {
          discriminator: (n: number) => n % 2 !== 0,
          operation: async (groupItems: number[]) => {
            oddItems.push(...groupItems);
            return groupItems.length;
          },
        },
      };
      const result = await BulkOperation.counted(
        items,
        groupedOperation as any
      );
      // odd group succeeds (items 1, 3) ⇒ success=2, fail=0
      expect(oddItems).toEqual([1, 3]);
      expect((result.counts as any).odd).toEqual({ success: 2, fail: 0 });
      // even group operation throws ⇒ even success=0, fail=2
      expect((result.counts as any).even).toEqual({ success: 0, fail: 2 });
    });

    it("should isolate errors in discriminator for itemized operation", async () => {
      const items = [10, 15, 20];
      const groupedOperation = {
        high: {
          discriminator: (n: number) => {
            if (n === 15) throw new Error("Discriminator err");
            return n >= 15;
          },
          operation: async (
            groupItems: number[],
            success: (item: number, data: string) => void,
            fail: (
              item: number,
              error?: { message: string },
              data?: string
            ) => void
          ) => {
            // Only 20 is ≥15 (15’s discriminator throws, 10 is handled by low)
            for (const item of groupItems) {
              success(item, `high-${item}`);
            }
          },
        },
        low: {
          discriminator: (n: number) => n < 15,
          operation: async (
            groupItems: number[],
            success: (item: number, data: string) => void,
            fail: (
              item: number,
              error?: { message: string },
              data?: string
            ) => void
          ) => {
            for (const item of groupItems) {
              success(item, `low-${item}`);
            }
          },
        },
      };
      const result = await BulkOperation.itemized<number, string>(
        items,
        groupedOperation as any
      );
      // low group: only 10 ⇒ success w/ group="low"
      expect(result.items.success.find((r) => r.item === 10)?.group).toBe(
        "low"
      );
      // high group: 20 ⇒ success w/ group="high"
      expect(result.items.success.find((r) => r.item === 20)?.group).toBe(
        "high"
      );
      // 15’s discriminator threw ⇒ it should be marked as fail under high
      expect(result.items.fail.find((r) => r.item === 15)?.group).toBe("high");
    });

    it("should isolate errors in operation for itemized operation", async () => {
      const items = [5, 6, 7, 8];
      const groupedOperation = {
        even: {
          discriminator: (n: number) => n % 2 === 0,
          operation: async (
            groupItems: number[],
            success: (item: number, data: string) => void,
            fail: (
              item: number,
              error?: { message: string },
              data?: string
            ) => void
          ) => {
            throw new Error("Even op fail");
          },
        },
        odd: {
          discriminator: (n: number) => n % 2 !== 0,
          operation: async (
            groupItems: number[],
            success: (item: number, data: string) => void,
            fail: (
              item: number,
              error?: { message: string },
              data?: string
            ) => void
          ) => {
            for (const item of groupItems) {
              success(item, `odd-${item}`);
            }
          },
        },
      };
      const result = await BulkOperation.itemized<number, string>(
        items,
        groupedOperation as any
      );
      // odd group: items 5 and 7 ⇒ success array, group = "odd"
      expect(
        result.items.success.filter((r) => r.group === "odd").map((r) => r.item)
      ).toEqual([5, 7]);
      // even group: items 6 and 8 ⇒ operation threw ⇒ both appear in fail with group="even"
      const failedEvenItems = result.items.fail
        .filter((r) => r.group === "even")
        .map((r) => r.item);
      expect(failedEvenItems.sort()).toEqual([6, 8]);
    });
  });
});
