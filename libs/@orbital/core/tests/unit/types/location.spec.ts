import { Location } from "../../../src/types/location";
import { Area } from "../../../src/types/area";
import { Position } from "../../../src/types/position";

describe("Location", () => {
  describe("constructor", () => {
    it("should create a location with required values", () => {
      const area = Area.mock();
      const position = Position.mock();

      const location = new Location({
        area,
        position,
        name: "Test Location",
      });

      expect(location.area).toEqual(area);
      expect(location.position).toEqual(position);
      expect(location.name).toBe("Test Location");
      expect(location.description).toBeUndefined();
    });

    it("should create a location with all provided values", () => {
      const area = Area.mock();
      const position = Position.mock();

      const location = new Location({
        area,
        position,
        name: "Test Location",
        description: "A test location description",
      });

      expect(location.area).toEqual(area);
      expect(location.position).toEqual(position);
      expect(location.name).toBe("Test Location");
      expect(location.description).toBe("A test location description");
    });

    it("should validate input with Zod schema", () => {
      expect(() => {
        new Location({} as any);
      }).toThrow();
    });
  });

  describe("mock", () => {
    it("should create a mock location with random values", () => {
      const location = Location.mock();

      expect(location).toBeInstanceOf(Location);
      expect(location.area).toBeInstanceOf(Area);
      expect(location.position).toBeDefined();
      expect(typeof location.name).toBe("string");
      expect(location.name.length).toBeGreaterThan(0);
    });

    it("should create a mock location with overridden values", () => {
      const customArea = Area.mock({ name: "Custom Area" });
      const customPosition = Position.mock({ x: 42 });

      const location = Location.mock({
        area: customArea,
        position: customPosition,
        name: "Custom Location",
        description: "Custom description",
      });

      expect(location).toBeInstanceOf(Location);
      expect(location.area).toEqual(customArea);
      expect(location.area.name).toBe("Custom Area");
      expect(location.position).toEqual(customPosition);
      expect(location.position.x).toBe(42);
      expect(location.name).toBe("Custom Location");
      expect(location.description).toBe("Custom description");
    });
  });
});
