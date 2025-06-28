import { BulkItemizedResponse } from "@orbital/bulk-operations";
import { Microservice } from "../microservice";

// Helper type to infer parameter types
type MethodParams = any[];

/**
 * Decorator for basic microservice request.
 * Appends RPC response as last argument to original method.
 */
export function MicroserviceRequest<T = any>(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: MethodParams) {
      const requestFn = (this as Microservice).request as <R>(
        msg: string,
        ...params: any[]
      ) => Promise<R>;
      const response = await requestFn.call(this, message, ...args);
      return await originalMethod.call(this, ...args, response);
    };
    return descriptor;
  };
}

/**
 * Decorator for status bulk request.
 * Appends BulkResponse as last argument to original method.
 */
export function MicroserviceStatusBulkRequest(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: MethodParams) {
      const response = await (this as Microservice).statusBulkRequest.call(
        this,
        message,
        args[0]
      );
      return await originalMethod.apply(this, [...args, response]);
    };
    return descriptor;
  };
}

/**
 * Decorator for counted bulk request.
 * Appends BulkCountedResponse as last argument to original method.
 */
export function MicroserviceCountedBulkRequest(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: MethodParams) {
      const response = await (this as Microservice).countedBulkRequest.call(
        this,
        message,
        args[0]
      );
      return await originalMethod.apply(this, [...args, response]);
    };
    return descriptor;
  };
}

/**
 * Decorator for itemized bulk request.
 * Appends BulkItemizedResponse<DataItemType, ResultItemDataType> as last argument.
 */
export function MicroserviceItemizedBulkRequest<
  DataItemType = any,
  ResultItemDataType = any,
>(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: MethodParams) {
      const requestFn = (this as Microservice).itemizedBulkRequest as <D, R>(
        msg: string,
        ...params: any[]
      ) => Promise<BulkItemizedResponse<D, R>>;
      const response = await requestFn.call(this, message, args[0]);
      return await originalMethod.apply(this, [...args, response]);
    };
    return descriptor;
  };
}
