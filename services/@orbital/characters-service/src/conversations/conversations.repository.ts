import { Injectable } from "@nestjs/common";
import { Conversation, ConversationProps } from "@orbital/characters";
import { ConversationModel } from "@orbital/characters-typegoose";
import { DocumentRepository } from "@orbital/typegoose";
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";

@Injectable()
export class ConversationsRepository extends DocumentRepository<
  Conversation,
  ConversationProps,
  typeof ConversationModel
> {
  constructor(
    @InjectModel(ConversationModel)
    conversationModel: ReturnModelType<typeof ConversationModel>
  ) {
    super(conversationModel, Conversation);
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
    const conversation = (await this.findById(id)) as Conversation;
    if (!conversation) {
      return null;
    }

    // Use the domain model's addMessage method if the message doesn't have an _id
    if (!message._id) {
      conversation.addMessage(message.content.text, message.characterId);
    } else {
      // Otherwise, add the message directly
      conversation.messages.push(message);
    }

    // Update the conversation using the parent method
    const updated = await this.update(conversation);
    return updated as Conversation;
  }
}
