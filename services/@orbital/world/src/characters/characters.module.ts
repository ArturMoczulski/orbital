import { Module } from "@nestjs/common";
import { CharacterModel, WorldModel } from "@orbital/typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { CharacterService } from "./character.service";
import { CharactersCRUDService } from "./characters.crud.service";
import { CharactersMicroserviceController } from "./characters.microservice.controller";
import { CharactersRepository } from "./characters.repository";

@Module({
  imports: [TypegooseModule.forFeature([CharacterModel, WorldModel])],
  controllers: [CharactersMicroserviceController],
  providers: [CharactersRepository, CharactersCRUDService, CharacterService],
  exports: [CharactersCRUDService, CharacterService],
})
export class CharactersModule {}
