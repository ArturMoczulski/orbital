# AsyncAPI Code Generation for @orbital/microservices

This document outlines the process for generating client code from AsyncAPI specifications in the @orbital/microservices framework.

## Overview

AsyncAPI is a specification for describing message-driven APIs in a machine-readable format. By generating code from AsyncAPI specifications, we can automate the creation of client libraries, documentation, and validation schemas.

## Implementation Plan

### 1. AsyncAPI Document Generation

1. **Create AsyncAPI Document Generator**

   - Implement a decorator-based approach to extract AsyncAPI metadata from controllers
   - Use NestJS metadata reflection to gather information about message patterns
   - Generate AsyncAPI JSON/YAML documents from collected metadata

2. **Integrate with Zod Schemas**
   - Use Zod schemas for request/response validation
   - Extract schema information for AsyncAPI document generation
   - Ensure schema definitions are compatible with AsyncAPI specification

### 2. Code Generation Pipeline

1. **Setup AsyncAPI Generator**

   - Integrate with [@asyncapi/generator](https://github.com/asyncapi/generator)
   - Create custom templates for TypeScript client generation
   - Configure output paths and options

2. **Custom Templates**

   - Create templates for generating TypeScript clients
   - Include proper typing for request/response objects
   - Generate methods that match controller methods
   - Include error handling and timeout logic

3. **Build Process Integration**
   - Add build step to generate clients during development
   - Create watch mode for regenerating clients when controllers change
   - Add CLI commands for manual generation

### 3. Client Usage

Generated clients will follow this pattern:

```typescript
// Example of a generated client
import { WorldClient } from "./generated/world.client";

// In a service or controller
@Injectable()
export class SomeService {
  constructor(private readonly worldClient: WorldClient) {}

  async getArea(id: string) {
    try {
      return await this.worldClient.getArea({ id });
    } catch (error) {
      // Handle errors (RemoteMicroserviceError, etc.)
    }
  }
}
```

## Technical Components

### 1. AsyncAPI Decorator

```typescript
// Example implementation
export function AsyncAPI(options: AsyncAPIOptions) {
  return (target: any) => {
    // Store AsyncAPI metadata on the class
    Reflect.defineMetadata(ASYNCAPI_KEY, options, target);
  };
}

export function AsyncAPIOperation(options: AsyncAPIOperationOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Store operation metadata on the method
    Reflect.defineMetadata(
      ASYNCAPI_OPERATION_KEY,
      options,
      target,
      propertyKey
    );
  };
}
```

### 2. Schema Extraction

```typescript
// Example implementation
function extractZodSchema(schema: z.ZodType<any>) {
  // Convert Zod schema to JSON Schema
  const jsonSchema = zodToJsonSchema(schema);

  // Convert JSON Schema to AsyncAPI schema
  return convertToAsyncAPISchema(jsonSchema);
}
```

### 3. Document Generation

```typescript
// Example implementation
export class AsyncAPIDocumentGenerator {
  generate(controllers: Type<any>[]) {
    const document: AsyncAPIDocument = {
      asyncapi: "2.6.0",
      info: {
        title: "Microservice API",
        version: "1.0.0",
      },
      channels: {},
      components: {
        schemas: {},
        messages: {},
      },
    };

    // Process each controller
    for (const controller of controllers) {
      this.processController(controller, document);
    }

    return document;
  }

  private processController(controller: Type<any>, document: AsyncAPIDocument) {
    // Extract controller metadata
    // Add channels and messages to the document
  }
}
```

### 4. Code Generation Command

```typescript
// Example implementation
export async function generateClients(options: GenerateOptions) {
  const generator = new AsyncAPIGenerator();

  // Load AsyncAPI document
  const document = loadAsyncAPIDocument(options.input);

  // Generate client code
  await generator.generate(document, options.template, options.output);
}
```

## Integration with @orbital/microservices

The AsyncAPI code generation will be integrated with the existing `@MicroserviceController` and `@MessagePattern` decorators:

```typescript
@AsyncAPI({
  title: "World Service",
  version: "1.0.0",
})
@MicroserviceController("world")
export class WorldController {
  @AsyncAPIOperation({
    summary: "Get an area by ID",
    message: {
      payload: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
  })
  @MessagePattern("getArea")
  async getArea(@Payload() data: { id: string }) {
    // Implementation
  }
}
```

## Next Steps

1. Implement the AsyncAPI decorator and metadata collection
2. Create the document generator
3. Set up the code generation pipeline
4. Integrate with the build process
5. Create documentation and examples
