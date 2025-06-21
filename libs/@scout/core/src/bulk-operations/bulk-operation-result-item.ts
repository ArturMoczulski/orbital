import {
  BulkOperationResultItemDTO,
  BulkOperationResultItemError,
  BulkOperationResultItemStatus,
} from "./types";
import * as stringify from "json-stringify-safe";

export abstract class BulkOperationResultItem<
  DataItemType = any,
  ResultItemDataType = any,
> {
  public readonly group?: string;
  constructor(
    public readonly item: DataItemType,
    public status: BulkOperationResultItemStatus,
    public data?: ResultItemDataType,
    public error?: BulkOperationResultItemError,
    group?: string
  ) {
    this.group = group;
  }

  static fromJson<DataItemType = any, ResultItemDataType = any>(
    json: any
  ): BulkOperationResultItem<DataItemType, ResultItemDataType> {
    BulkOperationResultItem.validateJson(json);
    const status = json.status as BulkOperationResultItemStatus;
    if (status === BulkOperationResultItemStatus.SUCCESS) {
      return BulkOperationSuccessItem.fromJson<
        DataItemType,
        ResultItemDataType
      >(json);
    } else {
      return BulkOperationFailItem.fromJson<DataItemType, ResultItemDataType>(
        json
      );
    }
  }

  static validateJson(json: BulkOperationResultItemDTO) {
    if (!json) {
      throw new Error(
        `Invalid JSON format for BulkOperationResultItem: no data provided ${stringify(
          json
        )}`
      );
    }

    if (json.status === undefined) {
      throw new Error(
        `Invalid JSON format for BulkOperationResultItem: no status in response object: ${stringify(
          json.status
        )}`
      );
    }

    if (
      ![
        BulkOperationResultItemStatus.FAIL,
        BulkOperationResultItemStatus.SUCCESS,
      ].includes(json.status)
    ) {
      throw new Error(
        `Invalid JSON format for BulkOperationResultItem: status ${stringify(
          json.status
        )} not supported`
      );
    }
  }
}

export class BulkOperationSuccessItem<
  DataItemType = any,
  ResultItemDataType = any,
> extends BulkOperationResultItem<DataItemType, ResultItemDataType> {
  constructor(
    public readonly item: DataItemType,
    public data?: ResultItemDataType,
    public group?: string
  ) {
    super(item, BulkOperationResultItemStatus.SUCCESS, data, undefined, group);
  }

  static fromJson<DataItemType = any, ResultItemDataType = any>(
    json: any
  ): BulkOperationSuccessItem<any, any> {
    return new BulkOperationSuccessItem<DataItemType, ResultItemDataType>(
      json.item,
      json.data,
      json.group
    );
  }
}

export class BulkOperationFailItem<
  DataItemType = any,
  ResultItemDataType = any,
> extends BulkOperationResultItem<DataItemType, ResultItemDataType> {
  constructor(
    public readonly item: DataItemType,
    public data?: ResultItemDataType,
    public error?: BulkOperationResultItemError,
    public group?: string
  ) {
    super(item, BulkOperationResultItemStatus.FAIL, data, error, group);
  }

  static fromJson<DataItemType = any, ResultItemDataType = any>(
    json: any
  ): BulkOperationFailItem<any, any> {
    return new BulkOperationFailItem<DataItemType, ResultItemDataType>(
      json.item,
      json.data,
      json.error,
      json.group
    );
  }
}
