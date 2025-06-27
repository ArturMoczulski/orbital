import { Controller, UseFilters } from "@nestjs/common";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CrudController } from "@orbital/nest";
import { WorldModel as World } from "@orbital/typegoose";
import { WorldsService } from "./worlds.service";

@MicroserviceController("world")
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("world"))
export class WorldsMicroserviceController extends CrudController<
  World,
  WorldsService
> {
  constructor(worldsService: WorldsService) {
    super(worldsService, "World");
  }

  /**
   * Create a new world
   * @param createWorldData Partial world data
   * @returns The created world
   */
  @MessagePattern()
  async createWorld(createWorldData: Partial<World>): Promise<World> {
    return this.service.createWorld(createWorldData);
  }

  /**
   * Get all worlds
   * @returns Array of all worlds
   */
  @MessagePattern()
  async getAllWorlds(): Promise<World[]> {
    return this.service.getAllWorlds();
  }

  /**
   * Get a world by ID
   * @param _id The world ID
   * @returns The world or null
   */
  @MessagePattern()
  async getWorld(_id: string): Promise<World | null> {
    return this.service.getWorld(_id);
  }

  /**
   * Update a world
   * @param updateWorldData Object containing _id and update data
   * @returns The updated world or null
   */
  @MessagePattern()
  async updateWorld(updateWorldData: Partial<World>): Promise<World | null> {
    const { _id, ...updateData } = updateWorldData;
    return this.service.updateWorld(_id as string, updateData);
  }

  /**
   * Delete a world
   * @param _id The world ID
   * @returns The deleted world or null
   */
  @MessagePattern()
  async deleteWorld(_id: string): Promise<World | null> {
    return this.service.deleteWorld(_id);
  }

  /**
   * Get worlds by shard
   * @param shard The shard identifier
   * @returns Array of worlds in the specified shard
   */
  @MessagePattern()
  async getWorldsByShard(shard: string): Promise<World[]> {
    return this.service.getWorldsByShard(shard);
  }

  /**
   * Get worlds by technology level
   * @param techLevel The technology level
   * @returns Array of worlds with the specified technology level
   */
  @MessagePattern()
  async getWorldsByTechLevel(techLevel: number): Promise<World[]> {
    return this.service.getWorldsByTechLevel(techLevel);
  }
}
