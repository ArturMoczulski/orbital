import { World } from "@orbital/core";
import { modelOptions, prop } from "@typegoose/typegoose";
import { randomUUID } from "crypto";

@modelOptions({
  schemaOptions: { collection: "worlds", timestamps: true },
})
export class WorldModel extends World {
  // Override _id to add Typegoose decorator
  @prop({ required: true, auto: true, default: () => randomUUID() })
  override _id!: string;

  // Add Typegoose decorators to inherited properties
  @prop({ required: true })
  override name!: string;

  @prop({ required: true })
  override shard!: string;

  @prop({ required: true })
  override techLevel!: number;

  @prop({ type: () => [String], ref: "Location" })
  override locations?: string[];

  // Add database-specific properties
  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  constructor(data?: unknown) {
    super(data || {});
  }
}
