import { z } from "zod";
import { Position, PositionSchema } from "./position";
import { BaseObject } from "./base-object";

/**
 * Represents a historical event in the world.
 */
export interface HistoryEventProps {
  /** Unique identifier for the event */
  eventId: string;

  /** IDs of participants involved in the event */
  participants: string[];

  /** Optional outcome description */
  outcome?: string;

  /** Timestamp when the event occurred */
  timestamp: Date;

  /** Optional reference to location identifier */
  locationId?: string;

  /** Coordinates where the event took place */
  coordinates: Position;
}

/** Zod schema for HistoryEvent */
export const HistoryEventSchema = z.object({
  eventId: z.string(),
  participants: z.array(z.string()),
  outcome: z.string().optional(),
  timestamp: z.date(),
  locationId: z.string().optional(),
  coordinates: PositionSchema,
});

/** Represents a historical event in the world as a class with auto-assign and validation */
export class HistoryEventProps
  extends BaseObject<HistoryEventProps>
  implements HistoryEventProps
{
  eventId: string = "";
  participants: string[] = [];
  outcome?: string;
  timestamp: Date = new Date();
  locationId?: string;
  coordinates: Position = new Position({});

  constructor(data: unknown) {
    const validated = HistoryEventSchema.parse(data);
    super(validated as Partial<HistoryEventProps>);
  }
}
