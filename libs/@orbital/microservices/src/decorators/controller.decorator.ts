import "reflect-metadata";

/**
 * Class decorator that marks a Nest controller as belonging to a specific microservice.
 * All @MessagePattern() methods inside will use this serviceName as prefix.
 *
 * Usage:
 *   @MicroserviceController("world")
 *   export class AreasController { … }
 */
export function MicroserviceController(serviceName: string) {
  return (ctor: Function) => {
    Reflect.defineMetadata("ms:service", serviceName, ctor);
  };
}
