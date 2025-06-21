// services/shared/core/src/bulk-operations/bulk-operation-saga.ts

import { BulkItemizedResponse } from "./bulk-itemized-response";
import {
  BulkOperationSagaBuilder,
  BuilderOptions,
} from "./bulk-operation-saga-bulider";
import {
  BulkOperationResponseStatus,
  BulkOperationResultItemError,
  BulkOperationResultItemStatus,
} from "./types";
import { BulkOperationResultItem } from "./bulk-operation-result-item";
import * as stringify from "json-stringify-safe";

//
// Chapter typings (inlined for simplicity). These allow chapters
// to optionally receive a saveResult callback or return an itemized response.
//
export type ItemizedSagaChapterFunction<DataItemType> =
  | ((items: DataItemType[]) => Promise<DataItemType[]>)
  | ((
      items: DataItemType[],
      saveResult: (item: DataItemType, value: any) => void,
      saveError?: (item: DataItemType, error: any) => void
    ) => Promise<DataItemType[]>)
  | ((
      items: DataItemType[]
    ) => Promise<BulkItemizedResponse<DataItemType, any>>)
  | ((
      items: DataItemType[],
      saveResult: (item: DataItemType, value: any) => void,
      saveError?: (item: DataItemType, error: any) => void
    ) => Promise<BulkItemizedResponse<DataItemType, any>>);

export interface ItemizedSagaChapter<DataItemType> {
  name?: string;
  chapter: ItemizedSagaChapterFunction<DataItemType>;
  /**
   * Handler for items that did not pass the last chapter.
   */
  forFails?: (
    failedItems: BulkOperationItemizedSagaResultItem<DataItemType, any>[],
    saveResult?: (item: DataItemType, value: any) => void,
    saveError?: (item: DataItemType, error: any) => void
  ) => Promise<void>;
}

//
// Each item’s per‐chapter results (chapterName → saved value).
//
export type ChapterResultsMap = Record<string, any>;

export interface BulkOperationItemizedSagaResultItem<ItemType, ResultType = any>
  extends BulkOperationResultItem<ItemType, ResultType> {
  chapterResults: ChapterResultsMap;
}

//
// Metadata for each chapter: how many passed/failed, any thrown error, and timing.
//
export interface ChapterMetadata {
  success: number;
  failed: number;
  error?: Error;
  profile: number; // milliseconds elapsed for this chapter
}

export interface SagaMetadata {
  chapters: Record<string, ChapterMetadata>;
  profile: number; // milliseconds for the entire saga
  name?: string;
}

export interface BulkOperationItemizedSagaResponse<ItemType, ResultType = any>
  extends BulkItemizedResponse<ItemType, ResultType> {
  items: {
    success: BulkOperationItemizedSagaResultItem<ItemType, ResultType>[];
    fail: BulkOperationItemizedSagaResultItem<ItemType, ResultType>[];
  };
  metadata?: SagaMetadata;
}

export class BulkOperationSaga<DataItemType = any> {
  /**
   * Overload #1: if you pass a single chapter or function, returns a builder.
   */
  static itemized<DataItemType>(
    itemsArray: DataItemType | DataItemType[],
    firstChapter:
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>,
    options?: { metadata?: boolean; name?: string }
  ): BulkOperationSagaBuilder<DataItemType>;

  /**
   * Overload #2: if you pass an array of chapters/functions, run them immediately.
   */
  static itemized<DataItemType>(
    itemsArray: DataItemType | DataItemType[],
    chapters: (
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>
    )[],
    options?: { metadata?: boolean; name?: string }
  ): Promise<BulkOperationItemizedSagaResponse<DataItemType, any>>;

