import { ApiProperty } from "@nestjs/swagger";

export class MessageDto {
  @ApiProperty({ description: "Unique identifier for the message" })
  _id: string;

  @ApiProperty({ description: "Timestamp when the message was sent" })
  timestamp: Date;

  @ApiProperty({ description: "Content of the message" })
  content: { text: string };

  @ApiProperty({
    description:
      "ID of the character who sent the message (optional, if not present it's from the user)",
    required: false,
  })
  characterId?: string;
}

export class ConversationDto {
  @ApiProperty({ description: "Unique identifier for the conversation" })
  _id: string;

  @ApiProperty({ description: "Name of the conversation" })
  name: string;

  @ApiProperty({
    description: "Messages in the conversation",
    type: [MessageDto],
  })
  messages: MessageDto[];

  @ApiProperty({
    description: "IDs of characters in the conversation",
    type: [String],
  })
  characterIds: string[];

  @ApiProperty({ description: "Timestamp when the conversation was created" })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the conversation was last updated",
  })
  updatedAt: Date;
}

export class CreateConversationDto {
  @ApiProperty({ description: "Name of the conversation" })
  name: string;

  @ApiProperty({
    description: "IDs of characters in the conversation",
    type: [String],
    required: false,
  })
  characterIds?: string[];
}

export class UpdateConversationDto {
  @ApiProperty({ description: "Name of the conversation", required: false })
  name?: string;

  @ApiProperty({
    description: "IDs of characters in the conversation",
    type: [String],
    required: false,
  })
  characterIds?: string[];
}

export class AddMessageDto {
  @ApiProperty({ description: "Text content of the message" })
  text: string;

  @ApiProperty({
    description:
      "ID of the character who sent the message (optional, if not present it's from the user)",
    required: false,
  })
  characterId?: string;
}
