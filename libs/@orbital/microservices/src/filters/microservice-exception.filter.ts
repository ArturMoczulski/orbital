import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import process from "process";
import { throwError } from "rxjs";

/**
 * Catches all exceptions in RPC context and wraps them in an observable error object.
 */
@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): any {
    if (host.getType() === "rpc") {
      this.logger.error(exception.message || exception, exception.stack);
      return throwError(() => ({
        status: exception.status || "error",
        message:
          `Error from ${process.env.SERVICE_NAME || "remote"} microservice: ` +
          (exception.message || "Unknown error"),
        stack: exception.stack,
      }));
    }

    throw exception;
  }
}
