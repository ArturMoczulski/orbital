import { RpcException } from "@nestjs/microservices";

/**
 * Thrown when the target microservice is completely unavailable.
 */
export class MicroserviceUnavailableError extends RpcException {
  constructor(service: string, cause?: Error) {
    super({
      code: "MICROSERVICE_UNAVAILABLE",
      service,
      message: `${service} is unavailable`,
    });
    if (cause) (this as any).cause = cause;
  }
}

/**
 * Thrown when the microservice is up but no handler matches the requested pattern.
 */
export class UnrecognizedMessagePatternError extends RpcException {
  constructor(service: string, pattern: string) {
    super({
      code: "UNRECOGNIZED_MESSAGE_PATTERN",
      service,
      pattern,
      message: `Service '${service}' has no handler for '${pattern}'`,
    });
  }
}

/**
 * Thrown when the remote handler throws an unexpected error.
 * Preserves the remote stack trace in this.stack.
 */
export class RemoteMicroserviceError extends RpcException {
  readonly stack?: string;

  constructor(service: string, pattern: string, payload: any) {
    super({
      code: "REMOTE_MICROSERVICE_ERROR",
      service,
      pattern,
      message: payload?.message,
    });
    (this as any).cause = payload;
    this.stack = payload?.stack;
  }
}