  static itemized<DataItemType>(
    itemsArray: DataItemType | DataItemType[],
    maybeChapters:
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>
      | (
          | ItemizedSagaChapter<DataItemType>
          | ItemizedSagaChapterFunction<DataItemType>
        )[],
    options?: { metadata?: boolean; name?: string }
  ) {
    const normalizedItems = Array.isArray(itemsArray)
      ? itemsArray
      : [itemsArray];

    // If caller gave a single chapter, return a builder with that chapter already added
    if (!Array.isArray(maybeChapters)) {
      const firstChapterObj = BulkOperationSaga.normalizeChapter(
        maybeChapters,
        0
      );
      const builder = new BulkOperationSagaBuilder<DataItemType>(
        normalizedItems,
        { metadata: options?.metadata, name: options?.name }
      );
      builder.first(firstChapterObj);
      return builder;
    }

    const normalizedChapters = (
      maybeChapters as Array<
        | ItemizedSagaChapter<DataItemType>
        | ItemizedSagaChapterFunction<DataItemType>
      >
    ).map((chEntry, index) =>
      BulkOperationSaga.normalizeChapter(chEntry, index)
    );

    return (async () => {
      const sagaStart = Date.now();
      const metadataObj = options?.metadata
        ? BulkOperationSaga.initializeMetadata(options.name)
        : undefined;

      const perItemResults =
        BulkOperationSaga.initializePerItemResults(normalizedItems);
      const allSuccess: BulkOperationItemizedSagaResultItem<
        DataItemType,
        any
      >[] = [];
      const allFail: BulkOperationItemizedSagaResultItem<DataItemType, any>[] =
        [];
      let successCount = 0;
      let failCount = 0;
      let overallStatus: BulkOperationResponseStatus =
        BulkOperationResponseStatus.SUCCESS;
      let currentItems = normalizedItems.slice();

      for (let idx = 0; idx < normalizedChapters.length; idx++) {
        const ch = normalizedChapters[idx];
        const chapterName = ch.name!;

        let chapterStart = 0;
        if (metadataObj) {
          chapterStart = Date.now();
        }

        const { passedItems, chapterError } =
          await BulkOperationSaga.executeChapter(
            ch,
            currentItems,
            perItemResults
          );

        if (chapterError) {
          // Hard failure: record all as failed
          BulkOperationSaga.recordFailuresOnError(
            currentItems,
            perItemResults,
            allFail,
            () => (overallStatus = BulkOperationResponseStatus.FAIL),
            chapterName,
            chapterError!
          );
          // Invoke forFails handler if present
          const saveResult = (item: DataItemType, value: any) => {
            perItemResults.get(item)![chapterName] = value;
            const entry = allFail.find(
              (e) =>
                currentItems.includes(e.item) &&
                e.item === item &&
                e.error?.message.startsWith(`Failed at chapter: ${chapterName}`)
            );
            if (entry) {
              entry.data = value;
            }
          };
          if (ch.forFails) {
            const failedEntries = allFail.filter(
              (e) =>
                currentItems.includes(e.item) &&
                e.error?.message.startsWith(`Failed at chapter: ${chapterName}`)
            );
            await ch.forFails(failedEntries, saveResult);
          }
          if (metadataObj) {
            BulkOperationSaga.recordChapterMetadata(
              metadataObj,
              chapterName,
              0,
              currentItems.length,
              chapterError,
              Date.now() - chapterStart
            );
          }
          currentItems = [];
          break;
        }

        // Handle regular failures and successes for this chapter
        const { nextItems, failedThisChapter } =
          BulkOperationSaga.splitPassedAndFailed(
            currentItems,
            passedItems,
            perItemResults,
            allFail,
            () => (overallStatus = BulkOperationResponseStatus.PARTIAL_SUCCESS),
            chapterName
          );

        // If this chapter has a forFails handler and there were failures, invoke it
        if (ch.forFails && failedThisChapter.length > 0) {
          const saveResult = (item: DataItemType, value: any) => {
            perItemResults.get(item)![chapterName] = value;
            const entry = allFail.find(
              (e) =>
                failedThisChapter.includes(e.item) &&
                e.item === item &&
                e.error?.message.startsWith(`Failed at chapter: ${chapterName}`)
            );
            if (entry) {
              entry.data = value;
            }
          };
          const saveError = (item: DataItemType, error: any) => {
            const entry = allFail.find(
              (e) =>
                failedThisChapter.includes(e.item) &&
                e.item === item &&
                e.error?.message.startsWith(`Failed at chapter: ${chapterName}`)
            );
            if (entry) {
              if (error.message) {
                entry.error.message += ": " + error.message;
              } else {
                entry.error.message += ": " + stringify(error);
              }
              if (error.stack) {
                entry.error.stack += error.stack + "\n\n" + entry.error.stack;
              }
            }
          };
          const failedEntries = allFail.filter(
            (e) =>
              failedThisChapter.includes(e.item) &&
              e.error?.message.startsWith(`Failed at chapter: ${chapterName}`)
          );
          await ch.forFails(failedEntries, saveResult, saveError);
        }

        if (metadataObj) {
          BulkOperationSaga.recordChapterMetadata(
            metadataObj,
            chapterName,
            nextItems.length,
            failedThisChapter.length,
            undefined,
            Date.now() - chapterStart
          );
        }

        currentItems = nextItems;
        if (currentItems.length === 0) {
          break;
        }
      }

      // Final successes
      currentItems.forEach((item) => {
        BulkOperationSaga.recordSuccess(
          item,
          perItemResults.get(item)!,
          allSuccess
        );
        successCount++;
      });

      if (metadataObj) {
        metadataObj.profile = Date.now() - sagaStart;
      }

      // Build a base BulkItemizedResponse (with methods like addSuccess, etc.)
      const baseResponse = new BulkItemizedResponse<DataItemType, any>(
        overallStatus,
        {
          success: allSuccess,
          fail: allFail,
        }
      );
      // Cast to the saga‐specific response type to attach metadata
      const response = baseResponse as BulkOperationItemizedSagaResponse<
        DataItemType,
        any
      >;
      if (metadataObj) {
        response.metadata = metadataObj;
      }
      return response;
    })();
  }

