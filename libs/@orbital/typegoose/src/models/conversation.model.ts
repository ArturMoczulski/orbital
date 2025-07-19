import { Conversation } from "@orbital/characters";
import { modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    collection: Conversation.name,
    timestamps: true,
    _id: true, // Allow MongoDB to override the _id
  },
})
export class ConversationModel extends Conversation {
  // Let MongoDB generate the ID
  @prop({ required: false }) // Changed to false to allow MongoDB to generate it
  override _id!: string;

  // Add Typegoose decorators to inherited properties
  @prop({ required: true })
  override name!: string;

  @prop({ type: () => [Object], default: [] })
  override messages!: Array<{
    _id: string;
    timestamp: Date;
    content: {
      text: string;
    };
    characterId?: string;
  }>;

  @prop({ type: () => [String], default: [] })
  override characterIds!: string[];

  // Add database-specific properties
  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  @prop({ type: () => [String], default: [] })
  override tags?: string[];
}
