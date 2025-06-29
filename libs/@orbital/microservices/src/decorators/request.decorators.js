"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceRequest = MicroserviceRequest;
exports.MicroserviceStatusBulkRequest = MicroserviceStatusBulkRequest;
exports.MicroserviceCountedBulkRequest = MicroserviceCountedBulkRequest;
exports.MicroserviceItemizedBulkRequest = MicroserviceItemizedBulkRequest;
/**
 * Decorator for basic microservice request.
 * Appends RPC response as last argument to original method.
 */
function MicroserviceRequest(message) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const requestFn = this.request;
            const response = await requestFn.call(this, message, ...args);
            return await originalMethod.call(this, ...args, response);
        };
        return descriptor;
    };
}
/**
 * Decorator for status bulk request.
 * Appends BulkResponse as last argument to original method.
 */
function MicroserviceStatusBulkRequest(message) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const response = await this.statusBulkRequest.call(this, message, args[0]);
            return await originalMethod.apply(this, [...args, response]);
        };
        return descriptor;
    };
}
/**
 * Decorator for counted bulk request.
 * Appends BulkCountedResponse as last argument to original method.
 */
function MicroserviceCountedBulkRequest(message) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const response = await this.countedBulkRequest.call(this, message, args[0]);
            return await originalMethod.apply(this, [...args, response]);
        };
        return descriptor;
    };
}
/**
 * Decorator for itemized bulk request.
 * Appends BulkItemizedResponse<DataItemType, ResultItemDataType> as last argument.
 */
function MicroserviceItemizedBulkRequest(message) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const requestFn = this.itemizedBulkRequest;
            const response = await requestFn.call(this, message, args[0]);
            return await originalMethod.apply(this, [...args, response]);
        };
        return descriptor;
    };
}
//# sourceMappingURL=request.decorators.js.map