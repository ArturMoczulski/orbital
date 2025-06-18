import { Area } from "../../../src/types/area";
import { Position } from "../../../src/types/position";

describe("Area", () => {
  describe("constructor", () => {
    it("should create an area with default values", () => {
      const area = new Area({
        name: "Test Area",
        position: { x: 0, y: 0, z: 0 },
      });

      expect(area.id).toBeDefined();
      expect(area.name).toBe("Test Area");
      expect(area.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(area.parentId).toBeUndefined();
    });

    it("should create an area with all provided values", () => {
      const area = new Area({
        id: "custom-id",
        name: "Test Area",
        position: { x: 10, y: 20, z: 30 },
        parentId: "parent-id",
      });

      expect(area.id).toBe("custom-id");
      expect(area.name).toBe("Test Area");
      expect(area.position).toEqual({ x: 10, y: 20, z: 30 });
      expect(area.parentId).toBe("parent-id");
    });

    it("should validate input with Zod schema", () => {
      expect(() => {
        new Area({} as any);
      }).toThrow();
    });
  });

  describe("mock", () => {
    it("should create a mock area with random values", () => {
      const area = Area.mock();

      expect(area).toBeInstanceOf(Area);
      expect(area.id).toBeDefined();
      expect(typeof area.name).toBe("string");
      expect(area.position).toBeDefined();
      expect(typeof area.position.x).toBe("number");
      expect(typeof area.position.y).toBe("number");
      expect(typeof area.position.z).toBe("number");
    });

    it("should create a mock area with overridden values", () => {
      const mockPosition = Position.mock({ x: 42 });
      const area = Area.mock({
        name: "Custom Area",
        position: mockPosition,
      });

      expect(area).toBeInstanceOf(Area);
      expect(area.name).toBe("Custom Area");
      expect(area.position).toEqual(mockPosition);
      expect(area.position.x).toBe(42);
    });
  });
});
