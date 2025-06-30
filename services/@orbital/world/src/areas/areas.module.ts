import { Module } from "@nestjs/common";
import { AreaModel } from "@orbital/typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { AreasMicroserviceController } from "./areas.microservice.controller";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";

@Module({
  imports: [TypegooseModule.forFeature([AreaModel])],
  controllers: [AreasMicroserviceController],
  providers: [AreasRepository, AreasService],
  exports: [AreasService],
})
export class AreasModule {}
