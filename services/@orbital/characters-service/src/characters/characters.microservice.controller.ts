import { Controller, UseFilters } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { Character, CharacterProps } from "@orbital/characters";
import { WithId, WithoutId } from "@orbital/core";
import { PassThroughRpcExceptionFilter } from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { CharacterService } from "./character.service";
import { CharactersCRUDService } from "./characters.crud.service";

@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("character"))
export class CharactersMicroserviceController extends CRUDController<
  Character,
  CharacterProps,
  CharactersCRUDService
> {
  constructor(
    charactersCRUDService: CharactersCRUDService,
    private readonly characterService: CharacterService
  ) {
    super(charactersCRUDService);
  }

  @MessagePattern("characters-service.CharactersMicroserviceController.create")
  async create(dto: WithoutId<Character> | WithoutId<Character>[]) {
    return super.create(dto);
  }

  @MessagePattern("characters-service.CharactersMicroserviceController.find")
  async find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) {
    return super.find(payload);
  }

  @MessagePattern(
    "characters-service.CharactersMicroserviceController.findById"
  )
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  @MessagePattern(
    "characters-service.CharactersMicroserviceController.findByIds"
  )
  async findByIds(ids: string[]): Promise<Character[]> {
    return this.service.findByIds(ids);
  }

  @MessagePattern("characters-service.CharactersMicroserviceController.update")
  async update(data: WithId<Character> | WithId<Character>[]) {
    // Force type cast to bypass the type checking
    return super.update(data as any);
  }

  @MessagePattern("characters-service.CharactersMicroserviceController.delete")
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }
}
