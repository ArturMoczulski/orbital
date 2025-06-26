import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AreasService } from "./areas.service";
import { CreateAreaDto, UpdateAreaDto } from "./dto/area.dto";

@ApiTags("areas")
@Controller("areas")
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiOperation({ summary: "Get all areas" })
  @ApiResponse({ status: 200, description: "Returns all areas" })
  getAll() {
    return this.areasService.getAll();
  }

  @Get("/:_id")
  @ApiOperation({ summary: "Get area by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns the area with the specified ID",
  })
  @ApiResponse({ status: 404, description: "Area not found" })
  @ApiParam({ name: "_id", description: "The ID of the area to retrieve" })
  async getById(@Param("_id") _id: string) {
    try {
      return await this.areasService.getById(_id);
    } catch (error) {
      throw new NotFoundException(`Area with id ${_id} not found`);
    }
  }

  @Get("/:_id/map")
  @ApiOperation({ summary: "Get map for an area" })
  @ApiResponse({
    status: 200,
    description: "Returns the map for the specified area",
  })
  @ApiParam({
    name: "_id",
    description: "The ID of the area to get the map for",
  })
  getMap(@Param("_id") _id: string) {
    return this.areasService.getMap(_id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new area" })
  @ApiResponse({
    status: 201,
    description: "The area has been successfully created.",
  })
  create(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.create(createAreaDto);
  }

  @Put("/:_id")
  @ApiOperation({ summary: "Update an existing area" })
  @ApiResponse({
    status: 200,
    description: "The area has been successfully updated.",
  })
  @ApiParam({ name: "_id", description: "The ID of the area to update" })
  update(@Param("_id") _id: string, @Body() updateAreaDto: UpdateAreaDto) {
    return this.areasService.update(_id, updateAreaDto);
  }

  @Delete("/:_id")
  @ApiOperation({ summary: "Delete an area" })
  @ApiResponse({
    status: 200,
    description: "The area has been successfully deleted",
  })
  @ApiResponse({ status: 404, description: "Area not found" })
  @ApiParam({ name: "_id", description: "The ID of the area to delete" })
  delete(@Param("_id") _id: string) {
    return this.areasService.delete(_id);
  }
}
