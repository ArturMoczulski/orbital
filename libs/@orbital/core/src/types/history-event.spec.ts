import { HistoryEvent, HistoryEventSchema } from "./history-event";
import { Position } from "./position";

describe("HistoryEvent", () => {
  describe("constructor", () => {
    it("should assign all properties correctly from valid data", () => {
      const timestamp = new Date("2025-01-01T00:00:00Z");
      const data = {
        eventId: "evt-1",
        participants: ["p1", "p2"],
        outcome: "success",
        timestamp,
        locationId: "loc-1",
        coordinates: { x: 1, y: 2, z: 3 },
      };
      const evt = new HistoryEvent(data);
      expect(evt.eventId).toBe("evt-1");
      expect(evt.participants).toEqual(["p1", "p2"]);
      expect(evt.outcome).toBe("success");
      expect(evt.timestamp).toEqual(timestamp);
      expect(evt.locationId).toBe("loc-1");
      expect(evt.coordinates).toBeInstanceOf(Position);
      expect(evt.coordinates.x).toBe(1);
      expect(evt.coordinates.y).toBe(2);
      expect(evt.coordinates.z).toBe(3);
    });

    it("should throw if data does not match schema", () => {
      // missing required fields or wrong types
      expect(() => new HistoryEvent({} as any)).toThrow();
      expect(() => new HistoryEvent({ eventId: 1 } as any)).toThrow();
    });
  });

  describe("mock", () => {
    it("should return a HistoryEvent with valid defaults", () => {
      const mock = HistoryEvent.mock();
      expect(mock).toBeInstanceOf(HistoryEvent);
      expect(typeof mock.eventId).toBe("string");
      expect(Array.isArray(mock.participants)).toBe(true);
      expect(mock.timestamp).toBeInstanceOf(Date);
      expect(mock.coordinates).toBeInstanceOf(Position);
    });

    it("should override properties when provided", () => {
      const override = {
        eventId: "override-evt",
        participants: ["x"],
        outcome: "ov",
        timestamp: new Date("2020-01-01"),
        locationId: "loc-x",
        coordinates: { x: 9, y: 8, z: 7 },
      };
      const mock = HistoryEvent.mock(override);
      expect(mock.eventId).toBe("override-evt");
      expect(mock.participants).toEqual(["x"]);
      expect(mock.outcome).toBe("ov");
      expect(mock.timestamp).toEqual(new Date("2020-01-01"));
      expect(mock.locationId).toBe("loc-x");
      expect(mock.coordinates.x).toBe(9);
      expect(mock.coordinates.y).toBe(8);
      expect(mock.coordinates.z).toBe(7);
    });
  });
});
