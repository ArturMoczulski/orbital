import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { LocationsService } from "./locations.service";
import { LocationsRepository } from "./locations.repository";
import { LocationModel } from "@orbital/typegoose";

@Module({
  imports: [
    TypegooseModule.forFeature([LocationModel]),
  ],
  providers: [LocationsService, LocationsRepository],
  exports: [LocationsService],
})
export class LocationsModule {}
