import "reflect-metadata";
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
export declare function MicroserviceController(serviceName: string): <T extends Function>(target: T) => T;
