"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagePattern = MessagePattern;
require("reflect-metadata");
const microservices_1 = require("@nestjs/microservices");
/**
 * Replacement for Nest's @MessagePattern().
 * Auto-assembles the subject as "<service>.<ControllerClass>.<methodName>".
 *
 * Requires class to be decorated with @MicroserviceController(serviceName).
 */
function MessagePattern() {
    return (target, propertyKey, descriptor) => {
        const ctor = target.constructor;
        const controllerName = ctor.name;
        console.log(`MessagePattern decorator executing for ${controllerName}.${String(propertyKey)}`);
        console.log(`Metadata keys on constructor:`, Reflect.getMetadataKeys(ctor));
        console.log(`Metadata keys on prototype:`, Reflect.getMetadataKeys(target));
        // Try to get the service name from metadata
        let serviceName;
        // Check on constructor
        serviceName = Reflect.getMetadata("ms:service", ctor);
        console.log(`Service name from constructor metadata:`, serviceName);
        // If not found, check on prototype
        if (!serviceName) {
            serviceName = Reflect.getMetadata("ms:service", target);
            console.log(`Service name from prototype metadata:`, serviceName);
        }
        // Use a fallback service name if not found
        const effectiveServiceName = serviceName || "world";
        if (!serviceName) {
            console.warn(`WARNING: ${controllerName} missing @MicroserviceController(serviceName), using fallback "world"`);
        }
        const action = String(propertyKey);
        const subject = `${effectiveServiceName}.${controllerName}.${action}`;
        console.log(`Using message pattern subject: ${subject}`);
        (0, microservices_1.MessagePattern)(subject)(target, propertyKey, descriptor);
    };
}
//# sourceMappingURL=message-pattern.decorator.js.map