import { Controller, UseFilters } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import { WithId, WithoutId, World } from "@orbital/core";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { WorldsCRUDService } from "./worlds.crud.service";
import { WorldProps } from "./worlds.repository";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class WorldsMicroserviceController extends CRUDController<
  World,
  WorldProps,
  WorldsCRUDService
> {
  constructor(worldsService: WorldsCRUDService) {
    super(worldsService);
  }

  /**
   * Create one or more worlds
   * @param dto Single world or array of worlds to create
   * @returns The created world or BulkItemizedResponse for multiple worlds
   */
  @MessagePattern()
  async create(dto: WithoutId<World> | WithoutId<World>[]) {
    return super.create(dto);
  }

  /**
   * Find worlds by a filter
   * @param payload Query filter criteria, projection, and options
   * @returns Array of worlds matching the query
   */
  @MessagePattern()
  async find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) {
    return super.find(payload);
  }

  /**
   * Find a world by ID
   * @param payload Object containing id and optional projection
   * @returns The found world or null
   */
  @MessagePattern()
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  /**
   * Update one or more worlds
   * @param data Single world or array of worlds with required _id property
   * @returns The updated world or BulkItemizedResponse for multiple worlds
   */
  @MessagePattern()
  async update(data: WithId<World> | WithId<World>[]) {
    // Force type cast to bypass the type checking
    return await super.update(data as any);
  }

  /**
   * Delete one or more worlds by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found. For array input, returns a BulkCountedResponse.
   */
  @MessagePattern()
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }

  /**
   * Find worlds by shard
   * @param payload Object containing shard, projection, and options
   * @returns Array of worlds in the specified shard
   */
  @MessagePattern()
  async findByShard(payload: {
    shard: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<World[]> {
    const { shard, projection, options } = payload;
    return this.service.findByShard(shard, projection, options);
  }

  /**
   * Find worlds by tech level
   * @param payload Object containing techLevel, projection, and options
   * @returns Array of worlds with the specified tech level
   */
  @MessagePattern()
  async findByTechLevel(payload: {
    techLevel: number;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<World[]> {
    const { techLevel, projection, options } = payload;
    return this.service.findByTechLevel(techLevel, projection, options);
  }
}
