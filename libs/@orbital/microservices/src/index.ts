// Base microservice class
export { Microservice } from "./microservice";

// Error types
export {
  MicroserviceUnavailableError,
  RemoteMicroserviceError,
  UnrecognizedMessagePatternError,
} from "./errors";

// Decorators
export { MicroserviceController } from "./decorators/controller.decorator";
export { MessagePattern } from "./decorators/message-pattern.decorator";
export {
  MicroserviceCountedBulkRequest,
  MicroserviceItemizedBulkRequest,
  MicroserviceRequest,
  MicroserviceStatusBulkRequest,
} from "./decorators/request.decorators";

// Filters
export { MicroserviceExceptionFilter } from "./filters/microservice-exception.filter";
export { PassThroughRpcExceptionFilter } from "./filters/pass-through-rpc-exception.filter";

// Manager
export {
  MicroserviceManagerModule,
  MicroserviceManagerModuleOptions,
} from "./manager/microservice-manager.module";
export {
  MicroserviceManagerEvents,
  MicroserviceManagerService,
  MicroserviceRegistry,
} from "./manager/microservice-manager.service";

// Bulk operations
export * from "./bulk";
