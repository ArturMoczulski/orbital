import { Injectable } from "@nestjs/common";
import { ConversationModel } from "@orbital/characters-typegoose";
import { ConversationsCRUDService } from "./conversations.crud.service";

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationsCRUDService: ConversationsCRUDService
  ) {}

  async getConversation(id: string): Promise<any | null> {
    return this.conversationsCRUDService.findById(id);
  }

  async createConversation(
    conversation: Partial<ConversationModel>
  ): Promise<any> {
    return this.conversationsCRUDService.create(conversation);
  }

  async updateConversation(
    id: string,
    conversation: Partial<ConversationModel>
  ): Promise<any | null> {
    // Create an object with _id for the update method
    return this.conversationsCRUDService.update({
      _id: id,
      ...conversation,
    });
  }

  async deleteConversation(id: string): Promise<any | null> {
    return this.conversationsCRUDService.delete(id);
  }

  async addMessage(
    id: string,
    text: string,
    characterId?: string
  ): Promise<any | null> {
    const message = {
      _id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      content: { text },
      characterId,
    };

    return this.conversationsCRUDService.addMessage(id, message);
  }
}
