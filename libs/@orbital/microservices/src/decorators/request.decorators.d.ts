import { Microservice } from "../microservice";
/**
 * Decorator for basic microservice request.
 * Appends RPC response as last argument to original method.
 */
export declare function MicroserviceRequest<T = any>(message: string): (target: Microservice, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for status bulk request.
 * Appends BulkResponse as last argument to original method.
 */
export declare function MicroserviceStatusBulkRequest(message: string): (target: Microservice, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for counted bulk request.
 * Appends BulkCountedResponse as last argument to original method.
 */
export declare function MicroserviceCountedBulkRequest(message: string): (target: Microservice, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for itemized bulk request.
 * Appends BulkItemizedResponse<DataItemType, ResultItemDataType> as last argument.
 */
export declare function MicroserviceItemizedBulkRequest<DataItemType = any, ResultItemDataType = any>(message: string): (target: Microservice, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
