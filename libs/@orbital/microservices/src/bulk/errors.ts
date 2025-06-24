import { RpcException } from "@nestjs/microservices";

/**
 * Base class for all bulk operation errors
 */
export class BulkOperationError extends RpcException {
  constructor(message: string, details?: any) {
    super({
      code: "BULK_OPERATION_ERROR",
      message,
      details,
    });
  }
}

/**
 * Thrown when a bulk operation fails due to validation errors
 */
export class BulkValidationError extends BulkOperationError {
  constructor(validationErrors: any[]) {
    super("Bulk operation validation failed", { validationErrors });
    (this as any).cause = { validationErrors };
  }
}

/**
 * Thrown when a bulk operation partially succeeds
 * (some items processed successfully, others failed)
 */
export class BulkPartialSuccessError extends BulkOperationError {
  constructor(
    succeeded: number,
    failed: number,
    failedItems?: Array<{ id: string; error: string }>
  ) {
    super("Bulk operation partially succeeded", {
      succeeded,
      failed,
      failedItems,
    });
    (this as any).cause = { succeeded, failed, failedItems };
  }
}

/**
 * Thrown when a bulk operation exceeds the maximum allowed items
 */
export class BulkLimitExceededError extends BulkOperationError {
  constructor(limit: number, actual: number) {
    super(`Bulk operation exceeds maximum limit of ${limit} items`, {
      limit,
      actual,
    });
    (this as any).cause = { limit, actual };
  }
}

/**
 * Thrown when a bulk operation times out
 */
export class BulkTimeoutError extends BulkOperationError {
  constructor(timeoutMs: number) {
    super(`Bulk operation timed out after ${timeoutMs}ms`, { timeoutMs });
    (this as any).cause = { timeoutMs };
  }
}
