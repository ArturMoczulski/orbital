import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { ConversationService } from "./conversation.service";
import { ConversationsCRUDService } from "./conversations.crud.service";
import { ConversationsMicroserviceController } from "./conversations.microservice.controller";
import { ConversationsRepository } from "./conversations.repository";

// Temporary model class for registration with TypegooseModule
// This is needed until the ConversationModel is properly built
export class TempConversationModel {
  static modelName = "Conversation";
}

@Module({
  imports: [TypegooseModule.forFeature([TempConversationModel])],
  controllers: [ConversationsMicroserviceController],
  providers: [
    ConversationsRepository,
    ConversationsCRUDService,
    ConversationService,
  ],
  exports: [ConversationsCRUDService, ConversationService],
})
export class ConversationsModule {}
