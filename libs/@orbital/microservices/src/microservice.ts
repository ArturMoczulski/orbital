import { ClientProxy, RpcException } from "@nestjs/microservices";
import {
  lastValueFrom,
  timeout as rxTimeout,
  defaultIfEmpty,
  TimeoutError,
} from "rxjs";
import { NatsError, ErrorCode } from "nats";
import {
  MicroserviceUnavailableError,
  UnrecognizedMessagePatternError,
  RemoteMicroserviceError,
} from "./errors";

/**
 * Base class for all microservice proxies.
 * Provides a scoped request() method with timeout, null-on-empty,
 * and precise RpcException subclasses.
 */
export abstract class Microservice {
  /** Default RPC timeout in milliseconds */
  static DEFAULT_TIMEOUT = 3_000; // Reduced from 15_000 to fail fast on errors

  /** Skip timeout when debugging under --inspect */
  private readonly isDebug = process.execArgv.some((arg: string) =>
    arg.startsWith("--inspect")
  );

  constructor(
    protected readonly client: ClientProxy,
    /** Logical name of the target microservice (e.g. 'world') */
    public readonly serviceName: string
  ) {}

  /**
   * Send an RPC-style request to the target microservice.
   * @param pattern NATS subject / message pattern
   * @param payload Data to send
   * @param opts Optional overrides for timeout or skipTimeout
   * @returns The deserialized response, or null if no payload
   */
  public async request<Res = unknown>(
    pattern: string,
    payload?: unknown,
    opts?: { timeout?: number; skipTimeout?: boolean }
  ): Promise<Res | null> {
    const ms = opts?.timeout ?? Microservice.DEFAULT_TIMEOUT;
    const skipTimeout = opts?.skipTimeout || this.isDebug;

    let obs$ = this.client.send<Res>(pattern, payload ?? {});
    if (!skipTimeout) {
      obs$ = obs$.pipe(rxTimeout(ms));
    }
    obs$ = obs$.pipe(defaultIfEmpty(null as Res));

    try {
      return await lastValueFrom(obs$);
    } catch (err: any) {
      // No responders => service down
      if (err instanceof NatsError && err.code === ErrorCode.NoResponders) {
        throw new MicroserviceUnavailableError(this.serviceName, err);
      }
      // Timeout at Rx layer
      if (err instanceof TimeoutError) {
        throw new MicroserviceUnavailableError(this.serviceName, err);
      }
      // Remote threw an RpcException with payload
      if (err instanceof RpcException) {
        const payload = err.getError() as any;
        // Nest emits UNHANDLED_MESSAGE_PATTERN for no handler
        if (payload?.code === "UNHANDLED_MESSAGE_PATTERN") {
          throw new UnrecognizedMessagePatternError(this.serviceName, pattern);
        }
        // Anything else is a remote error
        throw new RemoteMicroserviceError(this.serviceName, pattern, payload);
      }
      // Fallback: rethrow
      throw err;
    }
  }

  /** Bulk-status RPC helper */
  public statusBulkRequest<T = unknown>(pattern: string, payload?: unknown) {
    return this.request<T>(pattern, payload);
  }

  /** Bulk-counted RPC helper */
  public countedBulkRequest<T = unknown>(pattern: string, payload?: unknown) {
    return this.request<T>(pattern, payload);
  }

  /** Bulk-itemized RPC helper */
  public itemizedBulkRequest<T = unknown>(pattern: string, payload?: unknown) {
    return this.request<T>(pattern, payload);
  }
}
