// Base microservice class
export { Microservice } from "./microservice";

// Error types
export {
  MicroserviceUnavailableError,
  UnrecognizedMessagePatternError,
  RemoteMicroserviceError,
} from "./errors";

// Decorators
export { MicroserviceController } from "./decorators/controller.decorator";
export { MessagePattern } from "./decorators/message-pattern.decorator";
export {
  MicroserviceRequest,
  MicroserviceStatusBulkRequest,
  MicroserviceCountedBulkRequest,
  MicroserviceItemizedBulkRequest,
} from "./decorators/request.decorators";

// Filters
export { MicroserviceExceptionFilter } from "./filters/microservice-exception.filter";

// Manager
export {
  MicroserviceManagerService,
  MicroserviceManagerEvents,
  MicroserviceRegistry,
} from "./manager/microservice-manager.service";
export {
  MicroserviceManagerModule,
  MicroserviceManagerModuleOptions,
} from "./manager/microservice-manager.module";

// Bulk operations
export * from "./bulk";
