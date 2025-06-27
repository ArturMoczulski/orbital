import { Controller, UseFilters } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CrudController } from "@orbital/nest";
import { PartialWithoutId, WorldModel as World } from "@orbital/typegoose";
import { WorldsService } from "./worlds.service";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class WorldsMicroserviceController extends CrudController<
  World,
  WorldsService
> {
  constructor(worldsService: WorldsService) {
    super(worldsService);
  }

  /**
   * Create a new world
   * @param createWorldData Partial world data
   * @returns The created world
   */
  @MessagePattern()
  async create(createWorldData: PartialWithoutId<World>): Promise<World> {
    return super.create(createWorldData);
  }

  /**
   * Get all worlds
   * @returns Array of all worlds
   */
  @MessagePattern()
  async find(): Promise<World[]> {
    return super.find();
  }

  /**
   * Get a world by ID
   * @param _id The world ID
   * @returns The world or null
   */
  @MessagePattern()
  async findById(_id: string): Promise<World | null> {
    return super.findById(_id);
  }

  /**
   * Update a world
   * @param updateWorldData Object containing _id and update data
   * @returns The updated world or null
   */
  @MessagePattern()
  async update(updateWorldData: Partial<World>): Promise<World | null> {
    const { _id, ...updateData } = updateWorldData;
    return super.update({ _id: _id as string, ...updateData });
  }

  /**
   * Delete a world
   * @param _id The world ID
   * @returns True if deleted, null if not found
   */
  @MessagePattern()
  async delete(_id: string): Promise<boolean | null> {
    return super.delete(_id);
  }

  /**
   * Find worlds by shard
   * @param shard The shard identifier
   * @returns Array of worlds in the specified shard
   */
  @MessagePattern()
  async findByShard(shard: string): Promise<World[]> {
    return this.service.findByShard(shard);
  }

  /**
   * Find worlds by technology level
   * @param techLevel The technology level
   * @returns Array of worlds with the specified technology level
   */
  @MessagePattern()
  async findByTechLevel(techLevel: number): Promise<World[]> {
    return this.service.findByTechLevel(techLevel);
  }
}
