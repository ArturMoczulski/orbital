import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AreasService } from "./areas.service";

@ApiTags("areas")
@Controller("areas")
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  getAll() {
    return this.areasService.getAll();
  }

  @Get("/:_id")
  async getById(@Param("_id") _id: string) {
    try {
      return await this.areasService.getById(_id);
    } catch (error) {
      throw new NotFoundException(`Area with id ${_id} not found`);
    }
  }
  @Get("/:_id/map")
  getMap(@Param("_id") _id: string) {
    return this.areasService.getMap(_id);
  }

  @Post()
  create(@Body() body: any) {
    return this.areasService.create(body);
  }

  @Put("/:_id")
  update(@Param("_id") _id: string, @Body() body: any) {
    return this.areasService.update(_id, body);
  }

  @Delete("/:_id")
  delete(@Param("_id") _id: string) {
    return this.areasService.delete(_id);
  }
}
