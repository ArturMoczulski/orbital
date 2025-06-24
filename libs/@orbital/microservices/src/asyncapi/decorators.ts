import { SetMetadata } from "@nestjs/common";

export const ASYNCAPI_KEY = "asyncapi";
export const ASYNCAPI_OPERATION_KEY = "asyncapi:operation";

export interface AsyncAPIOptions {
  title: string;
  version: string;
  description?: string;
  servers?: Record<string, AsyncAPIServer>;
}

export interface AsyncAPIServer {
  url: string;
  protocol: string;
  description?: string;
}

export interface AsyncAPIOperationOptions {
  summary: string;
  description?: string;
  tags?: string[];
  message?: {
    name?: string;
    title?: string;
    summary?: string;
    description?: string;
    payload?: any; // Schema object
  };
  reply?: {
    name?: string;
    title?: string;
    summary?: string;
    description?: string;
    payload?: any; // Schema object
  };
}

/**
 * Decorator to mark a class as an AsyncAPI document
 */
export const AsyncAPI = (options: AsyncAPIOptions) =>
  SetMetadata(ASYNCAPI_KEY, options);

/**
 * Decorator to mark a method as an AsyncAPI operation
 */
export const AsyncAPIOperation = (options: AsyncAPIOperationOptions) =>
  SetMetadata(ASYNCAPI_OPERATION_KEY, options);
