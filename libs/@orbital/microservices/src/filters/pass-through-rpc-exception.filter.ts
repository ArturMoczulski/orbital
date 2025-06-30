import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { OrbitalMicroservices } from "@orbital/contracts";
import { ZodErrorWithStack } from "@orbital/core/dist/errors/zod-error-with-stack";
import { Observable, throwError } from "rxjs";
import { RemoteMicroserviceError } from "../errors";

/**
 * Exception filter for microservices that preserves original error details in RPC responses.
 *
 * This filter is designed to be used in microservices to ensure that error details,
 * including stack traces and additional context, are properly serialized and passed
 * through to the client. This makes debugging easier by preserving the original
 * error information across service boundaries.
 */
@Catch()
export class PassThroughRpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PassThroughRpcExceptionFilter.name);
  private readonly serviceName: string;

  /**
   * Creates a new instance of the PassThroughRpcExceptionFilter.
   *
   * @param serviceName The name of the microservice using this filter.
   *                    Used to identify the source of errors.
   *                    Can be a string or an OrbitalMicroservices enum value.
   */
  constructor(serviceName?: string | OrbitalMicroservices) {
    this.serviceName =
      serviceName?.toString() || process.env.SERVICE_NAME || "unknown";
  }

  catch(exception: any, host: ArgumentsHost): Observable<never> | void {
    const ctxType = host.getType();
    this.logger.error(`triggered ${this.serviceName} exception filter`);

    // Log the exception with more details
    this.logger.error(
      `Exception in ${ctxType} context: ${
        exception instanceof Error
          ? exception.message
          : JSON.stringify(exception)
      }`,
      exception instanceof Error ? exception.stack : undefined
    );

    // Log more details about the exception for debugging
    this.logger.error(
      `Full exception details: ${JSON.stringify(
        {
          type: exception?.constructor?.name,
          message: exception?.message,
          isError: exception instanceof Error,
          isRpcException: exception instanceof RpcException,
          stack: exception?.stack?.split("\n").slice(0, 5),
          context: ctxType,
          properties: Object.getOwnPropertyNames(exception || {}),
        },
        null,
        2
      )}`
    );

    // Only handle RPC context
    if (ctxType !== "rpc") {
      throw exception;
    }

    // Create a serializable error object
    const serializableError: Record<string, any> = {};

    if (exception instanceof ZodErrorWithStack) {
      // Special handling for ExtendedZodError to preserve validation details
      serializableError.name = exception.name;
      serializableError.message = exception.message;
      serializableError.stack = exception.stack;
      serializableError.issues = exception.issues;
      serializableError.formattedIssues = exception.formatIssues();
    } else if (exception instanceof Error) {
      // Add standard error properties
      serializableError.name = exception.name || "Error";
      serializableError.message = exception.message || "Unknown error";
      serializableError.stack = exception.stack;

      // Add any additional properties from the error object
      Object.getOwnPropertyNames(exception).forEach((prop) => {
        if (prop !== "name" && prop !== "message" && prop !== "stack") {
          serializableError[prop] = (exception as any)[prop];
        }
      });
    } else {
      // For non-Error objects, just stringify
      serializableError.data = JSON.stringify(exception);
    }

    // If it's already an RpcException, extract its error
    if (exception instanceof RpcException) {
      const originalError = exception.getError();

      // Enhance the error with additional information
      const enhancedError = {
        ...(typeof originalError === "object"
          ? originalError
          : { message: originalError }),
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        stack: exception instanceof Error ? exception.stack : undefined,
        originalError: serializableError,
      };

      return throwError(
        () =>
          new RemoteMicroserviceError(
            this.serviceName,
            "unknown",
            enhancedError
          )
      );
    }

    // For other types of exceptions, create a new RpcException with detailed information
    const errorPayload = {
      code: "INTERNAL_SERVER_ERROR",
      service: this.serviceName,
      message:
        exception instanceof Error ? exception.message : String(exception),
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
      originalError: serializableError,
      // Include the raw error for easier debugging
      rawError: String(exception),
    };

    this.logger.debug(
      `Returning new RemoteMicroserviceError with payload: ${JSON.stringify(
        errorPayload
      )}`
    );
    return throwError(
      () =>
        new RemoteMicroserviceError(this.serviceName, "unknown", errorPayload)
    );
  }
}
