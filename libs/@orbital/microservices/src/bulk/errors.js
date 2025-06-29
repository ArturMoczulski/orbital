"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkTimeoutError = exports.BulkLimitExceededError = exports.BulkPartialSuccessError = exports.BulkValidationError = exports.BulkOperationError = void 0;
const microservices_1 = require("@nestjs/microservices");
/**
 * Base class for all bulk operation errors
 */
class BulkOperationError extends microservices_1.RpcException {
    constructor(message, details) {
        super({
            code: "BULK_OPERATION_ERROR",
            message,
            details,
        });
    }
}
exports.BulkOperationError = BulkOperationError;
/**
 * Thrown when a bulk operation fails due to validation errors
 */
class BulkValidationError extends BulkOperationError {
    constructor(validationErrors) {
        super("Bulk operation validation failed", { validationErrors });
        this.cause = { validationErrors };
    }
}
exports.BulkValidationError = BulkValidationError;
/**
 * Thrown when a bulk operation partially succeeds
 * (some items processed successfully, others failed)
 */
class BulkPartialSuccessError extends BulkOperationError {
    constructor(succeeded, failed, failedItems) {
        super("Bulk operation partially succeeded", {
            succeeded,
            failed,
            failedItems,
        });
        this.cause = { succeeded, failed, failedItems };
    }
}
exports.BulkPartialSuccessError = BulkPartialSuccessError;
/**
 * Thrown when a bulk operation exceeds the maximum allowed items
 */
class BulkLimitExceededError extends BulkOperationError {
    constructor(limit, actual) {
        super(`Bulk operation exceeds maximum limit of ${limit} items`, {
            limit,
            actual,
        });
        this.cause = { limit, actual };
    }
}
exports.BulkLimitExceededError = BulkLimitExceededError;
/**
 * Thrown when a bulk operation times out
 */
class BulkTimeoutError extends BulkOperationError {
    constructor(timeoutMs) {
        super(`Bulk operation timed out after ${timeoutMs}ms`, { timeoutMs });
        this.cause = { timeoutMs };
    }
}
exports.BulkTimeoutError = BulkTimeoutError;
//# sourceMappingURL=errors.js.map