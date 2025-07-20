import { Module } from "@nestjs/common";
import { AreaModel, WorldModel } from "@orbital/world-typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { AreaService } from "./area.service";
import { AreasCRUDService } from "./areas.crud.service";
import { AreasMicroserviceController } from "./areas.microservice.controller";
import { AreasRepository } from "./areas.repository";

@Module({
  imports: [TypegooseModule.forFeature([AreaModel, WorldModel])],
  controllers: [AreasMicroserviceController],
  providers: [AreasRepository, AreasCRUDService, AreaService],
  exports: [AreasCRUDService, AreaService],
})
export class AreasModule {}
