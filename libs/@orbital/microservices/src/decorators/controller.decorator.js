"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceController = MicroserviceController;
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
/**
 * Class decorator that marks a Nest controller as belonging to a specific microservice.
 * All @MessagePattern() methods inside will use this serviceName as prefix.
 *
 * This decorator applies the NestJS Controller decorator and then adds our custom metadata.
 *
 * Usage:
 *   @MicroserviceController("world")
 *   export class AreasController { … }
 */
function MicroserviceController(serviceName) {
    console.log(`Creating MicroserviceController decorator with service name: ${serviceName}`);
    // Create a custom decorator function that preserves the type of the target
    return function (target) {
        const controllerName = target.name;
        console.log(`MicroserviceController decorator executing for ${controllerName}`);
        // Apply the NestJS Controller decorator
        (0, common_1.Controller)("")(target);
        // Set our custom metadata using NestJS SetMetadata
        (0, common_1.SetMetadata)("ms:service", serviceName)(target);
        // Set metadata directly on both constructor and prototype for redundancy
        Reflect.defineMetadata("ms:service", serviceName, target);
        Reflect.defineMetadata("ms:service", serviceName, target.prototype);
        // Ensure NestJS controller metadata is properly set
        Reflect.defineMetadata(constants_1.CONTROLLER_WATERMARK, true, target);
        Reflect.defineMetadata(constants_1.PATH_METADATA, "/", target);
        // Log all metadata keys to verify
        console.log(`Metadata keys on ${target.name} constructor:`, Reflect.getMetadataKeys(target));
        console.log(`Metadata keys on ${target.name} prototype:`, Reflect.getMetadataKeys(target.prototype));
        console.log(`ms:service value on constructor:`, Reflect.getMetadata("ms:service", target));
        console.log(`ms:service value on prototype:`, Reflect.getMetadata("ms:service", target.prototype));
        return target;
    };
}
//# sourceMappingURL=controller.decorator.js.map