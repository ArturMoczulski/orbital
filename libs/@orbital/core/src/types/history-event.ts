import { z } from "zod";
import { faker } from "@faker-js/faker";
import { Position, PositionSchema } from "./position";
import { IdentifiableObject } from "./identifiable-object";
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
export class HistoryEvent
  extends BaseObject<HistoryEvent>
  implements HistoryEventProps
{
  eventId!: string;
  participants!: string[];
  outcome?: string;
  timestamp: Date = new Date();
  locationId?: string;
  coordinates: Position = { x: 0, y: 0, z: 0 };

  /** Generate a fake HistoryEvent with random data */
  static mock(overrides: Partial<HistoryEventProps> = {}): HistoryEvent {
    const base: Partial<HistoryEventProps> = {
      eventId: faker.string.uuid(),
      participants: [faker.string.uuid()],
      outcome: faker.lorem.sentence(),
      timestamp: faker.date.past(),
      locationId: faker.string.uuid(),
      coordinates: Position.mock(),
    };
    return new HistoryEvent({ ...base, ...overrides });
  }

  constructor(data: unknown) {
    const validated = HistoryEventSchema.parse(data);

    // Ensure coordinates is properly instantiated as a Position class
    const coordinatesData = validated.coordinates;
    const coordinates =
      coordinatesData instanceof Position
        ? coordinatesData
        : new Position(coordinatesData);

    // Create a clean object with properly instantiated properties
    const cleanData: Partial<HistoryEventProps> = {
      eventId: validated.eventId,
      participants: validated.participants,
      outcome: validated.outcome,
      timestamp: validated.timestamp,
      locationId: validated.locationId,
      coordinates: coordinates,
    };

    super(cleanData);
  }
}
