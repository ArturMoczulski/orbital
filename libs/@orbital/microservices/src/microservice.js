"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Microservice = exports.UnrecognizedMicroserviceMessagePattern = exports.MicroserviceUnavailable = void 0;
const microservices_1 = require("@nestjs/microservices");
const bulk_operations_1 = require("@orbital/bulk-operations");
const rxjs_1 = require("rxjs");
const microservice_manager_service_1 = require("./manager/microservice-manager.service");
class MicroserviceUnavailable extends microservices_1.RpcException {
    constructor(microservice) {
        super({
            code: "MICROSERVICE_UNAVAILABLE",
            message: `Microservice '${microservice}' is unavailable`,
        });
        this.microservice = microservice;
    }
}
exports.MicroserviceUnavailable = MicroserviceUnavailable;
class UnrecognizedMicroserviceMessagePattern extends microservices_1.RpcException {
    constructor(microservice, messagePattern, args) {
        super({
            code: "UNRECOGNIZED_MICROSERVICE_MESSAGE_PATTERN",
            message: `Microservice '${microservice}' does not recognize message pattern '${messagePattern}'`,
        });
        this.microservice = microservice;
        this.messagePattern = messagePattern;
        this.args = args;
    }
}
exports.UnrecognizedMicroserviceMessagePattern = UnrecognizedMicroserviceMessagePattern;
class Microservice {
    constructor(clientProxy, microservice) {
        this.clientProxy = clientProxy;
        this.microservice = microservice;
        this.isDebugMode = process.execArgv.some((arg) => arg.startsWith("--inspect"));
    }
    rpcPipeline(message, msTimeout) {
        const ops = [];
        if (!this.isDebugMode) {
            ops.push((0, rxjs_1.timeout)(msTimeout));
        }
        ops.push((0, rxjs_1.defaultIfEmpty)(null));
        ops.push((0, rxjs_1.catchError)((err) => {
            if (err instanceof rxjs_1.TimeoutError) {
                return (0, rxjs_1.throwError)(() => new microservices_1.RpcException({
                    code: "MICROSERVICE_TIMEOUT",
                    message: `RPC '${message}' timed out after ${msTimeout}ms: ${err.message || err}`,
                }));
            }
            return (0, rxjs_1.throwError)(() => err);
        }));
        return ops;
    }
    /**
     * Sends a request to the microservice and returns the response.
     * @param message The message pattern to send to the microservice.
     * @param params The data to send with the message.
     */
    async request(message, params, msTimeout = Microservice.RPC_TIMEOUT) {
        const isHealthCheckCall = message.endsWith("-health-check");
        let piped$ = this.clientProxy.send(message, params !== null && params !== void 0 ? params : {});
        for (const op of this.rpcPipeline(message, msTimeout)) {
            // @ts-ignore TS2345: mismatched OperatorFunction types
            piped$ = piped$.pipe(op);
        }
        try {
            return await (0, rxjs_1.lastValueFrom)(piped$);
        }
        catch (err) {
            const errorPayload = err instanceof microservices_1.RpcException && typeof err.getError === "function"
                ? err.getError()
                : null;
            if ((errorPayload === null || errorPayload === void 0 ? void 0 : errorPayload.code) === "MICROSERVICE_TIMEOUT") {
                this.clientProxy.emit(microservice_manager_service_1.MicroserviceManagerEvents.Unavailable, {
                    microservice: this.microservice,
                });
                throw new MicroserviceUnavailable(this.microservice);
            }
            const errMsg = err instanceof microservices_1.RpcException && typeof err.getError === "function"
                ? (() => {
                    const e = err.getError();
                    return typeof e === "string" ? e : e.message;
                })()
                : err.message || String(err);
            if (!isHealthCheckCall &&
                errMsg.includes("There are no subscribers listening to that message")) {
                let healthy;
                try {
                    const healthRes = await this.request(`${this.microservice}-health-check`, undefined, msTimeout);
                    healthy = healthRes === "ok";
                }
                catch (_a) {
                    healthy = false;
                }
                if (healthy) {
                    throw new UnrecognizedMicroserviceMessagePattern(this.microservice, message, params);
                }
                else {
                    this.clientProxy.emit(microservice_manager_service_1.MicroserviceManagerEvents.Unavailable, {
                        microservice: this.microservice,
                    });
                    throw new MicroserviceUnavailable(this.microservice);
                }
            }
            throw err;
        }
    }
    /**
     * Sends a request to the microservice and wraps the result in a BulkResponse.
     */
    async statusBulkRequest(message, params) {
        try {
            const result = await this.request(message, params);
            return bulk_operations_1.BulkResponse.fromJson(result);
        }
        catch (error) {
            throw new bulk_operations_1.BulkOperationError(error);
        }
    }
    /**
     * Sends a request to the microservice and wraps the result in a BulkCountedResponse.
     */
    async countedBulkRequest(message, params) {
        try {
            const result = await this.request(message, params);
            return bulk_operations_1.BulkCountedResponse.fromJson(result);
        }
        catch (error) {
            throw new bulk_operations_1.BulkOperationError(error);
        }
    }
    /**
     * Sends a request to the microservice and wraps the result in a BulkItemizedResponse.
     */
    async itemizedBulkRequest(message, params) {
        try {
            const result = await this.request(message, params);
            return bulk_operations_1.BulkItemizedResponse.fromJson(result);
        }
        catch (error) {
            throw new bulk_operations_1.BulkOperationError(error);
        }
    }
}
exports.Microservice = Microservice;
Microservice.RPC_TIMEOUT = 15 * 1000;
//# sourceMappingURL=microservice.js.map