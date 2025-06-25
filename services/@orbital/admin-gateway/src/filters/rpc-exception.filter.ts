import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Request, Response } from "express";

/**
 * Filter to catch RPC exceptions and convert them to appropriate HTTP responses.
 * This is specifically designed to handle validation errors and other exceptions
 * from microservices and present them in a user-friendly way to HTTP clients.
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    try {
      // Only handle HTTP context
      if (host.getType() !== "http") {
        throw exception;
      }

      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      // Extract error details from the exception
      let error: any;
      let errorMessage: string;

      // Handle different types of exceptions
      if (exception instanceof RpcException) {
        // Direct RpcException
        error = exception.getError();
      } else if (
        "cause" in exception &&
        exception.cause instanceof RpcException
      ) {
        // Wrapped RpcException
        error = (exception.cause as RpcException).getError();
      } else if (
        "cause" in exception &&
        exception.cause &&
        typeof exception.cause === "object"
      ) {
        // Other error with cause
        error = exception.cause;
      } else {
        // Generic error
        error = exception;
      }

      // Extract message from error
      if (typeof error === "object" && error !== null) {
        errorMessage =
          "message" in error ? String(error.message) : JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

      // Check for validation errors (common in Mongoose)
      const isValidationError = errorMessage.includes("validation failed");

      // Determine appropriate HTTP status
      const status = isValidationError
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.BAD_GATEWAY;

      // Log the error with more details
      this.logger.error(
        `Exception caught in RpcExceptionFilter on ${request.method} ${request.url}: ${errorMessage}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception)
      );

      // Format the response
      const responseBody = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: errorMessage,
        error: isValidationError ? "Bad Request" : "Bad Gateway",
        details: typeof error === "object" ? error : undefined,
      };

      // Send the response
      response.status(status).json(responseBody);
    } catch (innerException) {
      // Last resort error handling to prevent the application from crashing
      this.logger.error(
        `Error in RpcExceptionFilter itself: ${
          innerException instanceof Error
            ? innerException.message
            : JSON.stringify(innerException)
        }`,
        innerException instanceof Error ? innerException.stack : undefined
      );

      try {
        // Try to send a generic error response
        if (host.getType() === "http") {
          const ctx = host.switchToHttp();
          const response = ctx.getResponse<Response>();
          const request = ctx.getRequest<Request>();

          response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: "Internal server error in exception filter",
            error: "Internal Server Error",
          });
        }
      } catch (finalException) {
        // Absolute last resort - just log the error
        this.logger.error(
          `Failed to send error response: ${
            finalException instanceof Error
              ? finalException.message
              : JSON.stringify(finalException)
          }`
        );
      }
    }
  }
}