  // Normalize a raw function or chapter object into a uniform ItemizedSagaChapter
  private static normalizeChapter<DataItemType>(
    chEntry:
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>,
    index: number
  ): ItemizedSagaChapter<DataItemType> {
    if (typeof chEntry === "function") {
      return {
        name: (chEntry as Function).name || index.toString(),
        chapter: chEntry as ItemizedSagaChapterFunction<DataItemType>,
        forFails: undefined,
      };
    } else {
      return chEntry as ItemizedSagaChapter<DataItemType>;
    }
  }

  // Initialize metadata object
  private static initializeMetadata(name?: string): SagaMetadata {
    return {
      chapters: {},
      profile: 0,
      name,
    };
  }

  // Initialize per-item results map
  private static initializePerItemResults<DataItemType>(
    items: DataItemType[]
  ): Map<DataItemType, ChapterResultsMap> {
    const map = new Map<DataItemType, ChapterResultsMap>();
    items.forEach((item) => map.set(item, {}));
    return map;
  }

  // Execute a single chapter, returning passed items and any thrown error
  private static async executeChapter<DataItemType>(
    ch: ItemizedSagaChapter<DataItemType>,
    currentItems: DataItemType[],
    perItemResults: Map<DataItemType, ChapterResultsMap>
  ): Promise<{
    passedItems: DataItemType[];
    chapterError: Error | null;
  }> {
    let passedItems: DataItemType[] = [];
    let chapterError: Error | null = null;
    try {
      if (ch.chapter.length >= 2) {
        const saveResult = (item: DataItemType, resultValue: any) => {
          perItemResults.get(item)![ch.name!] = resultValue;
        };
        const result = await (ch.chapter as Function).call(
          ch,
          currentItems,
          saveResult
        );
        if (result instanceof BulkItemizedResponse) {
          passedItems = result.items.success.map((r) => r.item);
        } else {
          passedItems = result;
        }
      } else {
        const result = await (ch.chapter as Function).call(ch, currentItems);
        if (result instanceof BulkItemizedResponse) {
          passedItems = result.items.success.map((r) => r.item);
        } else {
          passedItems = result;
        }
      }
    } catch (err) {
      chapterError = err as Error;
    }
    return { passedItems, chapterError };
  }

