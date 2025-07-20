import { Injectable } from "@nestjs/common";
import { Conversation, ConversationProps } from "@orbital/characters";
import { CRUDService } from "@orbital/nest";
import { ConversationsRepository } from "./conversations.repository";

@Injectable()
export class ConversationsCRUDService extends CRUDService<
  Conversation,
  ConversationProps,
  ConversationsRepository
> {
  constructor(conversationsRepository: ConversationsRepository) {
    super(conversationsRepository);
  }

  /**
   * Find conversations by IDs
   * @param ids Array of conversation IDs
   * @returns Array of conversations
   */
  async findByIds(ids: string[]): Promise<Conversation[]> {
    return this.repository.find({ _id: { $in: ids } });
  }

  /**
   * Add a message to a conversation
   * @param id Conversation ID
   * @param message Message to add
   * @returns Updated conversation
   */
  async addMessage(
    id: string,
    message: {
      _id: string;
      timestamp: Date;
      content: { text: string };
      characterId?: string;
    }
  ): Promise<Conversation | null> {
    return this.repository.addMessage(id, message);
  }
}
