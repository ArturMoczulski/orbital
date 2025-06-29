/**
 * Common interface for all bulk operation responses
 */
export interface BulkResponse {
    /** Unique identifier for the bulk operation */
    id: string;
    /** Timestamp when the operation was processed */
    timestamp: string;
}
/**
 * Simple status response for bulk operations
 * Used when only success/failure matters, not counts or details
 */
export interface StatusBulkResponse extends BulkResponse {
    /** Whether the bulk operation succeeded */
    success: boolean;
    /** Optional error message if the operation failed */
    error?: string;
}
/**
 * Counted response for bulk operations
 * Used when the number of affected items matters, but not their details
 */
export interface CountedBulkResponse extends BulkResponse {
    /** Whether the bulk operation succeeded */
    success: boolean;
    /** Number of items processed */
    processed: number;
    /** Number of items successfully processed */
    succeeded: number;
    /** Number of items that failed processing */
    failed: number;
    /** Optional error message if the operation failed */
    error?: string;
}
/**
 * Detailed response for bulk operations
 * Used when details about each processed item matter
 */
export interface ItemizedBulkResponse<T = any> extends BulkResponse {
    /** Whether the bulk operation succeeded overall */
    success: boolean;
    /** Array of results for each processed item */
    items: Array<{
        /** Unique identifier for the item */
        id: string;
        /** Whether processing this item succeeded */
        success: boolean;
        /** Optional error message if processing this item failed */
        error?: string;
        /** Optional result data if processing this item succeeded */
        data?: T;
    }>;
    /** Optional error message if the operation failed overall */
    error?: string;
}
/**
 * Common interface for all bulk operation requests
 */
export interface BulkRequest {
    /** Optional client-provided identifier for the bulk operation */
    id?: string;
}
/**
 * Simple bulk request with no item details
 */
export interface SimpleBulkRequest extends BulkRequest {
    /** Any additional data needed for the operation */
    data?: any;
}
/**
 * Itemized bulk request with details for each item
 */
export interface ItemizedBulkRequest<T = any> extends BulkRequest {
    /** Array of items to process */
    items: Array<{
        /** Unique identifier for the item */
        id: string;
        /** Data for this item */
        data: T;
    }>;
}
