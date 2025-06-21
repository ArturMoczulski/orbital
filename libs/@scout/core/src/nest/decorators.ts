import { BulkItemizedResponse } from "../bulk-operations";
import { Microservice } from "./microservice"; // Adjust path as needed

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
      const response = await (this as Microservice).statusBulkRequest.apply(
        this,
        [message, ...args]
      );
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
      const response = await (this as Microservice).countedBulkRequest.apply(
        this,
        [message, ...args]
      );
      // Append the response as the last parameter and call the original method
      return await originalMethod.apply(this, [...args, response]);
    };

    return descriptor;
  };
}

// Decorator for itemized bulk request with generics
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
      const requestFn = (this as Microservice).itemizedBulkRequest as <
        DataItemType,
        ResultItemDataType,
      >(
        msg: string,
        ...args: any[]
      ) => Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>>;

      // Call the base class itemizedBulkRequest method with generics
      const response = requestFn.apply(this, [message, ...args]);
      // Append the response as the last parameter and call the original method
      return await originalMethod.apply(this, [...args, response]);
    };

    return descriptor;
  };
}
