import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from "rxjs";
import {
  MicroserviceUnavailableError,
  UnrecognizedMessagePatternError,
  RemoteMicroserviceError,
} from "../errors";

/**
 * Global exception filter for microservices.
 *
 * Features:
 * - Logs all exceptions with stack traces
 * - Passes through custom RpcException subclasses unchanged
 * - Enhances standard RpcExceptions with service context
 * - Wraps non-RPC exceptions in a standardized format
 */
@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);
  private readonly serviceName = process.env.SERVICE_NAME || "unknown";

  catch(exception: any, host: ArgumentsHost): Observable<never> {
    // Only handle RPC context
    if (host.getType() !== "rpc") {
      throw exception;
    }

    // Log the error
    this.logger.error(
      `Microservice error: ${exception.message || "Unknown error"}`,
      exception.stack
    );

    // If it's already one of our custom RpcExceptions, pass it through
    if (
      exception instanceof MicroserviceUnavailableError ||
      exception instanceof UnrecognizedMessagePatternError ||
      exception instanceof RemoteMicroserviceError
    ) {
      return throwError(() => exception);
    }

    // If it's an RpcException but not one of our custom ones,
    // preserve its payload but add service context
    if (exception instanceof RpcException) {
      const errorPayload = exception.getError();
      const enhancedPayload = {
        ...errorPayload,
        service: this.serviceName,
        timestamp: new Date().toISOString(),
      };
      return throwError(() => new RpcException(enhancedPayload));
    }

    // For any other type of error, wrap it in an RpcException
    // with a standardized format
    const errorPayload = {
      code: "INTERNAL_SERVER_ERROR",
      service: this.serviceName,
      message: exception.message || "Internal server error",
      timestamp: new Date().toISOString(),
      stack: exception.stack,
    };

    return throwError(() => new RpcException(errorPayload));
  }
}
