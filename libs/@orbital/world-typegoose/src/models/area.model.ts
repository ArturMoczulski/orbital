import { Area, AreaMap, Position } from "@orbital/core";
import { Reference } from "@orbital/typegoose/dist/decorators/reference.decorator";
import { modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    collection: "areas",
    timestamps: true,
    _id: true, // Allow MongoDB to override the _id
  },
})
export class AreaModel extends Area {
  // Let MongoDB generate the ID
  @prop({ required: false }) // Changed to false to allow MongoDB to generate it
  override _id!: string;

  @prop({ required: true })
  @Reference({ collection: "worlds" })
  override worldId!: string;

  // Add Typegoose decorators to inherited properties
  @prop({ required: true })
  override name!: string;

  // Make description explicitly required with a default value
  @prop()
  override description!: string;

  @prop({ type: () => Object, required: false })
  override position?: Position;

  @prop({ type: () => Object })
  override areaMap?: AreaMap;

  @prop()
  @Reference({ collection: "areas", required: false })
  override parentId?: string | null;

  @prop({ type: () => [String], default: [] })
  override landmarks!: string[];

  @prop({ type: () => [String], default: [] })
  override connections!: string[];

  @prop({ type: () => [String], default: [] })
  override tags!: string[];

  // Add database-specific properties
  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  constructor(data?: unknown) {
    super(data || {});
  }
}
