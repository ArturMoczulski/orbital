import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { Conversation } from "@orbital/characters";
import { ConversationService } from "./conversation.service";
import { ConversationsCRUDService } from "./conversations.crud.service";

@Controller()
export class ConversationsMicroserviceController {
  constructor(
    private readonly conversationsCRUDService: ConversationsCRUDService,
    private readonly conversationService: ConversationService
  ) {}

  @MessagePattern({ cmd: "findAllConversations" })
  async findAll(): Promise<any[]> {
    return this.conversationsCRUDService.findAll();
  }

  @MessagePattern({ cmd: "findConversationById" })
  async findById(id: string): Promise<any | null> {
    return this.conversationsCRUDService.findById(id);
  }

  @MessagePattern({ cmd: "findConversationsByIds" })
  async findByIds(ids: string[]): Promise<any[]> {
    return this.conversationsCRUDService.findByIds(ids);
  }

  @MessagePattern({ cmd: "createConversation" })
  async create(conversation: Partial<Conversation>): Promise<any> {
    return this.conversationsCRUDService.create(conversation);
  }

  @MessagePattern({ cmd: "updateConversation" })
  async update(data: {
    id: string;
    conversation: Partial<Conversation>;
  }): Promise<any | null> {
    return this.conversationsCRUDService.update(data.id, data.conversation);
  }

  @MessagePattern({ cmd: "deleteConversation" })
  async delete(id: string): Promise<any | null> {
    return this.conversationsCRUDService.delete(id);
  }

  @MessagePattern({ cmd: "addMessageToConversation" })
  async addMessage(data: {
    id: string;
    text: string;
    characterId?: string;
  }): Promise<any | null> {
    return this.conversationService.addMessage(
      data.id,
      data.text,
      data.characterId
    );
  }
}
