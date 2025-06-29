"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceRegistry = exports.MicroserviceManagerService = exports.MicroserviceManagerEvents = exports.MicroserviceManagerModule = exports.PassThroughRpcExceptionFilter = exports.MicroserviceExceptionFilter = exports.MicroserviceStatusBulkRequest = exports.MicroserviceRequest = exports.MicroserviceItemizedBulkRequest = exports.MicroserviceCountedBulkRequest = exports.MessagePattern = exports.MicroserviceController = exports.UnrecognizedMessagePatternError = exports.RemoteMicroserviceError = exports.MicroserviceUnavailableError = exports.Microservice = void 0;
// Base microservice class
var microservice_1 = require("./microservice");
Object.defineProperty(exports, "Microservice", { enumerable: true, get: function () { return microservice_1.Microservice; } });
// Error types
var errors_1 = require("./errors");
Object.defineProperty(exports, "MicroserviceUnavailableError", { enumerable: true, get: function () { return errors_1.MicroserviceUnavailableError; } });
Object.defineProperty(exports, "RemoteMicroserviceError", { enumerable: true, get: function () { return errors_1.RemoteMicroserviceError; } });
Object.defineProperty(exports, "UnrecognizedMessagePatternError", { enumerable: true, get: function () { return errors_1.UnrecognizedMessagePatternError; } });
// Decorators
var controller_decorator_1 = require("./decorators/controller.decorator");
Object.defineProperty(exports, "MicroserviceController", { enumerable: true, get: function () { return controller_decorator_1.MicroserviceController; } });
var message_pattern_decorator_1 = require("./decorators/message-pattern.decorator");
Object.defineProperty(exports, "MessagePattern", { enumerable: true, get: function () { return message_pattern_decorator_1.MessagePattern; } });
var request_decorators_1 = require("./decorators/request.decorators");
Object.defineProperty(exports, "MicroserviceCountedBulkRequest", { enumerable: true, get: function () { return request_decorators_1.MicroserviceCountedBulkRequest; } });
Object.defineProperty(exports, "MicroserviceItemizedBulkRequest", { enumerable: true, get: function () { return request_decorators_1.MicroserviceItemizedBulkRequest; } });
Object.defineProperty(exports, "MicroserviceRequest", { enumerable: true, get: function () { return request_decorators_1.MicroserviceRequest; } });
Object.defineProperty(exports, "MicroserviceStatusBulkRequest", { enumerable: true, get: function () { return request_decorators_1.MicroserviceStatusBulkRequest; } });
// Filters
var microservice_exception_filter_1 = require("./filters/microservice-exception.filter");
Object.defineProperty(exports, "MicroserviceExceptionFilter", { enumerable: true, get: function () { return microservice_exception_filter_1.MicroserviceExceptionFilter; } });
var pass_through_rpc_exception_filter_1 = require("./filters/pass-through-rpc-exception.filter");
Object.defineProperty(exports, "PassThroughRpcExceptionFilter", { enumerable: true, get: function () { return pass_through_rpc_exception_filter_1.PassThroughRpcExceptionFilter; } });
// Manager
var microservice_manager_module_1 = require("./manager/microservice-manager.module");
Object.defineProperty(exports, "MicroserviceManagerModule", { enumerable: true, get: function () { return microservice_manager_module_1.MicroserviceManagerModule; } });
var microservice_manager_service_1 = require("./manager/microservice-manager.service");
Object.defineProperty(exports, "MicroserviceManagerEvents", { enumerable: true, get: function () { return microservice_manager_service_1.MicroserviceManagerEvents; } });
Object.defineProperty(exports, "MicroserviceManagerService", { enumerable: true, get: function () { return microservice_manager_service_1.MicroserviceManagerService; } });
Object.defineProperty(exports, "MicroserviceRegistry", { enumerable: true, get: function () { return microservice_manager_service_1.MicroserviceRegistry; } });
// Bulk operations
__exportStar(require("./bulk"), exports);
//# sourceMappingURL=index.js.map