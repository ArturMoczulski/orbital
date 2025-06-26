import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from "rxjs";
import {
  MicroserviceUnavailableError,
  RemoteMicroserviceError,
  UnrecognizedMessagePatternError,
} from "../errors";

/**
 * Interface for RPC error response
 */
interface RpcErrorResponse {
  code: string;
  service: string;
  message: string;
  timestamp: string;
  stack?: string;
}

/**
 * Global exception filter for microservices and HTTP controllers.
 *
 * Logs all exceptions and converts RpcExceptions into HttpExceptions for HTTP context,
 * while preserving RPC exception behavior for microservice calls.
 */
@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);
  private readonly serviceName = process.env.SERVICE_NAME || "unknown";

  catch(exception: any, host: ArgumentsHost): Observable<never> | void {
    const ctxType = host.getType();
    this.logger.error(
      `Exception in ${ctxType} context: ${
        exception instanceof Error
          ? exception.message
          : JSON.stringify(exception)
      }`,
      exception instanceof Error ? exception.stack : undefined
    );

    if (exception instanceof RpcException) {
      // Determine payload from exception
      const rawError = exception.getError();
      const payload =
        typeof rawError === "object" ? rawError : { message: rawError };

      // Custom RpcException subclasses should pass through
      if (
        exception instanceof MicroserviceUnavailableError ||
        exception instanceof UnrecognizedMessagePatternError ||
        exception instanceof RemoteMicroserviceError
      ) {
        if (ctxType === "rpc") {
          return throwError(() => exception);
        }
        // HTTP: convert to HttpException
        throw new HttpException(payload, HttpStatus.BAD_GATEWAY);
      }

      // Generic RpcException: enhance payload
      const enhanced: any = {
        ...payload,
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        // Include the original error payload
        originalError: payload,
      };

      // Include stack trace in non-production environments
      if (process.env.NODE_ENV !== "production" && exception instanceof Error) {
        enhanced.stack = exception.stack;
      }

      if (ctxType === "rpc") {
        return throwError(() => new RpcException(enhanced));
      }
      throw new HttpException(enhanced, HttpStatus.BAD_GATEWAY);
    }

    // Non-Rpc exceptions in RPC context: wrap in RpcException
    if (ctxType === "rpc") {
      // Check if this is a Mongoose validation error
      const isValidationError =
        exception instanceof Error &&
        exception.message &&
        exception.message.includes("validation failed");

      // Log the full error details for debugging
      this.logger.error(
        `Handling exception in RPC context: ${JSON.stringify(
          {
            type: exception.constructor.name,
            message: exception.message,
            isValidationError,
            stack: exception.stack,
            fullError: exception,
          },
          null,
          2
        )}`
      );

      let errorPayload: any;

      // Create a serializable version of the error
      const serializableError: Record<string, any> = {};

      // Add properties from the error object
      if (exception instanceof Error) {
        // Add standard error properties
        serializableError["name"] = exception.name || "Error";
        serializableError["message"] = exception.message || "Unknown error";
        serializableError["stack"] = exception.stack;

        // Add any additional properties from the error object
        Object.getOwnPropertyNames(exception).forEach((prop) => {
          if (prop !== "name" && prop !== "message" && prop !== "stack") {
            serializableError[prop] = (exception as any)[prop];
          }
        });
      } else {
        // For non-Error objects, just stringify
        serializableError["data"] = JSON.stringify(exception);
      }

      if (isValidationError && exception instanceof Error) {
        // For Mongoose validation errors, preserve the entire error object
        errorPayload = {
          code: "VALIDATION_ERROR",
          service: this.serviceName,
          message: exception.message,
          timestamp: new Date().toISOString(),
          // Pass through the serialized error to preserve validation details
          originalError: serializableError,
          // Include the raw error message for easier debugging
          rawError: String(exception),
        };
      } else {
        // For other errors, use the standard format
        errorPayload = {
          code: "INTERNAL_SERVER_ERROR",
          service: this.serviceName,
          message:
            exception instanceof Error
              ? exception.message
              : JSON.stringify(exception),
          timestamp: new Date().toISOString(),
          // Also include the serialized error for non-validation errors
          originalError: serializableError,
          // Include the raw error message for easier debugging
          rawError: String(exception),
        };
      }

      // Include stack trace in non-production environments
      if (process.env.NODE_ENV !== "production" && exception instanceof Error) {
        errorPayload.stack = exception.stack;
      }

      return throwError(() => new RpcException(errorPayload));
    }

    // HTTP or other contexts: rethrow original exception
    throw exception;
  }
}
