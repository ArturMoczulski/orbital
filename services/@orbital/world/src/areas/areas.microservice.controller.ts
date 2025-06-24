import { Controller } from "@nestjs/common";
import { AreasService } from "./areas.service";
import {
  MicroserviceController,
  MessagePattern,
  AsyncAPI,
  AsyncAPIOperation,
} from "@orbital/microservices";
import type { AreaModel } from "@orbital/typegoose";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

// Apply MicroserviceController first, then Controller
@AsyncAPI({
  title: "World Service - Areas API",
  version: "1.0.0",
  description: "API for managing areas in the world service",
})
@MicroserviceController("world")
@Controller()
export class AreasMicroserviceController {
  constructor(private readonly areasService: AreasService) {}

  @AsyncAPIOperation({
    summary: "Create a new area",
    description: "Creates a new area with the provided data",
    message: {
      description: "Area creation request",
      payload: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          worldId: { type: "string" },
          parentId: { type: ["string", "null"] },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["name", "worldId"],
      },
    },
    reply: {
      description: "Created area",
      payload: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          worldId: { type: "string" },
          parentId: { type: ["string", "null"] },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  })
  @MessagePattern()
  async createArea(createAreaDto: CreateAreaDto): Promise<AreaModel> {
    return this.areasService.createArea(createAreaDto);
  }

  @AsyncAPIOperation({
    summary: "Get all areas",
    description: "Retrieves all areas",
    reply: {
      description: "List of all areas",
      payload: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            worldId: { type: "string" },
            parentId: { type: ["string", "null"] },
            tags: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  })
  @MessagePattern()
  async getAllAreas(): Promise<AreaModel[]> {
    return this.areasService.getAllAreas();
  }

  @AsyncAPIOperation({
    summary: "Get area by ID",
    description: "Retrieves an area by its ID",
    message: {
      description: "Area ID",
      payload: { type: "string" },
    },
    reply: {
      description: "Area details",
      payload: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          worldId: { type: "string" },
          parentId: { type: ["string", "null"] },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  })
  @MessagePattern()
  async getArea(id: string): Promise<AreaModel | null> {
    return this.areasService.getArea(id);
  }

  @AsyncAPIOperation({
    summary: "Update area",
    description: "Updates an area with the provided data",
    message: {
      description: "Area update request",
      payload: {
        type: "object",
        properties: {
          id: { type: "string" },
          updateAreaDto: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              parentId: { type: ["string", "null"] },
              tags: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
        required: ["id", "updateAreaDto"],
      },
    },
    reply: {
      description: "Updated area",
      payload: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          worldId: { type: "string" },
          parentId: { type: ["string", "null"] },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  })
  @MessagePattern()
  async updateArea(payload: {
    id: string;
    updateAreaDto: UpdateAreaDto;
  }): Promise<AreaModel | null> {
    return this.areasService.updateArea(payload.id, payload.updateAreaDto);
  }

  @AsyncAPIOperation({
    summary: "Delete area",
    description: "Deletes an area by its ID",
    message: {
      description: "Area ID",
      payload: { type: "string" },
    },
    reply: {
      description: "Deleted area",
      payload: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          worldId: { type: "string" },
          parentId: { type: ["string", "null"] },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  })
  @MessagePattern()
  async deleteArea(id: string): Promise<AreaModel | null> {
    return this.areasService.deleteArea(id);
  }

  @AsyncAPIOperation({
    summary: "Get areas by world ID",
    description: "Retrieves all areas belonging to a specific world",
    message: {
      description: "World ID",
      payload: { type: "string" },
    },
    reply: {
      description: "List of areas in the world",
      payload: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            worldId: { type: "string" },
            parentId: { type: ["string", "null"] },
            tags: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  })
  @MessagePattern()
  async getAreasByWorldId(worldId: string): Promise<AreaModel[]> {
    return this.areasService.getAreasByWorldId(worldId);
  }

  @AsyncAPIOperation({
    summary: "Get areas by parent ID",
    description: "Retrieves all areas with a specific parent ID",
    message: {
      description: "Parent ID (or null for top-level areas)",
      payload: { type: ["string", "null"] },
    },
    reply: {
      description: "List of child areas",
      payload: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            worldId: { type: "string" },
            parentId: { type: ["string", "null"] },
            tags: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  })
  @MessagePattern()
  async getAreasByParentId(parentId: string | null): Promise<AreaModel[]> {
    return this.areasService.getAreasByParentId(parentId);
  }

  @AsyncAPIOperation({
    summary: "Get areas by tags",
    description: "Retrieves all areas that have all the specified tags",
    message: {
      description: "List of tags",
      payload: {
        type: "array",
        items: { type: "string" },
      },
    },
    reply: {
      description: "List of areas with matching tags",
      payload: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            worldId: { type: "string" },
            parentId: { type: ["string", "null"] },
            tags: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  })
  @MessagePattern()
  async getAreasByTags(tags: string[]): Promise<AreaModel[]> {
    return this.areasService.getAreasByTags(tags);
  }
}
