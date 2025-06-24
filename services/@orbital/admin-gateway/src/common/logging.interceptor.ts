import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

/**
 * Intercepts all HTTP requests to log method, URL, params, body, and response time.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, params, body } = req;
    const now = Date.now();
    this.logger.log(
      `Incoming ${method} ${url} - params=${JSON.stringify(
        params
      )} body=${JSON.stringify(body)}`
    );
    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        this.logger.log(`Completed ${method} ${url} - ${elapsed}ms`);
      })
    );
  }
}
