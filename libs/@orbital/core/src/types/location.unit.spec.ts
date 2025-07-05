import { Area } from "./area";
import { Location } from "./location";
import { Position } from "./position";

describe("Location", () => {
  describe("constructor", () => {
    it("should assign provided area, position, name, and description", () => {
      const area = Area.mock({ name: "Area1", parentId: "p1" });
      const position = Position.mock({ x: 5, y: 6, z: 7 });
      const data = { area, position, name: "TestLoc", description: "A place" };
      const loc = new Location(data);
      expect(loc.area).toBeInstanceOf(Area);
      expect(loc.area.name).toBe("Area1");
      expect(loc.position).toBeInstanceOf(Position);
      expect(loc.position.x).toBe(5);
      expect(loc.name).toBe("TestLoc");
      expect(loc.description).toBe("A place");
    });

    it("should throw if data is invalid", () => {
      // Missing required fields or wrong types
      expect(() => new Location({} as any)).toThrow();
      expect(() => new Location({ area: {} } as any)).toThrow();
    });
  });

  describe("mock", () => {
    it("should return a Location instance with randomized data", () => {
      const mockLoc = Location.mock();
      expect(mockLoc).toBeInstanceOf(Location);
      expect(mockLoc.area).toBeInstanceOf(Area);
      expect(mockLoc.position).toBeInstanceOf(Position);
      expect(typeof mockLoc.name).toBe("string");
      expect(typeof mockLoc.description).toBe("string");
    });

    it("should override mock data when provided", () => {
      const overrideArea = Area.mock({ name: "OverrideArea" });
      const overridePos = Position.mock({ x: 9, y: 8, z: 7 });
      const mockLoc = Location.mock({
        area: overrideArea,
        position: overridePos,
        name: "OVName",
        description: "OVDesc",
      });
      expect(mockLoc.area.name).toBe("OverrideArea");
      expect(mockLoc.position.x).toBe(9);
      expect(mockLoc.name).toBe("OVName");
      expect(mockLoc.description).toBe("OVDesc");
    });
  });
});
