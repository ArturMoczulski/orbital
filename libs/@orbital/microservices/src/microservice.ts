import { ClientProxy, RpcException } from "@nestjs/microservices";
import type { BulkOperationResponseDTO } from "@orbital/bulk-operations";
import {
  BulkCountedResponse,
  BulkItemizedResponse,
  BulkOperationError,
  BulkResponse,
} from "@orbital/bulk-operations";
import {
  catchError,
  defaultIfEmpty,
  lastValueFrom,
  Observable,
  OperatorFunction,
  throwError,
  timeout,
  TimeoutError,
} from "rxjs";

// Use string literals instead of importing the enum to break circular dependency
const MICROSERVICE_AVAILABLE_EVENT = "microservice.available";
const MICROSERVICE_UNAVAILABLE_EVENT = "microservice.unavailable";

export class MicroserviceUnavailable extends RpcException {
  constructor(public microservice: string) {
    super({
      code: "MICROSERVICE_UNAVAILABLE",
      message: `Microservice '${microservice}' is unavailable`,
    });
  }
}

export class UnrecognizedMicroserviceMessagePattern extends RpcException {
  constructor(
    public microservice: string,
    public messagePattern: string,
    public args: any
  ) {
    super({
      code: "UNRECOGNIZED_MICROSERVICE_MESSAGE_PATTERN",
      message: `Microservice '${microservice}' does not recognize message pattern '${messagePattern}'`,
    });
  }
}

export abstract class Microservice {
  static RPC_TIMEOUT = 15 * 1000;
  private readonly isDebugMode: boolean;

  constructor(
    protected readonly clientProxy: ClientProxy,
    public readonly microservice?: string
  ) {
    this.isDebugMode = process.execArgv.some((arg) =>
      arg.startsWith("--inspect")
    );
  }

  private rpcPipeline<T>(
    message: string,
    msTimeout: number
  ): OperatorFunction<T, T | null>[] {
    const ops: OperatorFunction<T, T | null>[] = [];
    if (!this.isDebugMode) {
      ops.push(timeout(msTimeout));
    }
    ops.push(defaultIfEmpty(null));
    ops.push(
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RpcException({
                code: "MICROSERVICE_TIMEOUT",
                message: `RPC '${message}' timed out after ${msTimeout}ms: ${
                  err.message || err
                }`,
              })
          );
        }
        return throwError(() => err);
      })
    );
    return ops;
  }

  /**
   * Sends a request to the microservice and returns the response.
   * @param message The message pattern to send to the microservice.
   * @param params The data to send with the message.
   */
  async request<T>(
    message: string,
    params?: any,
    msTimeout = Microservice.RPC_TIMEOUT
  ): Promise<T | null> {
    const isHealthCheckCall = message.endsWith("-health-check");
    let piped$: Observable<T | null> = this.clientProxy.send<T>(
      message,
      params ?? {}
    );
    for (const op of this.rpcPipeline<T>(message, msTimeout)) {
      // @ts-ignore TS2345: mismatched OperatorFunction types
      piped$ = piped$.pipe(op);
    }
    try {
      return await lastValueFrom(piped$);
    } catch (err) {
      const errorPayload =
        err instanceof RpcException && typeof err.getError === "function"
          ? (err.getError() as any)
          : null;
      if (errorPayload?.code === "MICROSERVICE_TIMEOUT") {
        this.clientProxy.emit(MICROSERVICE_UNAVAILABLE_EVENT, {
          microservice: this.microservice!,
        });
        throw new MicroserviceUnavailable(this.microservice!);
      }
      const errMsg =
        err instanceof RpcException && typeof err.getError === "function"
          ? (() => {
              const e = err.getError();
              return typeof e === "string" ? e : (e as any).message;
            })()
          : (err as any).message || String(err);

      if (
        !isHealthCheckCall &&
        errMsg.includes("There are no subscribers listening to that message")
      ) {
        let healthy: boolean;
        try {
          const healthRes = await this.request<string>(
            `${this.microservice}-health-check`,
            undefined,
            msTimeout
          );
          healthy = healthRes === "ok";
        } catch {
          healthy = false;
        }
        if (healthy) {
          throw new UnrecognizedMicroserviceMessagePattern(
            this.microservice!,
            message,
            params
          );
        } else {
          this.clientProxy.emit(MICROSERVICE_UNAVAILABLE_EVENT, {
            microservice: this.microservice!,
          });
          throw new MicroserviceUnavailable(this.microservice!);
        }
      }
      throw err;
    }
  }

  /**
   * Sends a request to the microservice and wraps the result in a BulkResponse.
   */
  async statusBulkRequest(message: string, params: any): Promise<BulkResponse> {
    try {
      const result = await this.request<BulkResponse>(message, params);
      return BulkResponse.fromJson(result);
    } catch (error) {
      throw new BulkOperationError(error);
    }
  }

  /**
   * Sends a request to the microservice and wraps the result in a BulkCountedResponse.
   */
  async countedBulkRequest(
    message: string,
    params: any
  ): Promise<BulkCountedResponse> {
    try {
      const result = await this.request<BulkCountedResponse>(message, params);
      return BulkCountedResponse.fromJson(result);
    } catch (error) {
      throw new BulkOperationError(error);
    }
  }

  /**
   * Sends a request to the microservice and wraps the result in a BulkItemizedResponse.
   */
  async itemizedBulkRequest<DataItemType = any, ResultItemDataType = any>(
    message: string,
    params: any
  ): Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>> {
    try {
      const result = await this.request<
        BulkItemizedResponse<DataItemType, ResultItemDataType>
      >(message, params);
      return BulkItemizedResponse.fromJson(result as BulkOperationResponseDTO);
    } catch (error) {
      throw new BulkOperationError(error);
    }
  }
}
