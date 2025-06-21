import * as archy from "archy";
import * as stringify from "json-stringify-safe";
import { BulkCountedResponse } from "./bulk-counted-response";
import {
  BulkOperationFailItem,
  BulkOperationResultItem,
  BulkOperationSuccessItem,
} from "./bulk-operation-result-item";
import { BulkOperationResponseDTO, BulkOperationResponseStatus } from "./types";
import { BulkResponse } from "./bulk-response";

export class BulkItemizedResponse<
  DataItemType = any,
  ResultItemDataType = any,
  G extends string = never,
> extends BulkCountedResponse<G> {
  constructor(
    public status?: BulkOperationResponseStatus,
    public items: {
      success: BulkOperationResultItem<DataItemType, ResultItemDataType>[];
      fail: BulkOperationResultItem<DataItemType, ResultItemDataType>[];
    } = {
      success: [],
      fail: [],
    }
  ) {
    // Initialize base counts only with success/fail; any groups will be applied via fromJson
    super(status, {
      success: items.success.length,
      fail: items.fail.length,
    } as any);
  }

  addSuccess(item: BulkOperationResultItem<DataItemType, ResultItemDataType>) {
    this.items.success.push(item);
    this.counts.success++;
  }

  addFail(item: BulkOperationResultItem<DataItemType, ResultItemDataType>) {
    this.items.fail.push(item);
    this.counts.fail++;
  }

  // Make the class iterable
  *[Symbol.iterator](): Iterator<
    BulkOperationResultItem<DataItemType, ResultItemDataType>
  > {
    // Yield all success items first
    for (const successItem of this.items.success) {
      yield successItem;
    }
    // Then yield all fail items
    for (const failItem of this.items.fail) {
      yield failItem;
    }
  }

  async ifAnyFailed(callback: () => void) {
    this.items.fail.length > 0 && (await callback());
  }

  forFails(
    callback: (
      item: BulkOperationResultItem<DataItemType, ResultItemDataType>,
      index: number
    ) => void
  ): void {
    this.items.fail.forEach((item, index) => callback(item, index));
  }

  // Helper method to iterate over successful items
  forSuccesses(
    callback: (
      item: BulkOperationResultItem<DataItemType, ResultItemDataType>,
      index: number
    ) => void
  ): void {
    this.items.success.forEach((item, index) => callback(item, index));
  }

  static validateJson(json: BulkOperationResponseDTO) {
    if (!json) {
      throw new Error(
        `Invalid JSON format for BulkItemizedResponse: no data provided ${stringify(
          json
        )}`
      );
    }

    if (json.status === undefined) {
      throw new Error(
        `Invalid JSON format for BulkItemizedResponse: no status in response object: ${stringify(
          json.status
        )}`
      );
    }

    if (
      ![
        BulkOperationResponseStatus.FAIL,
        BulkOperationResponseStatus.PARTIAL_SUCCESS,
        BulkOperationResponseStatus.SUCCESS,
      ].includes(json.status)
    ) {
      throw new Error(
        `Invalid JSON format for BulkItemizedResponse: status ${stringify(
          json.status
        )} not supported`
      );
    }
  }

  static fromJson<DataItemType = any, ResultItemDataType = any>(
    json: BulkOperationResponseDTO
  ): BulkItemizedResponse<DataItemType, ResultItemDataType, string> {
    BulkItemizedResponse.validateJson(json);

    const items = {
      success: Array.isArray(json.items?.success)
        ? json.items.success.map((item: any) =>
            BulkOperationResultItem.fromJson<DataItemType, ResultItemDataType>(
              item
            )
          )
        : [],
      fail: Array.isArray(json.items?.fail)
        ? json.items.fail.map((item: any) =>
            BulkOperationResultItem.fromJson<DataItemType, ResultItemDataType>(
              item
            )
          )
        : [],
    };

    const countsBase = {
      success:
        typeof json.counts?.success === "number"
          ? json.counts.success
          : items.success.length,
      fail:
        typeof json.counts?.fail === "number"
          ? json.counts.fail
          : items.fail.length,
    };
    const groupEntries = Object.entries(json.counts || {}).reduce(
      (acc, [key, value]) => {
        if (
          key !== "success" &&
          key !== "fail" &&
          typeof value === "object" &&
          value !== null
        ) {
          acc[key] = {
            success:
              typeof (value as any).success === "number"
                ? (value as any).success
                : 0,
            fail:
              typeof (value as any).fail === "number" ? (value as any).fail : 0,
          };
        }
        return acc;
      },
      {} as Record<string, { success: number; fail: number }>
    );
    const counts = { ...countsBase, ...groupEntries };
    const instance = new BulkItemizedResponse<
      DataItemType,
      ResultItemDataType,
      string
    >(json.status as BulkOperationResponseStatus, items);
    instance.counts = counts as any;
    return instance;
  }

  static fromJsonItems<DataItemType = any, ResultItemDataType = any>(items: {
    success?: BulkOperationSuccessItem<DataItemType, ResultItemDataType>[];
    fail?: BulkOperationFailItem<DataItemType, ResultItemDataType>[];
  }): BulkItemizedResponse<DataItemType, ResultItemDataType, never> {
    const successCount = Array.isArray(items.success)
      ? items.success.length
      : 0;
    const failCount = Array.isArray(items.fail) ? items.fail.length : 0;
    // Derive status: if any failures exist, status is FAIL; otherwise SUCCESS.
    let status =
      failCount > 0
        ? BulkOperationResponseStatus.FAIL
        : BulkOperationResponseStatus.SUCCESS;

    if (status == BulkOperationResponseStatus.FAIL && successCount > 0) {
      status = BulkOperationResponseStatus.PARTIAL_SUCCESS;
    }

    // Create a JSON object in the expected format.
    const json = {
      status,
      items,
      counts: { success: successCount, fail: failCount },
    };

    // Reuse the existing fromJson to build the instance.
    return BulkItemizedResponse.fromJson<DataItemType, ResultItemDataType>(
      json
    );
  }

  asSingle() {
    if (this.status != BulkOperationResponseStatus.SUCCESS) {
      const error = new Error(this.items.fail[0].error.message);
      error.stack = this.items.fail[0].error.stack;
      throw error;
    }

    return this.items.success[0].data;
  }

  all() {
    return [...this.items.success, ...this.items.fail];
  }

  toString() {
    const maxItems = 30;
    const allItems = this.all();

    // Separate items into successes and failures
    const successes = allItems.filter((item) => !item.error);
    const failures = allItems.filter((item) => item.error);

    const formatGroup = (items) => {
      const displayed = items
        .slice(0, maxItems)
        .map((item, index) => {
          const symbol = item.error ? "❌" : "✅";
          const content = item.error
            ? JSON.stringify({ error: item.error, data: item.data })
            : JSON.stringify(item.data);
          return `${index + 1}: ${symbol} ${content}`;
        })
        .join("\n");

      const remaining = items.length - maxItems;
      return remaining > 0
        ? `${displayed}\n(and ${remaining} more...)`
        : displayed;
    };

    // Concatenate the formatted successes and failures (separated by a newline)
    const formattedOutput = `${formatGroup(successes)}\n${formatGroup(
      failures
    )}`;

    return `${super.toString()}\n${formattedOutput}`;
  }

  complete() {
    const anySuccess = this.counts.success > 0 || this.items.success.length > 0;
    const anyFails = this.counts.fail > 0 || this.items.fail.length > 0;
    this.status = BulkOperationResponseStatus.PARTIAL_SUCCESS;
    if (!anySuccess) this.status = BulkOperationResponseStatus.FAIL;
    if (!anyFails) this.status = BulkOperationResponseStatus.SUCCESS;
    return this;
  }

  /**
   * Helper to match original items to their result items from a nested itemized response.
   * Returns a Map where each key is the original data item and the value is the corresponding result item.
   */
  resultsByItems<DataItemType, ResultItemDataType>(
    nestedResponse: BulkItemizedResponse<DataItemType, ResultItemDataType>
  ): Map<
    DataItemType,
    BulkOperationResultItem<DataItemType, ResultItemDataType>
  > {
    const resultMap = new Map<
      DataItemType,
      BulkOperationResultItem<DataItemType, ResultItemDataType>
    >();
    // Combine successes and failures from nested response and map by item reference
    [...nestedResponse.items.success, ...nestedResponse.items.fail].forEach(
      (resItem) => {
        resultMap.set(resItem.item, resItem);
      }
    );
    return resultMap;
  }

  /**
   * Filters the original items by matching successful nesteresults.
   * @param originalItems An array of original items.
   * @param nestedResponse The BulkItemizedResponse for nested items.
   * @param matchFn A function that maps a nested item (NestedType) to its corresponding original item (OrigType).
   * @returns A subset of originalItems whose matching nested items succeeded.
   */
  static filterBy<OrigType, NestedType, KeyType>(
    originalItems: OrigType[],
    nestedResponse: BulkItemizedResponse<NestedType, any>,
    origKeyFn: (origItem: OrigType) => KeyType,
    nestedKeyFn: (nestedItem: NestedType) => KeyType
  ): OrigType[] {
    // Build a set of keys for nested items that succeeded
    const keySet = new Set<KeyType>();
    nestedResponse.items.success.forEach((resItem) => {
      keySet.add(nestedKeyFn(resItem.item));
    });
    // Return only original items whose key is in keySet
    return originalItems.filter((orig) => keySet.has(origKeyFn(orig)));
  }

  // Inside bulk-operation.ts, add this method to the BulkOperation class

  /**
   * Marks all original items as success using the matching result data from a nested BulkItemizedResponse.
   * Efficiently maps original items to their nested response entries without nested loops.
   *
   * @param originalItems Array of original data items.
   * @param nestedResponse BulkItemizedResponse where each result.item corresponds to an original item.
   * @param success Callback to invoke for each successful match: success(originalItem, nestedData).
   */
  static successForAll<OrigType = any, NestedType = any, ResultDataType = any>(
    originalItems: OrigType[],
    nestedResponse: BulkItemizedResponse<NestedType, ResultDataType>,
    success: (item: OrigType, data: ResultDataType) => void
  ): void {
    // Build a map from nested item -> result item
    const resultMap = nestedResponse.resultsByItems(nestedResponse);

    // For each original item, if there's a corresponding nested result with no error, invoke success
    for (const orig of originalItems) {
      const nestedResult = resultMap.get(orig as any as NestedType);
      if (nestedResult && !nestedResult.error) {
        success(orig, nestedResult.data as ResultDataType);
      }
    }
  }

  /**
   * Logs all failed items in a tree structure using archy.
   * @param logger An injected logger (must have an `error(string)` method).
   */
  public failureSummary(customHeader?: string): string {
    const failures = this.items.fail;

    const header = customHeader
      ? `BulkOperation Failures (${failures.length}): ${customHeader}`
      : `BulkOperation Failures (${failures.length})`;

    if (failures.length === 0) return `${header}: No failures`;

    const tree = {
      label: header,
      nodes: failures.map((f) => {
        const itemLabel = `Item: ${stringify(f.item)}`;

        const errorMessage = f.error ? stringify(f.error) : "<unknown error>";
        // Build stack trace nodes if available
        const stackNodes =
          f.error && (f.error as Error).stack
            ? (f.error as Error).stack.split("\n").map((line) => ({
                label: line.trim(),
                nodes: [],
              }))
            : [];
        return {
          label: itemLabel,
          nodes: [
            { label: `Error: ${errorMessage}`, nodes: [] },
            ...(stackNodes.length > 0
              ? [{ label: "Stack Trace:", nodes: stackNodes }]
              : []),
          ],
        };
      }),
    };

    return archy(tree);
  }
}

/**
 * Shorthand helper that delegates to BulkItemizedResponse.filterBy().
 */
export function filterBy<OrigType, NestedType, KeyType>(
  originalItems: OrigType[],
  nestedResponse: BulkItemizedResponse<NestedType, any>,
  origKeyFn: (origItem: OrigType) => KeyType,
  nestedKeyFn: (nestedItem: NestedType) => KeyType
): OrigType[] {
  return BulkItemizedResponse.filterBy(
    originalItems,
    nestedResponse,
    origKeyFn,
    nestedKeyFn
  );
}

export function successForAll<
  OrigType = any,
  NestedType = any,
  ResultDataType = any,
>(
  originalItems: OrigType[],
  nestedResponse: BulkItemizedResponse<NestedType, ResultDataType>,
  success: (item: OrigType, data: ResultDataType) => void
): void {
  return BulkItemizedResponse.successForAll(
    originalItems,
    nestedResponse,
    success
  );
}