  // Record item failures for a thrown-chapter scenario
  private static recordFailuresOnError<DataItemType>(
    items: DataItemType[],
    perItemResults: Map<DataItemType, ChapterResultsMap>,
    allFail: BulkOperationItemizedSagaResultItem<DataItemType, any>[],
    markOverallFail: () => void,
    chapterName: string,
    error: Error
  ) {
    items.forEach((item) => {
      const cr = perItemResults.get(item)!;
      allFail.push({
        item,
        data: null,
        error: {
          message: `Failed at chapter: ${chapterName}: ${error.message}`,
          stack: error.stack,
        },
        chapterResults: { ...cr },
        status: BulkOperationResultItemStatus.FAIL,
      });
      markOverallFail();
    });
  }

  // Record per-chapter metadata into metadataObj
  private static recordChapterMetadata(
    metadataObj: SagaMetadata,
    chapterName: string,
    success: number,
    failed: number,
    error: Error | undefined,
    profile: number
  ) {
    metadataObj.chapters[chapterName] = {
      success,
      failed,
      error,
      profile,
    };
  }

  // Split items into passed vs failed, record per-item failures, return nextItems
  private static splitPassedAndFailed<DataItemType>(
    currentItems: DataItemType[],
    passedItems: DataItemType[],
    perItemResults: Map<DataItemType, ChapterResultsMap>,
    allFail: BulkOperationItemizedSagaResultItem<DataItemType, any>[],
    markPartialFail: () => void,
    chapterName: string
  ): {
    nextItems: DataItemType[];
    failedThisChapter: DataItemType[];
  } {
    const passSet = new Set(passedItems);
    const failedThisChapter: DataItemType[] = [];
    currentItems.forEach((item) => {
      if (!passSet.has(item)) {
        const cr = perItemResults.get(item)!;
        allFail.push({
          item,
          data: null,
          error: { message: `Failed at chapter: ${chapterName}` },
          chapterResults: { ...cr },
          status: BulkOperationResultItemStatus.FAIL,
        });
        markPartialFail();
        failedThisChapter.push(item);
      }
    });
    return { nextItems: passedItems, failedThisChapter };
  }

  // Record a successful item at the end
  private static recordSuccess<DataItemType>(
    item: DataItemType,
    cr: ChapterResultsMap,
    allSuccess: BulkOperationItemizedSagaResultItem<DataItemType, any>[]
  ) {
    allSuccess.push({
      item,
      data: null,
      error: null,
      chapterResults: { ...cr },
      status: BulkOperationResultItemStatus.SUCCESS,
    });
  }
}

/**
 * The saga() helper now only takes a saga name, items, and optional options.
 * Chapters are added via first(), next(), or finally() on the returned builder.
 *
 * Example usage:
 *   saga("create emails", items, { metadata: true })
 *     .first("create generation orders", items => [])
 *     .next("build email objects", items => [])
 *     .finally("save generation counters", items => [])
 */
/**
 * The saga() helper now supports two signatures:
 * 1. saga(itemsArray, options?)       — no explicit name
 * 2. saga(name, itemsArray, options?) — explicit name
 *
 * Chapters are added via .first(), .next(), or .finally() on the returned builder.
 */

// Overload #1: No name provided, itemsArray is first argument
export function saga<DataItemType>(
  itemsArray: DataItemType | DataItemType[],
  options?: { metadata?: boolean; name?: string }
): BulkOperationSagaBuilder<DataItemType>;

// Overload #2: Name provided as first argument
export function saga<DataItemType>(
  name: string,
  itemsArray: DataItemType | DataItemType[],
  options?: { metadata?: boolean; name?: string }
): BulkOperationSagaBuilder<DataItemType>;

