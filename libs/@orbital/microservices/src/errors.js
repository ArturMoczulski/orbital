"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteMicroserviceError = exports.UnrecognizedMessagePatternError = exports.MicroserviceUnavailableError = void 0;
const microservices_1 = require("@nestjs/microservices");
/**
 * Thrown when the target microservice is completely unavailable.
 */
class MicroserviceUnavailableError extends microservices_1.RpcException {
    constructor(service, cause) {
        super({
            code: "MICROSERVICE_UNAVAILABLE",
            service,
            message: `${service} is unavailable`,
        });
        if (cause)
            this.cause = cause;
    }
}
exports.MicroserviceUnavailableError = MicroserviceUnavailableError;
/**
 * Thrown when the microservice is up but no handler matches the requested pattern.
 */
class UnrecognizedMessagePatternError extends microservices_1.RpcException {
    constructor(service, pattern) {
        super({
            code: "UNRECOGNIZED_MESSAGE_PATTERN",
            service,
            pattern,
            message: `Service '${service}' has no handler for '${pattern}'`,
        });
    }
}
exports.UnrecognizedMessagePatternError = UnrecognizedMessagePatternError;
/**
 * Thrown when the remote handler throws an unexpected error.
 * Preserves the remote stack trace in this.stack and the original error details.
 */
class RemoteMicroserviceError extends microservices_1.RpcException {
    constructor(service, pattern, payload) {
        // Pass through the entire payload to preserve all error details
        super({
            code: (payload === null || payload === void 0 ? void 0 : payload.code) || "REMOTE_MICROSERVICE_ERROR",
            service,
            pattern,
            message: payload === null || payload === void 0 ? void 0 : payload.message,
            originalError: (payload === null || payload === void 0 ? void 0 : payload.originalError) || payload,
        });
        // Store the original error for access by error handlers
        this.cause = payload;
        this.originalError = (payload === null || payload === void 0 ? void 0 : payload.originalError) || payload;
        this.stack = payload === null || payload === void 0 ? void 0 : payload.stack;
        this.payload = payload;
    }
    /**
     * Override the getError method to return the full payload
     */
    getError() {
        return this.payload;
    }
}
exports.RemoteMicroserviceError = RemoteMicroserviceError;
//# sourceMappingURL=errors.js.map