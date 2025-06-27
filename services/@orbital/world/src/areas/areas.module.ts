import { Module } from "@nestjs/common";
import { AreaModel as Area } from "@orbital/typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { AreasMicroserviceController } from "./areas.microservice.controller";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";

@Module({
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: Area, schemaOptions: { collection: "areas" } },
    ]),
  ],
  providers: [AreasRepository, AreasService],
  controllers: [AreasMicroserviceController],
  exports: [AreasService],
})
export class AreasModule {}
