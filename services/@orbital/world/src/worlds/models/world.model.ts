import { prop, modelOptions } from "@typegoose/typegoose";
// @ts-ignore
import { Types } from "mongoose";
import { LocationModel } from "@orbital/typegoose";

@modelOptions({
  schemaOptions: { collection: "worlds", timestamps: true },
})
export class WorldModel {
  @prop({ required: true, auto: true })
  _id!: string;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  shard!: string;

  @prop({ required: true })
  techLevel!: number;

  @prop({ type: String, ref: "Location" })
  locations?: string[];
}
