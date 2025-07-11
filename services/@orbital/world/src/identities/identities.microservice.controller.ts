import { Controller, UseFilters } from "@nestjs/common";
import { WithId, WithoutId } from "@orbital/core";
import { IdentityAccount } from "@orbital/identity-types";
import {
  MessagePattern,
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { IdentitiesCRUDService } from "./identities.crud.service";
import { IdentityAccountProps } from "./identities.repository";

@MicroserviceController("identity")
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

  @MessagePattern()
  async create(dto: WithoutId<IdentityAccount> | WithoutId<IdentityAccount>[]) {
    return super.create(dto);
  }

  @MessagePattern()
  async find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) {
    return super.find(payload);
  }

  @MessagePattern()
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  @MessagePattern()
  async update(data: WithId<IdentityAccount> | WithId<IdentityAccount>[]) {
    return super.update(data);
  }

  @MessagePattern()
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }

  @MessagePattern()
  async findByCharacterId(payload: {
    characterId: string;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }): Promise<IdentityAccount[]> {
    const { characterId, projection, options } = payload;
    return this.service.findByCharacterId(characterId, projection, options);
  }
}
