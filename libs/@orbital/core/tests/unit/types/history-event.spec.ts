import { HistoryEvent } from "../../../src/types/history-event";
import { Position } from "../../../src/types/position";

describe("HistoryEvent", () => {
  describe("constructor", () => {
    it("should create a history event with required values", () => {
      const timestamp = new Date();
      const position = Position.mock();

      const event = new HistoryEvent({
        eventId: "event-1",
        participants: ["participant-1", "participant-2"],
        timestamp,
        coordinates: position,
      });

      expect(event.eventId).toBe("event-1");
      expect(event.participants).toEqual(["participant-1", "participant-2"]);
      expect(event.timestamp).toBeDefined();
      expect(event.coordinates).toBeDefined();
      expect(event.coordinates.x).toBeDefined();
      expect(event.coordinates.y).toBeDefined();
      expect(event.coordinates.z).toBeDefined();
      expect(event.outcome).toBeUndefined();
      expect(event.locationId).toBeUndefined();
    });

    it("should create a history event with all provided values", () => {
      const timestamp = new Date();
      const position = Position.mock();

      const event = new HistoryEvent({
        eventId: "event-1",
        participants: ["participant-1", "participant-2"],
        outcome: "Success",
        timestamp,
        locationId: "location-1",
        coordinates: position,
      });

      expect(event.eventId).toBe("event-1");
      expect(event.participants).toEqual(["participant-1", "participant-2"]);
      expect(event.outcome).toBe("Success");
      expect(event.timestamp).toBeDefined();
      expect(event.locationId).toBe("location-1");
      expect(event.coordinates).toBeDefined();
      expect(event.coordinates.x).toBeDefined();
      expect(event.coordinates.y).toBeDefined();
      expect(event.coordinates.z).toBeDefined();
    });

    it("should validate input with Zod schema", () => {
      expect(() => {
        new HistoryEvent({} as any);
      }).toThrow();
    });
  });

  describe("mock", () => {
    it("should create a mock history event with random values", () => {
      const event = HistoryEvent.mock();

      expect(event).toBeInstanceOf(HistoryEvent);
      expect(typeof event.eventId).toBe("string");
      expect(Array.isArray(event.participants)).toBe(true);
      expect(event.participants.length).toBeGreaterThan(0);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.coordinates).toBeDefined();
      expect(typeof event.coordinates.x).toBe("number");
      expect(typeof event.coordinates.y).toBe("number");
      expect(typeof event.coordinates.z).toBe("number");
    });

    it("should create a mock history event with overridden values", () => {
      const customPosition = Position.mock({ x: 42 });
      const customTimestamp = new Date(2023, 0, 1);

      const event = HistoryEvent.mock({
        eventId: "custom-event",
        participants: ["custom-participant"],
        outcome: "Custom outcome",
        timestamp: customTimestamp,
        locationId: "custom-location",
        coordinates: customPosition,
      });

      expect(event).toBeInstanceOf(HistoryEvent);
      expect(event.eventId).toBe("custom-event");
      expect(event.participants).toEqual(["custom-participant"]);
      expect(event.outcome).toBe("Custom outcome");
      expect(event.timestamp).toBeDefined();
      expect(event.locationId).toBe("custom-location");
      expect(event.coordinates).toBeDefined();
      expect(typeof event.coordinates.x).toBe("number");
      expect(typeof event.coordinates.y).toBe("number");
      expect(typeof event.coordinates.z).toBe("number");
    });
  });
});
