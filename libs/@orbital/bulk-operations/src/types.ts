export enum BulkOperationResponseStatus {
  SUCCESS = 1,
  PARTIAL_SUCCESS = 2,
  FAIL = 0,
}

export type BulkOperationRequestDTO<DataItemType> = {
  items: DataItemType;
};

export type BulkOperationResponseDTO<ResultItemDataType = any> = {
  status: BulkOperationResponseStatus;
  counts?: BulkOperationResultCounts;
  items?: {
    success?: BulkOperationResultItemDTO<ResultItemDataType>[];
    fail?: BulkOperationResultItemDTO<ResultItemDataType>[];
  };
  error?: any;
};

export enum BulkOperationResultItemStatus {
  SUCCESS = 1,
  FAIL = 0,
}

export type BulkOperationResultItemDTO<
  DataItemType = any,
  ResultItemDataType = any,
> = {
  // add reference to the item that was being processed
  input?: DataItemType;
  data?: ResultItemDataType;
  error?: BulkOperationResultItemError;
  status: BulkOperationResultItemStatus;
};

export type BulkOperationResultItemError = {
  message: string;
  stack?: any;
};

export type BulkOperationResultCounts = {
  success: number;
  fail: number;
};
