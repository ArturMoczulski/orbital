import {
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

/**
 * Interface for error response with optional stack trace
 */
interface ErrorResponse {
  message: string;
  stack?: string;
}

/**
 * Global exception handler for the admin gateway.
 * This handler catches all unhandled exceptions, including RPC exceptions,
 * and prevents the application from crashing.
 *
 * It logs detailed information about unhandled rejections and exceptions
 * to help with debugging, and ensures that microservice errors are properly
 * converted to HTTP responses.
 */
export class GlobalExceptionHandler {
  private static readonly logger = new Logger("GlobalExceptionHandler");

  /**
   * Initialize global exception handlers
   */
  static register(): void {
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      this.logger.error(
        `Unhandled Rejection at: ${promise}\nReason: ${
          reason instanceof Error ? reason.stack : JSON.stringify(reason)
        }`
      );

      // Extract and log more details if it's an RPC exception
      if (reason instanceof RpcException) {
        const error = reason.getError();
        this.logger.error(`RPC Exception details: ${JSON.stringify(error)}`);

        // Create a new RPC exception with stack trace in non-production environments
        setTimeout(() => {
          try {
            // Get the original error payload
            const originalError = reason.getError();
            let errorPayload: any;

            if (typeof originalError === "object" && originalError !== null) {
              // Clone the original error object
              errorPayload = { ...originalError };

              // Add stack trace if not in production
              if (
                process.env.NODE_ENV !== "production" &&
                reason instanceof Error
              ) {
                errorPayload.stack = reason.stack;
              }
            } else {
              // Simple error message
              errorPayload = {
                message: String(originalError),
              };

              // Add stack trace if not in production
              if (
                process.env.NODE_ENV !== "production" &&
                reason instanceof Error
              ) {
                errorPayload.stack = reason.stack;
              }
            }

            // Throw a new RPC exception with the enhanced payload
            throw new RpcException(errorPayload);
          } catch (innerError) {
            // If anything goes wrong, throw the original reason
            throw reason;
          }
        }, 0);
      } else if (reason instanceof Error) {
        // Re-throw other errors as InternalServerErrorException
        // so they can be caught by the exception filters
        setTimeout(() => {
          // Include stack trace in non-production environments
          const errorResponse: ErrorResponse = {
            message: reason.message,
          };

          // Add stack trace if not in production
          if (process.env.NODE_ENV !== "production") {
            errorResponse.stack = reason.stack;
          }

          throw new InternalServerErrorException(errorResponse);
        }, 0);
      }

      // Don't crash the process
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      this.logger.error(`Uncaught Exception: ${error.message}`, error.stack);

      try {
        // Create an error response with optional stack trace
        const errorResponse: ErrorResponse = {
          message: error.message,
        };

        // Add stack trace if not in production
        if (process.env.NODE_ENV !== "production") {
          errorResponse.stack = error.stack;
        }

        // Re-throw as InternalServerErrorException for the exception filters
        setTimeout(() => {
          throw new InternalServerErrorException(errorResponse);
        }, 0);
      } catch (innerError) {
        // Last resort error handling
        this.logger.error(`Error handling uncaught exception: ${innerError}`);
      }

      // Don't crash the process
      // The exception filters will handle converting these to HTTP responses
    });

    this.logger.log("Global exception handlers registered");
  }
}
