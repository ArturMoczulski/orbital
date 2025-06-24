import "reflect-metadata";
import { MessagePattern as NestMessagePattern } from "@nestjs/microservices";

/**
 * Replacement for Nest's @MessagePattern().
 * Auto-assembles the subject as "<service>.<ControllerClass>.<methodName>".
 *
 * Requires class to be decorated with @MicroserviceController(serviceName).
 */
export function MessagePattern(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const ctor = target.constructor as Function;
    const serviceName: string | undefined = Reflect.getMetadata(
      "ms:service",
      ctor
    );
    if (!serviceName) {
      throw new Error(
        `${ctor.name} missing @MicroserviceController(serviceName)`
      );
    }
    const controllerName = ctor.name;
    const action = String(propertyKey);
    const subject = `${serviceName}.${controllerName}.${action}`;
    NestMessagePattern(subject)(target, propertyKey, descriptor);
  };
}
