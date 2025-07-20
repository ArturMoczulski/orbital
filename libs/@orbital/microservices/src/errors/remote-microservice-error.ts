import { RpcException } from "@nestjs/microservices";

/**
 * Thrown when the remote handler throws an unexpected error.
 * Preserves the remote stack trace in this.stack and the original error details.
 */
export class RemoteMicroserviceError extends RpcException {
  readonly stack?: string;
  readonly originalError?: any;
  private readonly payload: any;

  constructor(service: string, pattern: string, payload: any) {
    // Pass through the entire payload to preserve all error details
    super({
      code: payload?.code || "REMOTE_MICROSERVICE_ERROR",
      service,
      pattern,
      message: payload?.message,
      originalError: payload?.originalError || payload,
    });

    // Store the original error for access by error handlers
    (this as any).cause = payload;
    this.originalError = payload?.originalError || payload;
    this.stack = payload?.stack;
    this.payload = payload;
  }

  /**
   * Override the getError method to return the full payload
   */
  getError(): any {
    return this.payload;
  }
}
