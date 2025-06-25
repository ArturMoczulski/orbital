import { Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

/**
 * Global exception handler for the admin gateway.
 * This handler catches all unhandled exceptions, including RPC exceptions,
 * and prevents the application from crashing.
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
      }

      // Don't crash the process
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      this.logger.error(`Uncaught Exception: ${error.message}`, error.stack);
      // Don't crash the process
    });

    this.logger.log("Global exception handlers registered");
  }
}
