import { prop } from "@typegoose/typegoose";
import { Memory as BaseMemory } from "@orbital/characters";
import type { Position } from "@orbital/core";

/**
 * TypeGoose model for embedded Memory sub-document.
 */
export class MemoryModel implements BaseMemory {
  @prop({ required: true })
  timestamp!: Date;

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  valence!: number;

  @prop()
  locationId?: string;

  @prop({ type: () => Object, _id: false })
  coordinates?: Position;

  @prop({ type: () => [String] })
  tags?: string[];
}
