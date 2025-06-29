import { RpcException } from "@nestjs/microservices";
/**
 * Thrown when the target microservice is completely unavailable.
 */
export declare class MicroserviceUnavailableError extends RpcException {
    constructor(service: string, cause?: Error);
}
/**
 * Thrown when the microservice is up but no handler matches the requested pattern.
 */
export declare class UnrecognizedMessagePatternError extends RpcException {
    constructor(service: string, pattern: string);
}
/**
 * Thrown when the remote handler throws an unexpected error.
 * Preserves the remote stack trace in this.stack and the original error details.
 */
export declare class RemoteMicroserviceError extends RpcException {
    readonly stack?: string;
    readonly originalError?: any;
    private readonly payload;
    constructor(service: string, pattern: string, payload: any);
    /**
     * Override the getError method to return the full payload
     */
    getError(): any;
}
