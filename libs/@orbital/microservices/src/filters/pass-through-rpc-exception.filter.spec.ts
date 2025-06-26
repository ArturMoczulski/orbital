import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ArgumentsHost } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { RemoteMicroserviceError } from "../errors";
import { PassThroughRpcExceptionFilter } from "./pass-through-rpc-exception.filter";

// Define fail function since it's not exported from @jest/globals
const fail = (message: string): void => {
  throw new Error(message);
};

describe("PassThroughRpcExceptionFilter", () => {
  let filter: PassThroughRpcExceptionFilter;
  let host: ArgumentsHost;

  beforeEach(() => {
    // Create a filter with a known service name for consistent testing
    filter = new PassThroughRpcExceptionFilter("test-service");

    // Mock the ArgumentsHost
    host = {
      getType: jest.fn().mockReturnValue("rpc"),
      switchToRpc: jest.fn().mockReturnValue({
        getData: jest.fn(),
        getContext: jest.fn(),
      }),
    } as unknown as ArgumentsHost;

    // Spy on logger methods to prevent console output during tests
    jest.spyOn(filter["logger"], "error").mockImplementation(() => {});
    jest.spyOn(filter["logger"], "debug").mockImplementation(() => {});
  });

  describe("constructor", () => {
    it("should use the provided service name", () => {
      const customFilter = new PassThroughRpcExceptionFilter("custom-service");
      expect(customFilter["serviceName"]).toBe("custom-service");
    });

    it("should use SERVICE_NAME env var if no name provided", () => {
      const originalEnv = process.env.SERVICE_NAME;
      process.env.SERVICE_NAME = "env-service";

      const envFilter = new PassThroughRpcExceptionFilter();
      expect(envFilter["serviceName"]).toBe("env-service");

      // Restore original env
      process.env.SERVICE_NAME = originalEnv;
    });

    it("should use 'unknown' if no service name is provided or in env", () => {
      const originalEnv = process.env.SERVICE_NAME;
      delete process.env.SERVICE_NAME;

      const unknownFilter = new PassThroughRpcExceptionFilter();
      expect(unknownFilter["serviceName"]).toBe("unknown");

      // Restore original env
      process.env.SERVICE_NAME = originalEnv;
    });
  });

  describe("catch", () => {
    it("should rethrow the exception for non-rpc contexts", async () => {
      // Mock a non-rpc context
      const nonRpcHost = {
        getType: jest.fn().mockReturnValue("http"),
      } as unknown as ArgumentsHost;

      const error = new Error("Test error");

      // The filter should throw the original error
      expect(() => filter.catch(error, nonRpcHost)).toThrow(error);
    });

    it("should handle standard Error objects", async () => {
      const error = new Error("Standard error");
      error.stack = "Error: Standard error\n    at Test.stack";

      const result = filter.catch(error, host);

      // Verify result is an Observable
      expect(result).toBeDefined();

      try {
        // Try to get the value from the Observable, which should throw
        await lastValueFrom(result as any);
        fail("Expected Observable to throw");
      } catch (error) {
        // Type assertion for the caught error
        const caughtError = error as RemoteMicroserviceError;
        // Verify the error is a RemoteMicroserviceError
        expect(caughtError).toBeInstanceOf(RemoteMicroserviceError);

        // Check error properties
        const errorData = caughtError.getError();
        expect(errorData.service).toBe("test-service");
        expect(errorData.message).toBe("Standard error");
        expect(errorData.originalError).toBeDefined();
        expect(errorData.originalError.name).toBe("Error");
        expect(errorData.originalError.message).toBe("Standard error");
        expect(errorData.originalError.stack).toBe(
          "Error: Standard error\n    at Test.stack"
        );
        expect(errorData.timestamp).toBeDefined();
      }
    });

    it("should handle RpcException objects", async () => {
      const originalError = {
        code: "TEST_ERROR",
        message: "RPC test error",
        details: { foo: "bar" },
      };
      const error = new RpcException(originalError);

      const result = filter.catch(error, host);

      try {
        await lastValueFrom(result as any);
        fail("Expected Observable to throw");
      } catch (error) {
        // Type assertion for the caught error
        const caughtError = error as RemoteMicroserviceError;

        // Verify the error is a RemoteMicroserviceError
        expect(caughtError).toBeInstanceOf(RemoteMicroserviceError);

        // Check error properties
        const errorData = caughtError.getError();
        expect(errorData.service).toBe("test-service");
        expect(errorData.code).toBe("TEST_ERROR");
        expect(errorData.message).toBe("RPC test error");
        expect(errorData.details).toEqual({ foo: "bar" });
        expect(errorData.timestamp).toBeDefined();
      }
    });

    it("should handle non-Error objects", async () => {
      const error = { foo: "bar", baz: 123 };

      const result = filter.catch(error, host);

      try {
        await lastValueFrom(result as any);
        fail("Expected Observable to throw");
      } catch (error) {
        // Type assertion for the caught error
        const caughtError = error as RemoteMicroserviceError;
        // Verify the error is a RemoteMicroserviceError
        expect(caughtError).toBeInstanceOf(RemoteMicroserviceError);

        // Check error properties
        const errorData = caughtError.getError();
        expect(errorData.service).toBe("test-service");
        expect(errorData.code).toBe("INTERNAL_SERVER_ERROR");
        expect(errorData.message).toBe("[object Object]");
        expect(errorData.originalError).toBeDefined();
        expect(errorData.originalError.data).toBe('{"foo":"bar","baz":123}');
        expect(errorData.timestamp).toBeDefined();
      }
    });

    it("should handle string errors", async () => {
      const error = "Just a string error";

      const result = filter.catch(error, host);

      try {
        await lastValueFrom(result as any);
        fail("Expected Observable to throw");
      } catch (error) {
        // Type assertion for the caught error
        const caughtError = error as RemoteMicroserviceError;

        // Verify the error is a RemoteMicroserviceError
        expect(caughtError).toBeInstanceOf(RemoteMicroserviceError);

        // Check error properties
        const errorData = caughtError.getError();
        expect(errorData.service).toBe("test-service");
        expect(errorData.code).toBe("INTERNAL_SERVER_ERROR");
        expect(errorData.message).toBe("Just a string error");
        expect(errorData.originalError).toBeDefined();
        expect(errorData.timestamp).toBeDefined();
      }
    });
  });
});
