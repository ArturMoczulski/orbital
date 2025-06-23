import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { AreaModel } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";
import { AreasController } from "./areas.controller";

@Module({
  imports: [TypegooseModule.forFeature([AreaModel])],
  providers: [AreasRepository, AreasService],
  controllers: [AreasController],
  exports: [AreasService],
})
export class AreasModule {}
