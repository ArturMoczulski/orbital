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
import { AreasService } from "./areas.service";
import type { AreaModel } from "@orbital/typegoose";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

@Controller("areas")
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  async createArea(
    @Body(ValidationPipe) createAreaDto: CreateAreaDto
  ): Promise<AreaModel> {
    return this.areasService.createArea(createAreaDto);
  }

  @Get()
  async getAllAreas(): Promise<AreaModel[]> {
    return this.areasService.getAllAreas();
  }

  @Get(":id")
  async getArea(@Param("id") id: string): Promise<AreaModel | null> {
    return this.areasService.getArea(id);
  }

  @Put(":id")
  async updateArea(
    @Param("id") id: string,
    @Body(ValidationPipe) updateAreaDto: UpdateAreaDto
  ): Promise<AreaModel | null> {
    return this.areasService.updateArea(id, updateAreaDto);
  }

  @Delete(":id")
  async deleteArea(@Param("id") id: string): Promise<AreaModel | null> {
    return this.areasService.deleteArea(id);
  }

  @Get("world/:worldId")
  async getAreasByWorldId(
    @Param("worldId") worldId: string
  ): Promise<AreaModel[]> {
    return this.areasService.getAreasByWorldId(worldId);
  }

  @Get("parent/:parentId")
  async getAreasByParentId(
    @Param("parentId") parentId: string
  ): Promise<AreaModel[]> {
    return this.areasService.getAreasByParentId(
      parentId === "null" ? null : parentId
    );
  }

  @Get("tags")
  async getAreasByTags(@Query("tags") tags: string): Promise<AreaModel[]> {
    const tagArray = tags.split(",");
    return this.areasService.getAreasByTags(tagArray);
  }
}
