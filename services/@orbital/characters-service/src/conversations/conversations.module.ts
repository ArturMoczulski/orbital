import { Module } from "@nestjs/common";
import { ConversationModel } from "@orbital/characters-typegoose";
import { TypegooseModule } from "nestjs-typegoose";
import { ConversationService } from "./conversation.service";
import { ConversationsCRUDService } from "./conversations.crud.service";
import { ConversationsMicroserviceController } from "./conversations.microservice.controller";
import { ConversationsRepository } from "./conversations.repository";

@Module({
  imports: [TypegooseModule.forFeature([ConversationModel])],
  controllers: [ConversationsMicroserviceController],
  providers: [
    ConversationsRepository,
    ConversationsCRUDService,
    ConversationService,
  ],
  exports: [ConversationsCRUDService, ConversationService],
})
export class ConversationsModule {}
