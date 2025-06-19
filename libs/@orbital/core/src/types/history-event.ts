import { z } from "zod";
import { faker } from "@faker-js/faker";
import { Position, PositionSchema } from "./position";
import { IdentifiableObject } from "./identifiable-object";
import { BaseObject } from "./base-object";
import { ZodSchema } from "../decorators/zod-schema.decorator";

/**
 * Represents a historical event in the world.
 */
export type HistoryEventProps = z.infer<typeof HistoryEventSchema>;

/** Zod schema for HistoryEvent */
export const HistoryEventSchema = z
  .object({
    eventId: z.string().describe("Unique identifier for the event"),
    participants: z
      .array(z.string())
      .describe("IDs of participants involved in the event"),
    outcome: z.string().optional().describe("Optional outcome description"),
    timestamp: z.date().describe("Timestamp when the event occurred"),
    locationId: z
      .string()
      .optional()
      .describe("Optional reference to location identifier"),
    coordinates: PositionSchema.describe(
      "Coordinates where the event took place"
    ),
  })
  .describe("A historical event in the world");

/** Represents a historical event in the world as a class with auto-assign and validation */
@ZodSchema(HistoryEventSchema)
export class HistoryEvent
  extends BaseObject<HistoryEvent>
  implements HistoryEventProps
{
  eventId: string = "";
  participants: string[] = [];
  outcome?: string;
  timestamp: Date = new Date();
  locationId?: string;
  coordinates: Position = new Position();

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
    // Validate the data
    const validated = HistoryEventSchema.parse(data);

    // Pass empty data to the parent constructor
    super();

    // Ensure coordinates is properly instantiated as a Position class
    const coordinatesData = validated.coordinates;
    const coordinates =
      coordinatesData instanceof Position
        ? coordinatesData
        : new Position(coordinatesData);

    // Assign properties directly
    this.eventId = validated.eventId;
    this.participants = validated.participants;
    this.outcome = validated.outcome;
    this.timestamp = validated.timestamp;
    this.locationId = validated.locationId;
    this.coordinates = coordinates;
  }
}
