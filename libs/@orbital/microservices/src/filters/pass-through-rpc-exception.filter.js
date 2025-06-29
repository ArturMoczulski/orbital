"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PassThroughRpcExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassThroughRpcExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const process_1 = __importDefault(require("process"));
const rxjs_1 = require("rxjs");
const errors_1 = require("../errors");
/**
 * Exception filter for microservices that preserves original error details in RPC responses.
 *
 * This filter is designed to be used in microservices to ensure that error details,
 * including stack traces and additional context, are properly serialized and passed
 * through to the client. This makes debugging easier by preserving the original
 * error information across service boundaries.
 */
let PassThroughRpcExceptionFilter = PassThroughRpcExceptionFilter_1 = class PassThroughRpcExceptionFilter {
    /**
     * Creates a new instance of the PassThroughRpcExceptionFilter.
     *
     * @param serviceName The name of the microservice using this filter.
     *                    Used to identify the source of errors.
     *                    Can be a string or an OrbitalMicroservices enum value.
     */
    constructor(serviceName) {
        this.logger = new common_1.Logger(PassThroughRpcExceptionFilter_1.name);
        this.serviceName =
            (serviceName === null || serviceName === void 0 ? void 0 : serviceName.toString()) || process_1.default.env.SERVICE_NAME || "unknown";
    }
    catch(exception, host) {
        var _a, _b;
        const ctxType = host.getType();
        this.logger.error(`triggered ${this.serviceName} exception filter`);
        // Log the exception with more details
        this.logger.error(`Exception in ${ctxType} context: ${exception instanceof Error
            ? exception.message
            : JSON.stringify(exception)}`, exception instanceof Error ? exception.stack : undefined);
        // Log more details about the exception for debugging
        this.logger.error(`Full exception details: ${JSON.stringify({
            type: (_a = exception === null || exception === void 0 ? void 0 : exception.constructor) === null || _a === void 0 ? void 0 : _a.name,
            message: exception === null || exception === void 0 ? void 0 : exception.message,
            isError: exception instanceof Error,
            isRpcException: exception instanceof microservices_1.RpcException,
            stack: (_b = exception === null || exception === void 0 ? void 0 : exception.stack) === null || _b === void 0 ? void 0 : _b.split("\n").slice(0, 5),
            context: ctxType,
            properties: Object.getOwnPropertyNames(exception || {}),
        }, null, 2)}`);
        // Only handle RPC context
        if (ctxType !== "rpc") {
            throw exception;
        }
        // Create a serializable error object
        const serializableError = {};
        if (exception instanceof Error) {
            // Add standard error properties
            serializableError.name = exception.name || "Error";
            serializableError.message = exception.message || "Unknown error";
            serializableError.stack = exception.stack;
            // Add any additional properties from the error object
            Object.getOwnPropertyNames(exception).forEach((prop) => {
                if (prop !== "name" && prop !== "message" && prop !== "stack") {
                    serializableError[prop] = exception[prop];
                }
            });
        }
        else {
            // For non-Error objects, just stringify
            serializableError.data = JSON.stringify(exception);
        }
        // If it's already an RpcException, extract its error
        if (exception instanceof microservices_1.RpcException) {
            const originalError = exception.getError();
            // Enhance the error with additional information
            const enhancedError = Object.assign(Object.assign({}, (typeof originalError === "object"
                ? originalError
                : { message: originalError })), { service: this.serviceName, timestamp: new Date().toISOString(), stack: exception instanceof Error ? exception.stack : undefined, originalError: serializableError });
            return (0, rxjs_1.throwError)(() => new errors_1.RemoteMicroserviceError(this.serviceName, "unknown", enhancedError));
        }
        // For other types of exceptions, create a new RpcException with detailed information
        const errorPayload = {
            code: "INTERNAL_SERVER_ERROR",
            service: this.serviceName,
            message: exception instanceof Error ? exception.message : String(exception),
            timestamp: new Date().toISOString(),
            stack: exception instanceof Error ? exception.stack : undefined,
            originalError: serializableError,
            // Include the raw error for easier debugging
            rawError: String(exception),
        };
        this.logger.debug(`Returning new RemoteMicroserviceError with payload: ${JSON.stringify(errorPayload)}`);
        return (0, rxjs_1.throwError)(() => new errors_1.RemoteMicroserviceError(this.serviceName, "unknown", errorPayload));
    }
};
exports.PassThroughRpcExceptionFilter = PassThroughRpcExceptionFilter;
exports.PassThroughRpcExceptionFilter = PassThroughRpcExceptionFilter = PassThroughRpcExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [String])
], PassThroughRpcExceptionFilter);
//# sourceMappingURL=pass-through-rpc-exception.filter.js.map