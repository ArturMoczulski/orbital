# AsyncAPI Example for @orbital/microservices

This document provides an example of how to use the AsyncAPI decorators in a microservice controller.

## Controller Example

```typescript
import { Controller } from "@nestjs/common";
import { z } from "zod";
import {
  MicroserviceController,
  MessagePattern,
  AsyncAPI,
  AsyncAPIOperation,
  zodToAsyncAPISchema,
} from "@orbital/microservices";

// Define Zod schemas for request and response
const GetAreaRequestSchema = z.object({
  id: z.string().uuid(),
});

const AreaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["forest", "desert", "mountain", "ocean"]),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

@AsyncAPI({
  title: "World Service",
  version: "1.0.0",
  description: "Service for managing world areas",
  servers: {
    production: {
      url: "nats://nats.example.com:4222",
      protocol: "nats",
      description: "Production NATS server",
    },
  },
})
@MicroserviceController("world")
export class AreasController {
  @AsyncAPIOperation({
    summary: "Get an area by ID",
    description: "Retrieves a single area by its unique identifier",
    tags: ["areas"],
    message: {
      name: "GetAreaRequest",
      description: "Request to get an area by ID",
      payload: zodToAsyncAPISchema(GetAreaRequestSchema),
    },
    reply: {
      name: "AreaResponse",
      description: "Area data response",
      payload: zodToAsyncAPISchema(AreaSchema),
    },
  })
  @MessagePattern()
  async getArea(data: z.infer<typeof GetAreaRequestSchema>) {
    // Implementation
    return {
      id: data.id,
      name: "Forest of Shadows",
      description: "A dark and mysterious forest",
      type: "forest",
      coordinates: { x: 100, y: 200 },
    };
  }

  @AsyncAPIOperation({
    summary: "List all areas",
    description: "Retrieves a list of all areas",
    tags: ["areas"],
    message: {
      name: "ListAreasRequest",
      description: "Request to list all areas",
      payload: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          offset: {
            type: "integer",
            minimum: 0,
            default: 0,
          },
        },
      },
    },
    reply: {
      name: "ListAreasResponse",
      description: "List of areas",
      payload: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: zodToAsyncAPISchema(AreaSchema),
          },
          total: {
            type: "integer",
          },
        },
        required: ["items", "total"],
      },
    },
  })
  @MessagePattern()
  async listAreas(data: { limit?: number; offset?: number }) {
    // Implementation
    return {
      items: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Forest of Shadows",
          type: "forest",
          coordinates: { x: 100, y: 200 },
        },
      ],
      total: 1,
    };
  }
}
```

## Generated AsyncAPI Document

The above controller would generate an AsyncAPI document like this:

```json
{
  "asyncapi": "2.6.0",
  "info": {
    "title": "World Service",
    "version": "1.0.0",
    "description": "Service for managing world areas"
  },
  "servers": {
    "production": {
      "url": "nats://nats.example.com:4222",
      "protocol": "nats",
      "description": "Production NATS server"
    }
  },
  "channels": {
    "world.AreasController.getArea": {
      "description": "Retrieves a single area by its unique identifier",
      "publish": {
        "summary": "Get an area by ID",
        "message": {
          "$ref": "#/components/messages/GetAreaRequest"
        }
      },
      "subscribe": {
        "summary": "Reply for Get an area by ID",
        "message": {
          "$ref": "#/components/messages/AreaResponse"
        }
      }
    },
    "world.AreasController.listAreas": {
      "description": "Retrieves a list of all areas",
      "publish": {
        "summary": "List all areas",
        "message": {
          "$ref": "#/components/messages/ListAreasRequest"
        }
      },
      "subscribe": {
        "summary": "Reply for List all areas",
        "message": {
          "$ref": "#/components/messages/ListAreasResponse"
        }
      }
    }
  },
  "components": {
    "messages": {
      "GetAreaRequest": {
        "name": "GetAreaRequest",
        "description": "Request to get an area by ID",
        "payload": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            }
          },
          "required": ["id"]
        }
      },
      "AreaResponse": {
        "name": "AreaResponse",
        "description": "Area data response",
        "payload": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": ["forest", "desert", "mountain", "ocean"]
            },
            "coordinates": {
              "type": "object",
              "properties": {
                "x": {
                  "type": "number"
                },
                "y": {
                  "type": "number"
                }
              },
              "required": ["x", "y"]
            }
          },
          "required": ["id", "name", "type", "coordinates"]
        }
      },
      "ListAreasRequest": {
        "name": "ListAreasRequest",
        "description": "Request to list all areas",
        "payload": {
          "type": "object",
          "properties": {
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 10
            },
            "offset": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            }
          }
        }
      },
      "ListAreasResponse": {
        "name": "ListAreasResponse",
        "description": "List of areas",
        "payload": {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "format": "uuid"
                  },
                  "name": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "type": {
                    "type": "string",
                    "enum": ["forest", "desert", "mountain", "ocean"]
                  },
                  "coordinates": {
                    "type": "object",
                    "properties": {
                      "x": {
                        "type": "number"
                      },
                      "y": {
                        "type": "number"
                      }
                    },
                    "required": ["x", "y"]
                  }
                },
                "required": ["id", "name", "type", "coordinates"]
              }
            },
            "total": {
              "type": "integer"
            }
          },
          "required": ["items", "total"]
        }
      }
    }
  }
}
```

## Generated Client Code

Using the AsyncAPI generator with the TypeScript template, the above AsyncAPI document would generate a client like this:

```typescript
// Generated client for World Service
import { Microservice } from "@orbital/microservices";
import { Injectable } from "@nestjs/common";

// Generated types from AsyncAPI schema
export interface GetAreaRequest {
  id: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  type: "forest" | "desert" | "mountain" | "ocean";
  coordinates: {
    x: number;
    y: number;
  };
}

export interface ListAreasRequest {
  limit?: number;
  offset?: number;
}

export interface ListAreasResponse {
  items: Area[];
  total: number;
}

@Injectable()
export class WorldClient extends Microservice {
  /**
   * Get an area by ID
   *
   * Retrieves a single area by its unique identifier
   */
  async getArea(request: GetAreaRequest): Promise<Area> {
    return this.request<GetAreaRequest, Area>(
      "world.AreasController.getArea",
      request
    );
  }

  /**
   * List all areas
   *
   * Retrieves a list of all areas
   */
  async listAreas(request: ListAreasRequest = {}): Promise<ListAreasResponse> {
    return this.request<ListAreasRequest, ListAreasResponse>(
      "world.AreasController.listAreas",
      request
    );
  }
}
```

## Usage in a Service

The generated client can be used in a service like this:

```typescript
import { Injectable } from "@nestjs/common";
import { WorldClient } from "./generated/world.client";

@Injectable()
export class AreasService {
  constructor(private readonly worldClient: WorldClient) {}

  async getArea(id: string) {
    try {
      return await this.worldClient.getArea({ id });
    } catch (error) {
      // Handle errors
    }
  }

  async listAreas(limit = 10, offset = 0) {
    try {
      return await this.worldClient.listAreas({ limit, offset });
    } catch (error) {
      // Handle errors
    }
  }
}
```
