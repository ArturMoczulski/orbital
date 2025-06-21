// services/shared/core/src/bulk-operations/bulk-operation-saga-bulider.ts
import {
  BulkOperationSaga,
  ItemizedSagaChapter,
  ItemizedSagaChapterFunction,
  BulkOperationItemizedSagaResultItem,
  BulkOperationItemizedSagaResponse,
} from "./bulk-operation-saga";

export interface BuilderOptions {
  metadata?: boolean;
  name?: string;
}

/**
 * Builds and runs a multi-chapter saga.
 */
export class BulkOperationSagaBuilder<DataItemType = any> {
  private items: DataItemType[];
  private chapters: (
    | ItemizedSagaChapter<DataItemType>
    | ItemizedSagaChapterFunction<DataItemType>
  )[] = [];
  private options?: BuilderOptions;

  constructor(items: DataItemType[], options?: BuilderOptions) {
    this.items = items;
    this.options = options;
  }

  first(
    nameOrChapter:
      | string
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>,
    maybeFn?: ItemizedSagaChapterFunction<DataItemType>
  ): BulkOperationSagaBuilder<DataItemType> {
    if (typeof nameOrChapter === "string" && maybeFn) {
      this.chapters.push({ name: nameOrChapter, chapter: maybeFn });
    } else if (
      typeof nameOrChapter === "object" &&
      "chapter" in nameOrChapter
    ) {
      this.chapters.push(nameOrChapter as ItemizedSagaChapter<DataItemType>);
    } else {
      this.chapters.push(
        nameOrChapter as ItemizedSagaChapterFunction<DataItemType>
      );
    }
    return this;
  }

  next(
    nameOrChapter:
      | string
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>,
    maybeFn?: ItemizedSagaChapterFunction<DataItemType>
  ): BulkOperationSagaBuilder<DataItemType> {
    return this.first(nameOrChapter, maybeFn);
  }

  finally(
    nameOrChapter:
      | string
      | ItemizedSagaChapter<DataItemType>
      | ItemizedSagaChapterFunction<DataItemType>,
    maybeFn?: ItemizedSagaChapterFunction<DataItemType>
  ): BulkOperationSagaBuilder<DataItemType> {
    return this.first(nameOrChapter, maybeFn);
  }

  /**
   * Alias onError to forFails: invoke handler on any failures (thrown or filtered).
   */
  /**
   * Alias onError to forFails: invoke handler on any failures (receive raw items).
   */
  onError(
    handler: (failedItems: DataItemType[]) => Promise<void>
  ): BulkOperationSagaBuilder<DataItemType> {
    return this.forFails(async (failedEntries) => {
      const items = failedEntries.map((e) => e.item);
      await handler(items);
    });
  }

  /**
   * Register a handler that receives raw failed items and optional saveResult callback.
   */
  /**
   * Register a handler that receives full failure entries and optional saveResult callback.
   */
  forFails(
    handler: (
      failedEntries: BulkOperationItemizedSagaResultItem<DataItemType, any>[],
      saveResult?: (item: DataItemType, value: any) => void,
      fail?: (item: DataItemType, error: any) => void
    ) => Promise<void>
  ): BulkOperationSagaBuilder<DataItemType> {
    const idx = this.chapters.length - 1;
    const last = this.chapters[idx];
    // Attach the handler to the chapter
    if (typeof last === "function") {
      const fn = last as ItemizedSagaChapterFunction<DataItemType>;
      this.chapters[idx] = {
        name: fn.name || idx.toString(),
        chapter: fn,
        forFails: handler,
      };
    } else {
      (last as ItemizedSagaChapter<DataItemType>).forFails = handler;
    }
    return this;
  }

  run(): Promise<BulkOperationItemizedSagaResponse<DataItemType, any>> {
    return BulkOperationSaga.itemized(this.items, this.chapters, this.options);
  }

  then<TResult1 = any, TResult2 = never>(
    onFulfilled?:
      | ((
          value: BulkOperationItemizedSagaResponse<DataItemType, any>
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onFulfilled, onRejected);
  }
}
