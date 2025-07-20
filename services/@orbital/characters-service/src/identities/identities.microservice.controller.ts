import { Controller, UseFilters } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { WithId, WithoutId } from "@orbital/core";
import { IdentityAccount } from "@orbital/identity-types";
import { PassThroughRpcExceptionFilter } from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { IdentitiesCRUDService } from "./identities.crud.service";
import { IdentityAccountProps } from "./identities.repository";

@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("identity"))
export class IdentitiesMicroserviceController extends CRUDController<
  IdentityAccount,
  IdentityAccountProps,
  IdentitiesCRUDService
> {
  constructor(identitiesService: IdentitiesCRUDService) {
    super(identitiesService);
  }

  @MessagePattern("characters-service.IdentitiesMicroserviceController.create")
  async create(dto: WithoutId<IdentityAccount> | WithoutId<IdentityAccount>[]) {
    return super.create(dto);
  }

  @MessagePattern("characters-service.IdentitiesMicroserviceController.find")
  async find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) {
    return super.find(payload);
  }

  @MessagePattern(
    "characters-service.IdentitiesMicroserviceController.findById"
  )
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  @MessagePattern("characters-service.IdentitiesMicroserviceController.update")
  async update(data: WithId<IdentityAccount> | WithId<IdentityAccount>[]) {
    // Force type cast to bypass the type checking
    return super.update(data as any);
  }

  @MessagePattern("characters-service.IdentitiesMicroserviceController.delete")
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }

  @MessagePattern(
    "characters-service.IdentitiesMicroserviceController.findByCharacterId"
  )
  async findByCharacterId(payload: {
    characterId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<IdentityAccount[]> {
    const { characterId, projection, options } = payload;
    return this.service.findByCharacterId(characterId, projection, options);
  }
}