// Implementation
export function saga<DataItemType>(
  nameOrItems: string | DataItemType | DataItemType[],
  itemsOrOptions?:
    | DataItemType
    | DataItemType[]
    | { metadata?: boolean; name?: string },
  maybeOptions?: { metadata?: boolean; name?: string }
): BulkOperationSagaBuilder<DataItemType> {
  let sagaName: string | undefined;
  let itemsArray: DataItemType | DataItemType[];
  let opts: BuilderOptions | undefined;

  if (typeof nameOrItems === "string") {
    // Called with (name, itemsArray, options?)
    sagaName = nameOrItems;
    itemsArray = itemsOrOptions as DataItemType | DataItemType[];
    opts = maybeOptions;
  } else {
    // Called with (itemsArray, options?)
    sagaName = undefined;
    itemsArray = nameOrItems as DataItemType | DataItemType[];
    opts = itemsOrOptions as BuilderOptions | undefined;
  }

  const normalizedItems = Array.isArray(itemsArray) ? itemsArray : [itemsArray];
  const builderOptions: BuilderOptions = {
    metadata: opts?.metadata,
    name: sagaName ?? opts?.name,
  };
  return new BulkOperationSagaBuilder<DataItemType>(
    normalizedItems,
    builderOptions
  );
}

/**
 * Method decorator that ensures a BulkOperationSagaBuilder is created (if none was passed in)
 * and pre‐wired with the given saga name (if provided).
 *
 * Usage:
 *
 *   @BulkOperationSaga("mySagaName")
 *   public async updateResultCampaignStateSteps(
 *     items: UpdateResultCampaignStateStepItem | UpdateResultCampaignStateStepItem[],
 *     saga?: BulkOperationSagaBuilder<UpdateResultCampaignStateStepItem>
 *   ) {
 *     // Inside this method, `saga` is guaranteed to be a valid builder
 *     return saga.first("find campaign state", items => ...).next(...).run();
 *   }
 */
export interface SagaOptions {
  metadata?: boolean;
  name?: string;
}

/**
 * Overload #1: @BulkSaga()
 * Overload #2: @BulkSaga("name")
 * Overload #3: @BulkSaga("name", { metadata: true })
 * Overload #4: @BulkSaga({ metadata: true, name?: string })
 */
export function BulkSaga(): MethodDecorator;
export function BulkSaga(name: string): MethodDecorator;
export function BulkSaga(name: string, options: SagaOptions): MethodDecorator;
export function BulkSaga(options: SagaOptions): MethodDecorator;

export function BulkSaga(
  arg1?: string | SagaOptions,
  arg2?: SagaOptions
): MethodDecorator {
  // Figure out the sagaName and opts from the overloads
  let sagaName: string | undefined;
  let opts: SagaOptions | undefined;

  if (typeof arg1 === "string") {
    sagaName = arg1;
    opts = arg2;
  } else if (arg1 && typeof arg1 === "object") {
    opts = arg1;
    sagaName = (arg1 as SagaOptions).name;
  } else {
    sagaName = undefined;
    opts = undefined;
  }

  // We return a MethodDecorator. The compiler knows this decorator
  // is going to be applied to a method whose signature is:
  //   (items: DataItemType[], saga?: BulkOperationSagaBuilder<DataItemType>) => Promise<BulkOperationItemizedSagaResponse<DataItemType, any>>
  return function <
    T extends (
      items: any[],
      saga?: BulkOperationSagaBuilder<any>
    ) => Promise<any>,
  >(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    // “originalMethod” already has the right signature as T
    const originalMethod = descriptor.value!;

    // Replace descriptor.value with a function matching T
    const wrapped = function (
      this: any,
      items: any[],
      sagaParam?: BulkOperationSagaBuilder<any>
    ) {
      // Normalize and build saga as before

      const normalizedItems = Array.isArray(items) ? items : [items];
      const finalSagaName = sagaName ?? String(propertyKey);
      const builder = saga<any>(finalSagaName, normalizedItems, {
        metadata: opts?.metadata ?? false,
      });
      const sagaToUse = sagaParam ?? builder;
      // Call originalMethod, cast result back to the return type of T
      return originalMethod.call(this, items, sagaToUse) as ReturnType<T>;
    };

    descriptor.value = wrapped as unknown as T;
    return descriptor;
  } as MethodDecorator;
}
