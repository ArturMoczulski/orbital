import "reflect-metadata";
/**
 * Replacement for Nest's @MessagePattern().
 * Auto-assembles the subject as "<service>.<ControllerClass>.<methodName>".
 *
 * Requires class to be decorated with @MicroserviceController(serviceName).
 */
export declare function MessagePattern(): MethodDecorator;
