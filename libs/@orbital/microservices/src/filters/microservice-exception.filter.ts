import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from "rxjs";
import {
  MicroserviceUnavailableError,
  UnrecognizedMessagePatternError,
  RemoteMicroserviceError,
} from "../errors";

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
      const enhanced = {
        ...payload,
        service: this.serviceName,
        timestamp: new Date().toISOString(),
      };
      if (ctxType === "rpc") {
        return throwError(() => new RpcException(enhanced));
      }
      throw new HttpException(enhanced, HttpStatus.BAD_GATEWAY);
    }

    // Non-Rpc exceptions in RPC context: wrap in RpcException
    if (ctxType === "rpc") {
      const fallback = {
        code: "INTERNAL_SERVER_ERROR",
        service: this.serviceName,
        message:
          exception instanceof Error
            ? exception.message
            : JSON.stringify(exception),
        timestamp: new Date().toISOString(),
        stack: exception instanceof Error ? exception.stack : undefined,
      };
      return throwError(() => new RpcException(fallback));
    }

    // HTTP or other contexts: rethrow original exception
    throw exception;
  }
}
