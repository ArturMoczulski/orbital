// @ts-nocheck
/**
 * Callback invoked on successful processing of an item in a bulk operation.
 * @param item    The original data item.
 * @param data    The result data for this item.
 */
export type BulkOpItemSuccess<TItem, TResult> = (
  item: TItem,
  data?: TResult
) => void;

/**
 * Callback invoked on failed processing of an item in a bulk operation.
 * @param item    The original data item.
 * @param error   The error information for this failure.
 * @param data    Partial result data (if any) for this item.
 */
export type BulkOpItemFail<TItem, TResult> = (
  item: TItem,
  error?: BulkOperationResultItemError,
  data?: TResult
) => void;
import * as errio from "errio";
import { BulkCountedResponse } from "./bulk-counted-response";
import { BulkItemizedResponse } from "./bulk-itemized-response";
import {
  BulkOperationFailItem,
  BulkOperationSuccessItem,
} from "./bulk-operation-result-item";
import { BulkOperationError, BulkResponse } from "./bulk-response";
import {
  BulkOperationResponseStatus,
  BulkOperationResultItemError,
} from "./types";

export type BulkOperationRequestProcessOptions<DataItemType = any> = {
  preprocess?: (items: DataItemType[]) => Promise<DataItemType[]>;
  includeSuccessItems?: boolean;
};

/**
 * Return type for counted operations when using grouped definitions.
 * - G is the grouped operation type, so keys of G correspond to group names.
 */
export type BulkGroupedCountedResponse<G> = BulkCountedResponse & {
  counts: {
    success: number;
    fail: number;
  } & {
    [K in keyof G]: { success: number; fail: number };
  };
};

/**
 * Return type for itemized operations when using grouped definitions.
 * - G is the grouped operation type, so keys of G correspond to group names.
 */
export type BulkGroupedItemizedResponse<G, ResultItemDataType> =
  BulkItemizedResponse<any, ResultItemDataType> & {
    counts: {
      success: number;
      fail: number;
    } & {
      [K in keyof G]: { success: number; fail: number };
    };
  };

export class BulkOperation<DataItemType = any> {
  static async status<DataItemType = any>(
    items: DataItemType[],
    operation:
      | BulkStatusOperation<DataItemType>
      | BulkGroupedOperation<DataItemType, BulkStatusOperation<DataItemType>>,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ) {
    const normalizedItems = Array.isArray(items) ? items : [items];
    const bulkOp = new BulkOperation<DataItemType>(normalizedItems);
    return await bulkOp.status(normalizedItems, operation, options);
  }

