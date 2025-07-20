import { Injectable } from "@nestjs/common";
import { Conversation } from "@orbital/characters";
import { ConversationsCRUDService } from "./conversations.crud.service";

/**
 * Service for managing Conversations
 * This service is a composition that uses ConversationsCRUDService internally
 * and proxies its methods
 */
@Injectable()
export class ConversationService {
  /**
   * Constructor for the ConversationService
   * @param conversationsCRUDService The ConversationsCRUDService instance
   */
  constructor(
    private readonly conversationsCRUDService: ConversationsCRUDService
  ) {}

  /**
   * Create one or more conversations
   * @param dto Single conversation or array of conversations to create
   * @returns The created conversation
   */
  async create(dto: Parameters<ConversationsCRUDService["create"]>[0]) {
    return this.conversationsCRUDService.create(dto);
  }

  /**
   * Find a conversation by ID
   * @param id The conversation ID
   * @param projection Optional fields to project
   * @returns The found conversation or null
   */
  async findById(id: string, projection?: Record<string, any>) {
    return this.conversationsCRUDService.findById(id, projection);
  }

  /**
   * Find conversations by IDs
   * @param ids Array of conversation IDs
   * @returns Array of conversations
   */
  async findByIds(ids: string[]): Promise<Conversation[]> {
    return this.conversationsCRUDService.findByIds(ids);
  }

  /**
   * Update one or more conversations
   * @param entities Single conversation or array of conversations with required _id property
   * @returns The updated conversation
   */
  async update(entities: Parameters<ConversationsCRUDService["update"]>[0]) {
    return this.conversationsCRUDService.update(entities);
  }

  /**
   * Delete one or more conversations by ID
   * @param ids Single ID or array of IDs to delete
   * @returns For singular input, returns true if deleted, null if not found.
   */
  async delete(ids: string | string[]) {
    return this.conversationsCRUDService.delete(ids);
  }

  /**
   * Add a message to a conversation
   * @param id Conversation ID
   * @param text Message text content
   * @param characterId Optional character ID who sent the message
   * @returns Updated conversation
   */
  async addMessage(
    id: string,
    text: string,
    characterId?: string
  ): Promise<Conversation | null> {
    const message = {
      _id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      content: { text },
      characterId,
    };

    return this.conversationsCRUDService.addMessage(id, message);
  }
}
