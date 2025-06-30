import { World } from "@orbital/core";
import { modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    collection: "worlds",
    timestamps: true,
    _id: true, // Allow MongoDB to override the _id
  },
})
export class WorldModel extends World {
  // Let MongoDB generate the ID
  @prop({ required: true })
  override _id!: string;

  // Add Typegoose decorators to inherited properties
  @prop({ required: true })
  override name!: string;

  @prop({ required: true })
  override shard!: string;

  @prop({ required: true })
  override techLevel!: number;

  // Add database-specific properties
  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  constructor(data?: unknown) {
    super(data || {});
  }
}
