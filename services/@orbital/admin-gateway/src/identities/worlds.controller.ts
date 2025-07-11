import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateWorldDto, UpdateWorldDto } from "./dto/world.dto";
import { WorldsService } from "./worlds.service";

@ApiTags("worlds")
@Controller("worlds")
export class WorldsController {
  constructor(private readonly worldsService: WorldsService) {}

  @Get()
  @ApiOperation({ summary: "Get all worlds" })
  @ApiResponse({ status: 200, description: "Returns all worlds" })
  @ApiQuery({
    name: "shard",
    required: false,
    description: "Filter worlds by shard",
  })
  @ApiQuery({
    name: "techLevel",
    required: false,
    description: "Filter worlds by tech level",
  })
  find(@Query("shard") shard?: string, @Query("techLevel") techLevel?: string) {
    if (shard) {
      return this.worldsService.findByShard(shard);
    } else if (techLevel) {
      return this.worldsService.findByTechLevel(parseInt(techLevel, 10));
    } else {
      return this.worldsService.find();
    }
  }

  @Get("/:_id")
  @ApiOperation({ summary: "Get world by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns the world with the specified ID",
  })
  @ApiResponse({ status: 404, description: "World not found" })
  @ApiParam({ name: "_id", description: "The ID of the world to retrieve" })
  async findById(@Param("_id") _id: string) {
    try {
      return await this.worldsService.findById(_id);
    } catch (error) {
      throw new NotFoundException(`World with id ${_id} not found`);
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a new world" })
  @ApiResponse({
    status: 201,
    description: "The world has been successfully created.",
  })
  create(@Body() createWorldDto: CreateWorldDto) {
    return this.worldsService.create(createWorldDto);
  }

  @Put("/:_id")
  @ApiOperation({ summary: "Update an existing world" })
  @ApiResponse({
    status: 200,
    description: "The world has been successfully updated.",
  })
  @ApiParam({ name: "_id", description: "The ID of the world to update" })
  update(@Param("_id") _id: string, @Body() updateWorldDto: UpdateWorldDto) {
    return this.worldsService.update(_id, updateWorldDto);
  }

  @Delete("/:_id")
  @ApiOperation({ summary: "Delete a world" })
  @ApiResponse({
    status: 200,
    description: "The world has been successfully deleted",
  })
  @ApiResponse({ status: 404, description: "World not found" })
  @ApiParam({ name: "_id", description: "The ID of the world to delete" })
  delete(@Param("_id") _id: string) {
    return this.worldsService.delete(_id);
  }
}
