import { Module } from "@nestjs/common";
import { WorldModel } from "@orbital/world-typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { WorldService } from "./world.service";
import { WorldsCRUDService } from "./worlds.crud.service";
import { WorldsMicroserviceController } from "./worlds.microservice.controller";
import { WorldsRepository } from "./worlds.repository";

@Module({
  imports: [TypegooseModule.forFeature([WorldModel])],
  controllers: [WorldsMicroserviceController],
  providers: [WorldsRepository, WorldsCRUDService, WorldService],
  exports: [WorldsCRUDService, WorldService],
})
export class WorldsModule {}
