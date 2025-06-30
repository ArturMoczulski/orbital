import { Module } from "@nestjs/common";
import { AreaModel } from "@orbital/typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { AreasCRUDService } from "./areas.crud.service";
import { AreasMicroserviceController } from "./areas.microservice.controller";
import { AreasRepository } from "./areas.repository";

@Module({
  imports: [TypegooseModule.forFeature([AreaModel])],
  controllers: [AreasMicroserviceController],
  providers: [AreasRepository, AreasCRUDService],
  exports: [AreasCRUDService],
})
export class AreasModule {}
