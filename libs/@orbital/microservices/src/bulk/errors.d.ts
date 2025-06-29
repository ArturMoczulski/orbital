import { RpcException } from "@nestjs/microservices";
/**
 * Base class for all bulk operation errors
 */
export declare class BulkOperationError extends RpcException {
    constructor(message: string, details?: any);
}
/**
 * Thrown when a bulk operation fails due to validation errors
 */
export declare class BulkValidationError extends BulkOperationError {
    constructor(validationErrors: any[]);
}
/**
 * Thrown when a bulk operation partially succeeds
 * (some items processed successfully, others failed)
 */
export declare class BulkPartialSuccessError extends BulkOperationError {
    constructor(succeeded: number, failed: number, failedItems?: Array<{
        id: string;
        error: string;
    }>);
}
/**
 * Thrown when a bulk operation exceeds the maximum allowed items
 */
export declare class BulkLimitExceededError extends BulkOperationError {
    constructor(limit: number, actual: number);
}
/**
 * Thrown when a bulk operation times out
 */
export declare class BulkTimeoutError extends BulkOperationError {
    constructor(timeoutMs: number);
}
