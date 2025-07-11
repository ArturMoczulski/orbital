import { Module } from "@nestjs/common";
import { IdentityAccountModel } from "@orbital/identity-typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { IdentitiesCRUDService } from "./identities.crud.service";
import { IdentitiesMicroserviceController } from "./identities.microservice.controller";
import { IdentitiesRepository } from "./identities.repository";
import { IdentitiesService } from "./identities.service";

@Module({
  imports: [TypegooseModule.forFeature([IdentityAccountModel])],
  controllers: [IdentitiesMicroserviceController],
  providers: [IdentitiesRepository, IdentitiesCRUDService, IdentitiesService],
  exports: [IdentitiesCRUDService, IdentitiesService],
})
export class IdentitiesModule {}
