import { Injectable } from "@nestjs/common";
import { Conversation } from "@orbital/characters";
import { ConversationsRepository } from "./conversations.repository";

@Injectable()
export class ConversationsCRUDService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository
  ) {}

  async findAll(): Promise<any[]> {
    return this.conversationsRepository.findAll();
  }

  async findById(id: string): Promise<any | null> {
    return this.conversationsRepository.findById(id);
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return this.conversationsRepository.findByIds(ids);
  }

  async create(conversation: Partial<Conversation>): Promise<any> {
    return this.conversationsRepository.create(conversation);
  }

  async update(
    id: string,
    conversation: Partial<Conversation>
  ): Promise<any | null> {
    return this.conversationsRepository.update(id, conversation);
  }

  async delete(id: string): Promise<any | null> {
    return this.conversationsRepository.delete(id);
  }

  async addMessage(
    id: string,
    message: {
      _id: string;
      timestamp: Date;
      content: { text: string };
      characterId?: string;
    }
  ): Promise<any | null> {
    return this.conversationsRepository.addMessage(id, message);
  }
}
