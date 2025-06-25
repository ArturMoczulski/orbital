import { prop, modelOptions } from "@typegoose/typegoose";
import { AreaMap, Position } from "@orbital/core";
import { randomUUID } from "crypto";

@modelOptions({
  schemaOptions: { collection: "areas", timestamps: true },
})
export class AreaModel {
  @prop({ required: true, auto: true, default: () => randomUUID() })
  _id!: string;

  @prop({ required: true })
  name!: string;

  @prop({ required: false })
  description?: string;

  @prop({ type: () => Object, required: false })
  position?: Position;

  @prop({ type: () => Object })
  areaMap?: AreaMap;

  @prop()
  parentId?: string | null;

  @prop({ required: true })
  worldId!: string;

  @prop({ type: () => [String] })
  landmarks?: string[];

  @prop({ type: () => [String] })
  connections?: string[];

  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  @prop({ type: () => [String] })
  tags?: string[];
}
