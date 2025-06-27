import { Module } from "@nestjs/common";
import { WorldModel as World } from "@orbital/typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { WorldsMicroserviceController } from "./worlds.microservice.controller";
import { WorldsRepository } from "./worlds.repository";
import { WorldsService } from "./worlds.service";

@Module({
  imports: [TypegooseModule.forFeature([World])],
  providers: [WorldsRepository, WorldsService],
  controllers: [WorldsMicroserviceController],
  exports: [WorldsService],
})
export class WorldsModule {}