  static async counted<
    DataItemType = any,
    G extends BulkGroupedOperation<
      DataItemType,
      BulkCountedOperation<DataItemType>
    > = {}
  >(
    items: DataItemType[],
    operation: BulkCountedOperation<DataItemType> | G,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<
    keyof G extends never ? BulkCountedResponse : BulkGroupedCountedResponse<G>
  > {
    const normalizedItems = Array.isArray(items) ? items : [items];
    const bulkOp = new BulkOperation<DataItemType>(normalizedItems);
    const result = await bulkOp.counted(
      normalizedItems,
      operation as any,
      options
    );
    return result as any;
  }

  static async itemized<
    DataItemType = any,
    ResultItemDataType = any,
    G extends BulkGroupedOperation<
      DataItemType,
      BulkItemizedOperation<DataItemType, ResultItemDataType>
    > = {}
  >(
    items: DataItemType[],
    operation: BulkItemizedOperation<DataItemType, ResultItemDataType> | G,
    options: BulkOperationRequestProcessOptions<DataItemType> = {
      includeSuccessItems: true,
    }
  ): Promise<
    keyof G extends never
      ? BulkItemizedResponse<DataItemType, ResultItemDataType>
      : BulkGroupedItemizedResponse<G, ResultItemDataType>
  > {
    const normalizedItems = Array.isArray(items) ? items : [items];
    const bulkOp = new BulkOperation<DataItemType>(normalizedItems);
    const result = await bulkOp.itemized<ResultItemDataType>(
      normalizedItems,
      operation as any,
      options
    );
    return result as any;
  }

  constructor(public readonly items: DataItemType[]) {}

  async status(
    items: DataItemType[],
    operation:
      | BulkStatusOperation<DataItemType>
      | BulkGroupedOperation<DataItemType, BulkStatusOperation<DataItemType>>,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<BulkResponse> {
    return (await this.process(
      items,
      operation,
      this.withResponse.bind(this),
      options
    )) as BulkResponse;
  }

  async counted<
    G extends BulkGroupedOperation<
      DataItemType,
      BulkCountedOperation<DataItemType>
    > = {}
  >(
    items: DataItemType[],
    operation: BulkCountedOperation<DataItemType> | G,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<
    keyof G extends never ? BulkCountedResponse : BulkGroupedCountedResponse<G>
  > {
    const result = await this.process(
      items,
      operation as any,
      this.withCountedResponse.bind(this),
      options
    );
    return result as any;
  }

  async itemized<
    ResultItemDataType = any,
    G extends BulkGroupedOperation<
      DataItemType,
      BulkItemizedOperation<DataItemType, ResultItemDataType>
    > = {}
  >(
    items: DataItemType[],
    operation: BulkItemizedOperation<DataItemType, ResultItemDataType> | G,
    options: BulkOperationRequestProcessOptions<DataItemType> = {
      includeSuccessItems: true,
    }
  ): Promise<
    keyof G extends never
      ? BulkItemizedResponse<DataItemType, ResultItemDataType>
      : BulkGroupedItemizedResponse<G, ResultItemDataType>
  > {
    const result = await this.process<ResultItemDataType>(
      items,
      operation as any,
      (items, operation, options) =>
        this.withItemizedResponse<ResultItemDataType>(
          items,
          operation,
          options
        ),
      options
    );
    return result as any;
  }

  protected async process<ResultItemDataType = any>(
    items: DataItemType[],
    operation:
      | BulkOperationType<DataItemType, ResultItemDataType>
      | BulkGroupedOperation<DataItemType, any>,
    responseWrapper: (
      items: DataItemType[],
      operation: any,
      options?: BulkOperationRequestProcessOptions<DataItemType>
    ) => Promise<BulkResponse>,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<BulkResponse> {
    if (!Array.isArray(items)) {
      throw new BulkOperationError(
        new Error(
          `Bulk operation expect an array as input. Received ${typeof items}`
        )
      );
    }

    try {
      options?.preprocess && (items = await options?.preprocess(items));
      return await responseWrapper(items, operation, options);
    } catch (error) {
      if (error instanceof BulkOperationError) {
        throw error;
      } else {
        throw new BulkOperationError(
          { ...errio.toObject(error), stack: error.stack },
          undefined // no response available here
        );
      }
    }
  }

  /**
   * Helper to check if the operation is grouped.
   */
  protected isGrouped<T>(
    operation: any
  ): operation is BulkGroupedOperation<T, any> {
    return typeof operation !== "function" && operation !== null;
  }

  /**
   * Helper to get typed entries for grouped operations.
   */
  protected getEntries<DataItemType>(
    operation: BulkGroupedOperation<DataItemType, any>
  ) {
    return Object.entries(operation) as [
      string,
      { groupBy: (item: DataItemType) => boolean; operation: any }
    ][];
  }

  /**
   * Safely apply a grouped status operation to items per group.
   * Returns the combined status across all groups.
   * Catches errors in discriminator or operation per group, marking that group as FAIL.
   */
  protected async processGroupedStatus(
    items: DataItemType[],
    groups: BulkGroupedOperation<
      DataItemType,
      BulkStatusOperation<DataItemType>
    >,
    response: BulkResponse
  ): Promise<BulkOperationResponseStatus> {
    const groupStatuses: BulkOperationResponseStatus[] = [];

    for (const [, groupObj] of this.getEntries<DataItemType>(groups)) {
      const groupItems: DataItemType[] = [];
      // Track if any discriminator error occurred
      let discriminatorFailed = false;
      for (const item of items) {
        try {
          if (groupObj.groupBy(item)) {
            groupItems.push(item);
          }
        } catch (discErr) {
          // Discriminator threw for this item: mark group as FAIL and break
          groupStatuses.push(BulkOperationResponseStatus.FAIL);
          discriminatorFailed = true;
          break;
        }
      }
      if (discriminatorFailed) {
        continue;
      }
      if (groupItems.length === 0) {
        continue;
      }
      try {
        const status = await groupObj.operation(groupItems, response);
        groupStatuses.push(status);
      } catch (opErr) {
        groupStatuses.push(BulkOperationResponseStatus.FAIL);
      }
    }

    if (groupStatuses.every((s) => s === BulkOperationResponseStatus.SUCCESS)) {
      return BulkOperationResponseStatus.SUCCESS;
    } else if (
      groupStatuses.some((s) => s === BulkOperationResponseStatus.SUCCESS)
    ) {
      return BulkOperationResponseStatus.PARTIAL_SUCCESS;
    } else {
      return BulkOperationResponseStatus.FAIL;
    }
  }

  /**
   * Safely apply a grouped operation to count items per group.
   * Returns an object mapping group names to { success, fail } counts,
   * and accumulates totalSuccess.
   * Catches errors in discriminator or operation per group, marking all items as failed for that group.
   */
  protected async processGroupedCounted(
    items: DataItemType[],
    groups: BulkGroupedOperation<
      DataItemType,
      BulkCountedOperation<DataItemType>
    >,
    response: BulkCountedResponse
  ): Promise<{
    groupCounts: Record<string, { success: number; fail: number }>;
    totalSuccess: number;
  }> {
    const groupCounts: Record<string, { success: number; fail: number }> = {};
    let totalSuccess = 0;

    for (const [groupName, groupObj] of this.getEntries<DataItemType>(groups)) {
      const groupItems: DataItemType[] = [];
      let discriminatorFailed = false;
      for (const item of items) {
        try {
          if (groupObj.groupBy(item)) {
            groupItems.push(item);
          }
        } catch (discErr) {
          // mark entire group as failed
          groupCounts[groupName] = { success: 0, fail: items.length };
          discriminatorFailed = true;
          break;
        }
      }
      if (discriminatorFailed) {
        continue;
      }
      if (groupItems.length === 0) {
        continue;
      }
      try {
        const count = await groupObj.operation(groupItems, response);
        const failCount = groupItems.length - count;
        groupCounts[groupName] = { success: count, fail: failCount };
        totalSuccess += count;
      } catch (opErr) {
        // mark only these items as failed
        groupCounts[groupName] = { success: 0, fail: groupItems.length };
        // do not throw
      }
    }

    return { groupCounts, totalSuccess };
  }

  /**
   * Safely apply a grouped itemized operation to items per group.
   * Calls success/fail callbacks per item, catching errors in discriminator or operation.
   */
  protected async processGroupedItemized<ResultItemDataType>(
    items: DataItemType[],
    groups: BulkGroupedOperation<
      DataItemType,
      BulkItemizedOperation<DataItemType, ResultItemDataType>
    >,
    response: BulkItemizedResponse<DataItemType, ResultItemDataType>
  ): Promise<void> {
    const includeSuccessItems = true; // handled by caller
    const processed = new Set<DataItemType>();

    for (const [groupName, groupObj] of this.getEntries<DataItemType>(groups)) {
      const groupItems: DataItemType[] = [];
      for (const item of items) {
        try {
          if (groupObj.groupBy(item)) {
            groupItems.push(item);
          }
        } catch (discErr) {
          // Only mark this item as fail for this group
          if (!processed.has(item)) {
            processed.add(item);
            response.addFail(
              new BulkOperationFailItem(
                item,
                undefined,
                { message: (discErr as Error).message },
                groupName
              )
            );
          }
          continue;
        }
      }
      if (groupItems.length === 0) {
        continue;
      }
      try {
        await groupObj.operation(
          groupItems,
          (item: DataItemType, data?: ResultItemDataType) => {
            if (!processed.has(item)) {
              processed.add(item);
              response.addSuccess(
                new BulkOperationSuccessItem(item, data, groupName)
              );
            }
          },
          (
            item: DataItemType,
            error?: BulkOperationResultItemError,
            data?: ResultItemDataType
          ) => {
            if (!processed.has(item)) {
              processed.add(item);
              response.addFail(
                new BulkOperationFailItem(item, data, error, groupName)
              );
            }
          },
          response
        );
      } catch (opErr) {
        // Only mark items of this group as failed
        for (const item of groupItems) {
          if (!processed.has(item)) {
            processed.add(item);
            response.addFail(
              new BulkOperationFailItem(
                item,
                undefined,
                { message: (opErr as Error).message },
                groupName
              )
            );
          }
        }
      }
    }
  }

  protected async withResponse(
    items: DataItemType[],
    operation:
      | BulkStatusOperation<DataItemType>
      | BulkGroupedOperation<DataItemType, BulkStatusOperation<DataItemType>>,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<BulkResponse> {
    const response = new BulkResponse();
    try {
      if (this.isGrouped<DataItemType>(operation)) {
        response.status = await this.processGroupedStatus(
          items,
          operation as BulkGroupedOperation<
            DataItemType,
            BulkStatusOperation<DataItemType>
          >,
          response
        );
      } else {
        const status = await operation(items, response as any);
        response.status = status;
      }
    } catch (error) {
      this.handleOperationError(response, error);
    }
    return response.complete();
  }

  handleOperationError(response: BulkResponse, error: Error) {
    response.complete();
    response.status = BulkOperationResponseStatus.FAIL;

    this.wrapError(error, response);
  }

  protected async withCountedResponse(
    items: DataItemType[],
    operation:
      | BulkCountedOperation<DataItemType>
      | BulkGroupedOperation<DataItemType, BulkCountedOperation<DataItemType>>,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<BulkCountedResponse> {
    const response = new BulkCountedResponse();
    try {
      if (this.isGrouped<DataItemType>(operation)) {
        const { groupCounts, totalSuccess } = await this.processGroupedCounted(
          items,
          operation,
          response
        );
        const totalFail = items.length - totalSuccess;
        response.counts = {
          success: totalSuccess,
          fail: totalFail,
          ...groupCounts,
        };
      } else {
        const count = await operation(items, response as any);
        response.counts = { success: count, fail: items.length - count };
      }
    } catch (err) {
      this.handleCountedOperationError(response, err);
    }
    return response.complete();
  }

  handleCountedOperationError(response: BulkCountedResponse, error: Error) {
    // Ensure counts is defined so complete() won't crash.
    if (!response.counts) {
      response.counts = { success: 0, fail: 0 };
    }
    response.complete();
    response.status = BulkOperationResponseStatus.FAIL;

    this.wrapError(error, response);
  }

  protected async withItemizedResponse<ResultItemDataType = any>(
    items: DataItemType[],
    operation:
      | BulkOperationType<DataItemType, ResultItemDataType>
      | BulkGroupedOperation<DataItemType, any>,
    options?: BulkOperationRequestProcessOptions<DataItemType>
  ): Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>> {
    const response = new BulkItemizedResponse<
      DataItemType,
      ResultItemDataType
    >();
    const includeSuccessItems = options?.includeSuccessItems ?? true;
    const processed = new Set<DataItemType>();

    try {
      if (this.isGrouped<DataItemType>(operation)) {
        await this.processGroupedItemized<ResultItemDataType>(
          items,
          operation,
          response
        );
      } else {
        await operation(
          items,
          (item: DataItemType, data?: ResultItemDataType) => {
            if (!processed.has(item)) {
              processed.add(item);
              if (includeSuccessItems) {
                response.addSuccess(new BulkOperationSuccessItem(item, data));
              } else {
                response.counts.success++;
              }
            }
          },
          (
            item: DataItemType,
            error?: BulkOperationResultItemError,
            data?: ResultItemDataType
          ) => {
            if (!processed.has(item)) {
              processed.add(item);
              response.addFail(new BulkOperationFailItem(item, data, error));
            }
          },
          response
        );
      }
    } catch (err) {
      this.handleItemizedOperationError<ResultItemDataType>(
        items,
        processed,
        response,
        err
      );
    }

    return response.complete();
  }

  handleItemizedOperationError<ResultItemDataType = any>(
    items: DataItemType[],
    processed: Set<DataItemType>,
    response: BulkItemizedResponse<DataItemType, ResultItemDataType>,
    error: Error
  ) {
    // 1) Identify all unprocessed items in original order
    const unprocessedItems = items.filter((item) => !processed.has(item));

    // 2) If there is at least one unprocessed item, mark the first one with the actual error
    if (unprocessedItems.length > 0) {
      const firstErroredItem = unprocessedItems[0];
      processed.add(firstErroredItem);
      response.addFail(
        new BulkOperationFailItem(firstErroredItem, undefined, {
          message: error.message,
        })
      );
    }

    // 3) For the remaining unprocessed items, mark them as failed with a generic message
    for (let i = 1; i < unprocessedItems.length; i++) {
      const item = unprocessedItems[i];
      if (!processed.has(item)) {
        processed.add(item);
        response.addFail(
          new BulkOperationFailItem(item, undefined, {
            message: "Not processed due to bulk operation error",
          })
        );
      }
    }

    // 4) Finalize the response status
    response.complete();
    response.status =
      response.items.success.length > 0
        ? BulkOperationResponseStatus.PARTIAL_SUCCESS
        : BulkOperationResponseStatus.FAIL;

    // 5) Wrap and throw the error with the response attached
    this.wrapError(error, response);
  }

  wrapError(err: Error, response: BulkResponse) {
    const bulkError = new BulkOperationError(err, response);
    throw bulkError;
  }
}

export type BulkStatusOperation<DataItemType = any> = (
  items: DataItemType[],
  response?: BulkResponse
) => Promise<BulkOperationResponseStatus>;

export type BulkCountedOperation<DataItemType = any> = (
  items: DataItemType[],
  response?: BulkCountedResponse
) => Promise<number>;

export type BulkItemizedOperation<
  DataItemType = any,
  ResultItemDataType = any
> = (
  items: DataItemType[],
  success: BulkOpItemSuccess<DataItemType, ResultItemDataType>,
  fail: BulkOpItemFail<DataItemType, ResultItemDataType>,
  response?: BulkItemizedResponse<DataItemType, ResultItemDataType>
) => Promise<void>;

export type BulkOperationType<DataItemType = any, ResultItemDataType = any> =
  | BulkStatusOperation<DataItemType>
  | BulkCountedOperation<DataItemType>
  | BulkItemizedOperation<DataItemType, ResultItemDataType>;

/**
 * Shorthand helper for counted bulk operations.
 * 1) When passed a plain operation function, returns BulkCountedResponse.
 * 2) When passed a grouped-operation object, returns BulkGroupedCountedResponse<G>.
 */
// Overload #1: plain operation → BulkCountedResponse
export function counted<DataItemType = any>(
  items: DataItemType | DataItemType[],
  operation: (items: DataItemType[]) => Promise<number>
): Promise<BulkCountedResponse>;

// Overload #2: grouped operation → BulkGroupedCountedResponse<G>
export function counted<
  DataItemType = any,
  G extends BulkGroupedOperation<
    DataItemType,
    BulkCountedOperation<DataItemType>
  > = {}
>(
  items: DataItemType | DataItemType[],
  operation: G
): Promise<BulkGroupedCountedResponse<G>>;

// Implementation (matches either overload)
export function counted(items: any | any[], operation: any): Promise<any> {
  const itemsArray = Array.isArray(items) ? items : [items];
  return BulkOperation.counted(itemsArray, operation as any);
}

/**
 * Shorthand helper for itemized bulk operations.
 * 1) When passed a plain operation function, returns BulkItemizedResponse<…>.
 * 2) When passed a grouped-operation object, returns BulkGroupedItemizedResponse<G, …>.
 */
// Overload #1: plain operation → BulkItemizedResponse
export function itemized<DataItemType = any, ResultItemDataType = any>(
  items: DataItemType | DataItemType[],
  operation: (
    items: DataItemType[],
    success: (item: DataItemType, data: ResultItemDataType) => void,
    fail: (
      item: DataItemType,
      error?: BulkOperationResultItemError,
      data?: ResultItemDataType
    ) => void
  ) => Promise<void>
): Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>>;

// Overload #2: grouped operation → BulkGroupedItemizedResponse<G, ResultItemDataType>
export function itemized<
  DataItemType = any,
  ResultItemDataType = any,
  G extends BulkGroupedOperation<
    DataItemType,
    BulkItemizedOperation<DataItemType, ResultItemDataType>
  > = {}
>(
  items: DataItemType | DataItemType[],
  operation: G
): Promise<BulkGroupedItemizedResponse<G, ResultItemDataType>>;

// Implementation (matches either overload)
export function itemized(items: any | any[], operation: any): Promise<any> {
  const itemsArray = Array.isArray(items) ? items : [items];
  return BulkOperation.itemized(itemsArray, operation as any);
}

/**
 * Represents a grouping of operations keyed by group name.
 * Each group has a groupBy function and an operation function.
 */
export type BulkGroupedOperation<DataItemType = any, OpType = any> = {
  [x: string]: {
    groupBy: (item: DataItemType) => boolean;
    operation: OpType;
  };
};
