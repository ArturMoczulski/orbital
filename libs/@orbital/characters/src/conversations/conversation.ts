import { ZodSchema } from "@orbital/core/src/decorators/zod-schema.decorator";
import {
  IdentifiableObject,
  IdentifiableObjectProps,
  IdentifiableObjectSchema,
} from "@orbital/core/src/types/identifiable-object";
import { generateUUID } from "@orbital/core/src/utils/data-generators";
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
 * Represents a conversation with a name, messages, and character IDs.
 */
export type ConversationProps = z.infer<typeof ConversationSchema>;

/** Zod schema for Conversation */
export const ConversationSchema = IdentifiableObjectSchema.extend({
  name: z.string().describe("Name of the conversation"),
  messages: z.array(MessageSchema).describe("Messages in the conversation"),
  characterIds: z
    .array(z.string())
    .describe("IDs of characters in the conversation"),
}).describe("A conversation between characters and/or users");

/**
 * Domain class for Conversation with auto-assignment and validation.
 */
@ZodSchema(ConversationSchema)
export class Conversation
  extends IdentifiableObject
  implements ConversationProps, IdentifiableObjectProps
{
  name: string = "";
  messages: MessageProps[] = [];
  characterIds: string[] = [];

  /** Create a fake Conversation instance with randomized data */
  static mockDefaults(): Partial<ConversationProps> {
    return {
      name: "Conversation",
      messages: [],
      characterIds: [],
    } as Partial<ConversationProps>;
  }

  constructor(data: ConversationProps) {
    // Pass to parent constructor which handles _id
    super(data);

    // Assign properties directly
    this.name = data.name;
    this.messages = data.messages || [];
    this.characterIds = data.characterIds || [];
  }

  /**
   * Add a message to the conversation
   */
  addMessage(text: string, characterId?: string): MessageProps {
    const message: MessageProps = {
      _id: generateUUID(),
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
