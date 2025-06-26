import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { RemoteMicroserviceError } from "@orbital/microservices";
import { Observable, throwError } from "rxjs";

/**
 * Exception filter for the World microservice.
 * Preserves the original error message and stack trace in RPC responses.
 */
@Catch()
export class WorldExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WorldExceptionFilter.name);
  private readonly serviceName = "world";

  catch(exception: any, host: ArgumentsHost): Observable<never> | void {
    console.log("🚨 WorldExceptionFilter.catch() called");
    console.log("Exception type:", exception?.constructor?.name);
    console.log("Exception message:", exception?.message);
    console.log("Context type:", host.getType());
    this.logger.error(`triggered world exception filter`);
    const ctxType = host.getType();

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

    if (exception instanceof Error) {
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
