import { Injectable } from "@nestjs/common";
import { Conversation } from "@orbital/characters";
import { ConversationsCRUDService } from "./conversations.crud.service";

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationsCRUDService: ConversationsCRUDService
  ) {}

  async getConversation(id: string): Promise<any | null> {
    return this.conversationsCRUDService.findById(id);
  }

  async createConversation(conversation: Partial<Conversation>): Promise<any> {
    return this.conversationsCRUDService.create(conversation);
  }

  async updateConversation(
    id: string,
    conversation: Partial<Conversation>
  ): Promise<any | null> {
    return this.conversationsCRUDService.update(id, conversation);
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
