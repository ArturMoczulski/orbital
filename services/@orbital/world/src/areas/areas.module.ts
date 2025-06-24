import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { AreaModel } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";
import { AreasMicroserviceController } from "./areas.microservice.controller";

@Module({
  imports: [TypegooseModule.forFeature([AreaModel])],
  providers: [AreasRepository, AreasService],
  controllers: [AreasMicroserviceController],
  exports: [AreasService],
})
export class AreasModule {}
