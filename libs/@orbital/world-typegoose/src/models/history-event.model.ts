import { HistoryEvent, Position } from "@orbital/core";
import { modelOptions, prop } from "@typegoose/typegoose";
import { PositionModel } from "./position.model";

/**
 * TypeGoose model for embedded HistoryEvent sub-document.
 * Extends HistoryEvent from @orbital/core to inherit methods.
 */
@modelOptions({
  schemaOptions: {
    _id: false,
  },
})
export class HistoryEventModel extends HistoryEvent {
  @prop({ required: true })
  override eventId!: string;

  @prop({ required: true })
  role!: string;

  @prop()
  override outcome?: string;

  @prop({ required: true })
  override timestamp!: Date;

  @prop()
  override locationId?: string;

  @prop({ type: () => PositionModel, _id: false })
  override coordinates!: Position;

  // Default empty array for participants required by HistoryEvent
  override participants: string[] = [];
}
