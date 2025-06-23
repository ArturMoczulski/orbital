import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { CharactersService } from "./characters.service";
import { CharactersRepository } from "./characters.repository";
import { DatabaseModule } from "../database.module";
import { CharacterModel } from "@orbital/typegoose";

@Module({
  imports: [TypegooseModule.forFeature([CharacterModel])],
  providers: [CharactersService, CharactersRepository],
  exports: [CharactersService],
})
export class CharactersModule {}
