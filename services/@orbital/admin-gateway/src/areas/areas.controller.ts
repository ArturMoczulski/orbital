import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
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

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.areasService.getById(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.areasService.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.areasService.update(id, body);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.areasService.delete(id);
  }
}
