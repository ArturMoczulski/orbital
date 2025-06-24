import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { AreasService } from "./areas.service";
import type { AreaModel } from "@orbital/typegoose";
import { AreaDto, CreateAreaDto, UpdateAreaDto } from "./dto";

@ApiTags("areas")
@Controller("areas")
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @ApiOperation({ summary: "Create a new area" })
  @ApiBody({ type: CreateAreaDto })
  @ApiResponse({
    status: 201,
    description: "The area has been successfully created.",
    type: AreaDto,
  })
  async createArea(
    @Body(ValidationPipe) createAreaDto: CreateAreaDto
  ): Promise<AreaModel> {
    return this.areasService.createArea(createAreaDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all areas" })
  @ApiResponse({
    status: 200,
    description: "Return all areas",
    type: [AreaDto],
  })
  async getAllAreas(): Promise<AreaModel[]> {
    return this.areasService.getAllAreas();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an area by ID" })
  @ApiParam({ name: "id", description: "Area ID" })
  @ApiResponse({
    status: 200,
    description: "Return the area with the specified ID",
    type: AreaDto,
  })
  @ApiResponse({ status: 404, description: "Area not found" })
  async getArea(@Param("id") id: string): Promise<AreaModel | null> {
    return this.areasService.getArea(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an area" })
  @ApiParam({ name: "id", description: "Area ID" })
  @ApiBody({ type: UpdateAreaDto })
  @ApiResponse({
    status: 200,
    description: "The area has been successfully updated",
    type: AreaDto,
  })
  @ApiResponse({ status: 404, description: "Area not found" })
  async updateArea(
    @Param("id") id: string,
    @Body(ValidationPipe) updateAreaDto: UpdateAreaDto
  ): Promise<AreaModel | null> {
    return this.areasService.updateArea(id, updateAreaDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an area" })
  @ApiParam({ name: "id", description: "Area ID" })
  @ApiResponse({
    status: 200,
    description: "The area has been successfully deleted",
    type: AreaDto,
  })
  @ApiResponse({ status: 404, description: "Area not found" })
  async deleteArea(@Param("id") id: string): Promise<AreaModel | null> {
    return this.areasService.deleteArea(id);
  }

  @Get("world/:worldId")
  @ApiOperation({ summary: "Get areas by world ID" })
  @ApiParam({ name: "worldId", description: "World ID" })
  @ApiResponse({
    status: 200,
    description: "Return areas belonging to the specified world",
    type: [AreaDto],
  })
  async getAreasByWorldId(
    @Param("worldId") worldId: string
  ): Promise<AreaModel[]> {
    return this.areasService.getAreasByWorldId(worldId);
  }

  @Get("parent/:parentId")
  @ApiOperation({ summary: "Get areas by parent ID" })
  @ApiParam({
    name: "parentId",
    description: 'Parent area ID or "null" for root areas',
  })
  @ApiResponse({
    status: 200,
    description: "Return areas with the specified parent",
    type: [AreaDto],
  })
  async getAreasByParentId(
    @Param("parentId") parentId: string
  ): Promise<AreaModel[]> {
    return this.areasService.getAreasByParentId(
      parentId === "null" ? null : parentId
    );
  }

  @Get("tags")
  @ApiOperation({ summary: "Get areas by tags" })
  @ApiQuery({
    name: "tags",
    description: "Comma-separated list of tags",
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Return areas with the specified tags",
    type: [AreaDto],
  })
  async getAreasByTags(@Query("tags") tags: string): Promise<AreaModel[]> {
    const tagArray = tags.split(",");
    return this.areasService.getAreasByTags(tagArray);
  }
}
