import { Injectable, Logger } from "@nestjs/common";
import { AreaMap } from "@orbital/core/src/types/area-map";

@Injectable()
export class AreasService {
  private readonly logger = new Logger(AreasService.name);
  /**
   * Get all areas (mock data)
   */
  getAll(): any[] {
    return [
      {
        id: "1",
        name: "Mock Area 1",
        position: { x: 0, y: 0, z: 0 },
        parentId: null,
        worldId: "world1",
        tags: [],
        description: "",
        landmarks: [],
        connections: [],
      },
      {
        id: "2",
        name: "Mock Area 2",
        position: { x: 10, y: 10, z: 0 },
        parentId: null,
        worldId: "world1",
        tags: ["forest"],
        description: "",
        landmarks: [],
        connections: [],
      },
    ];
  }

  /**
   * Get a single area by ID (mock data)
   */
  getById(id: string): any {
    // Return basic area data without map
    return {
      id,
      name: `Mock Area ${id}`,
      position: { x: 0, y: 0, z: 0 },
      parentId: null,
      worldId: "world1",
      tags: [],
      description: "",
      landmarks: [],
      connections: [],
    };
  }

  /**
   * Create a new area (mock)
   */
  create(body: any): any {
    return body;
  }

  /**
   * Update an area (mock)
   */
  update(id: string, body: any): any {
    return { id, ...body };
  }

  /**
   * Delete an area (mock)
   */
  delete(id: string): any {
    return { deletedId: id };
  }

  /**
   * Get map data for a specific area (mock)
   * Generates a 64x64 randomized map and logs details
   */
  getMap(id: string): any {
    const width = 64;
    const height = 64;

    // Generate randomized grid
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => {
        // Generate a random number between 0 and 7 (inclusive)
        return Math.floor(Math.random() * 8);
      })
    );

    this.logger.log(`getMap id=${id} width=${width} height=${height}`);
    return { id, width, height, grid };
  }
}
