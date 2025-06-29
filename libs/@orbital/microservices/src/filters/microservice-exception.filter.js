"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MicroserviceExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const process_1 = __importDefault(require("process"));
const rxjs_1 = require("rxjs");
/**
 * Catches all exceptions in RPC context and wraps them in an observable error object.
 */
let MicroserviceExceptionFilter = MicroserviceExceptionFilter_1 = class MicroserviceExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(MicroserviceExceptionFilter_1.name);
    }
    catch(exception, host) {
        if (host.getType() === "rpc") {
            this.logger.error(exception.message || exception, exception.stack);
            return (0, rxjs_1.throwError)(() => ({
                status: exception.status || "error",
                message: `Error from ${process_1.default.env.SERVICE_NAME || "remote"} microservice: ` +
                    (exception.message || "Unknown error"),
                stack: exception.stack,
            }));
        }
        throw exception;
    }
};
exports.MicroserviceExceptionFilter = MicroserviceExceptionFilter;
exports.MicroserviceExceptionFilter = MicroserviceExceptionFilter = MicroserviceExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], MicroserviceExceptionFilter);
//# sourceMappingURL=microservice-exception.filter.js.map