import { modelOptions, prop } from "@typegoose/typegoose";
import { randomUUID } from "crypto";
import { z } from "zod";

/**
 * Represents a message in a conversation
 */
export const MessageSchema = z
  .object({
    _id: z.string().describe("Unique identifier for the message"),
    timestamp: z.date().describe("Timestamp when the message was sent"),
    content: z
      .object({
        text: z.string().describe("Text content of the message"),
      })
      .describe("Content of the message"),
    characterId: z
      .string()
      .optional()
      .describe(
        "ID of the character who sent the message (optional, if not present it's from the user)"
      ),
  })
  .describe("A message in a conversation");

export type MessageProps = z.infer<typeof MessageSchema>;

/**
 * Interface for identifiable objects
 */
export interface IdentifiableObjectProps {
  _id: string;
}

/**
 * Represents a conversation with a name, messages, and character IDs.
 */
export interface ConversationProps extends IdentifiableObjectProps {
  name: string;
  messages: MessageProps[];
  characterIds: string[];
  tags?: string[];
}

/**
 * TypeGoose model for Conversation document in MongoDB.
 */
@modelOptions({
  schemaOptions: {
    collection: "Conversation", // Use string literal instead of Conversation.name
    timestamps: true,
    _id: true, // Allow MongoDB to override the _id
  },
})
export class ConversationModel implements ConversationProps {
  // Let MongoDB generate the ID
  @prop({ required: false })
  _id!: string;

  // Add Typegoose decorators to properties
  @prop({ required: true })
  name!: string;

  @prop({ type: () => [Object], default: [] })
  messages!: Array<{
    _id: string;
    timestamp: Date;
    content: {
      text: string;
    };
    characterId?: string;
  }>;

  @prop({ type: () => [String], default: [] })
  characterIds!: string[];

  // Add database-specific properties
  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  @prop({ type: () => [String], default: [] })
  tags?: string[];

  /**
   * Add a message to the conversation
   */
  addMessage(text: string, characterId?: string): MessageProps {
    const message: MessageProps = {
      _id: randomUUID(),
      timestamp: new Date(),
      content: {
        text,
      },
      characterId,
    };

    this.messages.push(message);
    return message;
  }
}
