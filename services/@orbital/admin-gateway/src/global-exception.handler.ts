import {
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

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

        // Re-throw the exception so it can be caught by the RpcExceptionFilter
        // This ensures that unhandled rejections from microservice calls are
        // properly converted to HTTP responses
        setTimeout(() => {
          throw reason;
        }, 0);
      } else if (reason instanceof Error) {
        // Re-throw other errors as InternalServerErrorException
        // so they can be caught by the exception filters
        setTimeout(() => {
          throw new InternalServerErrorException(reason.message);
        }, 0);
      }

      // Don't crash the process
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      this.logger.error(`Uncaught Exception: ${error.message}`, error.stack);

      // Don't crash the process
      // The exception filters will handle converting these to HTTP responses
    });

    this.logger.log("Global exception handlers registered");
  }
}
