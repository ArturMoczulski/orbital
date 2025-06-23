import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { WorldsService } from "./worlds.service";
import { WorldsRepository } from "./worlds.repository";
import { WorldModel } from "@orbital/typegoose";

@Module({
  imports: [
    TypegooseModule.forFeature([WorldModel]),
  ],
  providers: [WorldsService, WorldsRepository],
  exports: [WorldsService],
})
export class WorldsModule {}
