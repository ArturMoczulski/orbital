import { Injectable, Type } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import {
  ASYNCAPI_KEY,
  ASYNCAPI_OPERATION_KEY,
  AsyncAPIOptions,
  AsyncAPIOperationOptions,
} from "./decorators";

// Constants for metadata keys used in our decorators
const MS_SERVICE_KEY = "ms:service";

export interface AsyncAPIDocument {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Record<string, any>;
  channels: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    messages?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

/**
 * Service that generates AsyncAPI documents from controller metadata
 */
@Injectable()
export class AsyncAPIDocumentGenerator {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  /**
   * Generate an AsyncAPI document from all controllers with AsyncAPI metadata
   */
  async generateDocument(): Promise<AsyncAPIDocument> {
    const document: AsyncAPIDocument = {
      asyncapi: "2.6.0",
      info: {
        title: "Microservices API",
        version: "1.0.0",
      },
      channels: {},
      components: {
        schemas: {},
        messages: {},
      },
    };

    // Find all controllers with AsyncAPI metadata
    const controllers = this.discoveryService
      .getControllers()
      .filter((wrapper) => this.reflector.get(ASYNCAPI_KEY, wrapper.metatype));

    // Process each controller
    for (const controller of controllers) {
      this.processController(controller, document);
    }

    return document;
  }

  /**
   * Process a controller and add its operations to the AsyncAPI document
   */
  private processController(
    wrapper: InstanceWrapper,
    document: AsyncAPIDocument
  ): void {
    const { instance, metatype } = wrapper;
    if (!instance || !metatype) return;

    // Get controller metadata
    const asyncApiOptions = this.reflector.get<AsyncAPIOptions>(
      ASYNCAPI_KEY,
      metatype
    );

    // Get the service name from our MicroserviceController decorator
    const serviceName = this.reflector.get<string>(MS_SERVICE_KEY, metatype);

    if (!asyncApiOptions || !serviceName) return;

    // Update document info if this is the first controller
    if (document.info.title === "Microservices API") {
      document.info.title = asyncApiOptions.title;
      document.info.version = asyncApiOptions.version;
      document.info.description = asyncApiOptions.description;
    }

    // Add servers if defined
    if (asyncApiOptions.servers) {
      document.servers = {
        ...document.servers,
        ...(asyncApiOptions.servers as Record<string, any>),
      };
    }

    // Scan methods for operations
    this.metadataScanner.scanFromPrototype(
      instance,
      Object.getPrototypeOf(instance),
      (methodName: string) => {
        // Only process if metatype is a class (Type<any>)
        if (typeof metatype === "function") {
          this.processMethod(
            metatype as Type<any>,
            methodName,
            serviceName,
            document
          );
        }
      }
    );
  }

  /**
   * Process a controller method and add it as an operation to the AsyncAPI document
   */
  private processMethod(
    controllerClass: Type<any>,
    methodName: string,
    serviceName: string,
    document: AsyncAPIDocument
  ): void {
    // Get method metadata
    const asyncApiOperation = this.reflector.get<AsyncAPIOperationOptions>(
      ASYNCAPI_OPERATION_KEY,
      controllerClass.prototype[methodName]
    );

    if (!asyncApiOperation) return;

    // For our MessagePattern, we'll use the controller name and method name
    // since that's how our decorator generates the pattern
    const controllerName = controllerClass.name;
    const messagePattern = methodName;

    // Generate channel name from message pattern
    const channelName = `${serviceName}.${controllerName}.${messagePattern}`;

    // Add message to components if defined
    if (asyncApiOperation.message?.payload) {
      const messageName =
        asyncApiOperation.message.name || `${channelName}Message`;

      document.components!.messages![messageName] = {
        name: messageName,
        title: asyncApiOperation.message.title,
        summary: asyncApiOperation.message.summary,
        description: asyncApiOperation.message.description,
        payload: asyncApiOperation.message.payload,
      };
    }

    // Add reply message to components if defined
    if (asyncApiOperation.reply?.payload) {
      const replyName = asyncApiOperation.reply.name || `${channelName}Reply`;

      document.components!.messages![replyName] = {
        name: replyName,
        title: asyncApiOperation.reply.title,
        summary: asyncApiOperation.reply.summary,
        description: asyncApiOperation.reply.description,
        payload: asyncApiOperation.reply.payload,
      };
    }

    // Add channel
    document.channels[channelName] = {
      description: asyncApiOperation.description,
      publish: asyncApiOperation.message
        ? {
            summary: asyncApiOperation.summary,
            message: {
              $ref: `#/components/messages/${
                asyncApiOperation.message.name || `${channelName}Message`
              }`,
            },
          }
        : undefined,
      subscribe: asyncApiOperation.reply
        ? {
            summary: `Reply for ${asyncApiOperation.summary}`,
            message: {
              $ref: `#/components/messages/${
                asyncApiOperation.reply.name || `${channelName}Reply`
              }`,
            },
          }
        : undefined,
    };
  }
}
