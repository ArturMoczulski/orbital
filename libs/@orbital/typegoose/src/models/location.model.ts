import { prop, modelOptions } from "@typegoose/typegoose";
import { Location as BaseLocation, HistoryEvent } from "@orbital/core";
import { Types } from "mongoose";

/**
 * TypeGoose model for Location.
 */
@modelOptions({
  schemaOptions: { collection: "locations", timestamps: true },
})
export class LocationModel extends BaseLocation {
  @prop({ required: true, auto: true })
  id!: string;

  @prop({ type: String, ref: "World" })
  world?: string;

  @prop()
  parentId?: string;

  @prop({ type: () => [String] })
  children?: string[];

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  createdAt!: Date;

  @prop()
  description?: string;

  @prop({ type: () => Object, _id: false })
  coordinates!: { x: number; y: number; z: number };

  @prop()
  radius?: number;

  @prop()
  region?: string;

  @prop()
  terrain?: string;

  @prop({ type: () => Object, _id: false })
  climate?: { temperature: string; weatherPattern?: string };

  @prop({ type: () => Object, _id: false })
  size?: { area?: number; elevation?: number };

  @prop({ type: () => [{ type: String, abundance: Number }], _id: false })
  resources?: { type: string; abundance: number }[];

  @prop({
    type: () => [{ name: String, severity: Number, notes: String }],
    _id: false,
  })
  hazards?: { name: string; severity: number; notes?: string }[];

  @prop({
    type: () => [{ characterId: String, role: String, population: Number }],
    _id: false,
  })
  inhabitants?: { characterId: string; role: string; population: number }[];

  @prop({
    type: () => [{ poiId: String, name: String, description: String }],
    _id: false,
  })
  pointsOfInterest?: { poiId: string; name: string; description?: string }[];

  @prop({
    type: () => [{ targetId: String, type: String, distance: Number }],
    _id: false,
  })
  connections?: { targetId: string; type: string; distance: number }[];

  @prop({ type: () => [Object], _id: false })
  history?: HistoryEvent[];

  @prop({ type: () => Object, _id: false })
  dynamicState?: Record<string, any>;

  @prop({ type: () => [String] })
  tags?: string[];
}
