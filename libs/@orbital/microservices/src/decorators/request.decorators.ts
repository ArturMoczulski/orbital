import { Microservice } from "../microservice";
import { BulkItemizedResponse } from "@scout/core";

// Helper type to infer parameter types
type MethodParams = any[];

// Decorator for basic request
export function MicroserviceRequest<T = any>(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: MethodParams) {
      const requestFn = (this as Microservice).request as <T>(
        msg: string,
        ...args: any[]
      ) => Promise<T>;
      const response = await requestFn.apply(this, [message, ...args]);
      // Append the response as the last parameter and call the original method
      return await originalMethod.apply(this, [...args, response]);
    };

    return descriptor;
  };
}

// Decorator for status bulk request
export function MicroserviceStatusBulkRequest(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: MethodParams) {
      // Call the base class statusBulkRequest method
      // Cast to any to bypass TypeScript's parameter count check
      const response = await (this as any).statusBulkRequest.apply(this, [
        message,
        ...args,
      ]);
      // Append the response as the last parameter and call the original method
      return await originalMethod.apply(this, [...args, response]);
    };

    return descriptor;
  };
}

// Decorator for counted bulk request
export function MicroserviceCountedBulkRequest(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: MethodParams) {
      // Call the base class countedBulkRequest method
      // Cast to any to bypass TypeScript's parameter count check
      const response = await (this as any).countedBulkRequest.apply(this, [
        message,
        ...args,
      ]);
      // Append the response as the last parameter and call the original method
      return await originalMethod.apply(this, [...args, response]);
    };

    return descriptor;
  };
}

// Decorator for itemized bulk request with generics
export function MicroserviceItemizedBulkRequest<
  DataItemType = any,
  ResultItemDataType = any
>(message: string) {
  return function (
    target: Microservice,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: MethodParams) {
      const requestFn = (this as Microservice).itemizedBulkRequest as <
        DataItemType,
        ResultItemDataType
      >(
        msg: string,
        ...args: any[]
      ) => Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>>;

      // Call the base class itemizedBulkRequest method with generics
      // Cast to any to bypass TypeScript's parameter count check
      const response = (requestFn as any).apply(this, [message, ...args]);
      // Append the response as the last parameter and call the original method
      return await originalMethod.apply(this, [...args, response]);
    };

    return descriptor;
  };
}
