import { Catch, RpcExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from "rxjs";

/**
 * Global RPC exception filter for microservices.
 * Passes through RpcExceptions unchanged to preserve code and stack.
 */
@Catch(RpcException)
export class MicroserviceExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    return throwError(() => exception);
  }
}
