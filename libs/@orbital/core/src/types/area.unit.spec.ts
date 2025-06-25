import { Area } from "./area";
import { Position } from "./position";

describe("Area", () => {
  describe("constructor", () => {
    it("should assign name, parentId, and position and generate an id", () => {
      const data = {
        name: "Test Area",
        parentId: "parent-1",
        position: { x: 10, y: 20, z: 30 },
      };
      const area = new Area(data);
      expect(area.name).toBe("Test Area");
      expect(area.parentId).toBe("parent-1");
      expect(area.position).toBeInstanceOf(Position);
      expect(area.position.x).toBe(10);
      expect(area.position.y).toBe(20);
      expect(area.position.z).toBe(30);
      expect(typeof area._id).toBe("string");
      expect(area._id.length).toBeGreaterThan(0);
    });

    it("should throw if required fields are missing or invalid", () => {
      expect(() => new Area({} as any)).toThrow();
      expect(() => new Area({ name: 123, position: {} } as any)).toThrow();
    });
  });

  describe("mock", () => {
    it("should return a valid Area instance with random data", () => {
      const mockArea = Area.mock();
      expect(mockArea).toBeInstanceOf(Area);
      expect(typeof mockArea._id).toBe("string");
      expect(mockArea.name).toEqual(expect.any(String));
      expect(mockArea.parentId).toEqual(expect.any(String));
      expect(mockArea.position).toBeInstanceOf(Position);
    });

    it("should override mock data when provided", () => {
      const override = {
        name: "Override Area",
        parentId: "override-parent",
        position: new Position({ x: 1, y: 2, z: 3 }),
      };
      const mockArea = Area.mock(override);
      expect(mockArea.name).toBe("Override Area");
      expect(mockArea.parentId).toBe("override-parent");
      expect(mockArea.position.x).toBe(1);
      expect(mockArea.position.y).toBe(2);
      expect(mockArea.position.z).toBe(3);
    });
  });
});
