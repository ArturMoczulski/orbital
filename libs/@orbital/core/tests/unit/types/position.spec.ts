import { Position } from "../../../src/types/position";

describe("Position", () => {
  describe("constructor", () => {
    it("should create a position with default values", () => {
      const position = new Position();

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
      expect(position.z).toBe(0);
    });

    it("should create a position with provided values", () => {
      const position = new Position({ x: 10, y: 20, z: 30 });

      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
      expect(position.z).toBe(30);
    });

    it("should create a position with partial values", () => {
      const position = new Position({ x: 10 });

      expect(position.x).toBe(10);
      expect(position.y).toBe(0);
      expect(position.z).toBe(0);
    });
  });

  describe("mock", () => {
    it("should create a mock position with random values", () => {
      const position = Position.mock();

      expect(position).toBeInstanceOf(Position);
      expect(typeof position.x).toBe("number");
      expect(typeof position.y).toBe("number");
      expect(typeof position.z).toBe("number");
    });

    it("should create a mock position with overridden values", () => {
      const position = Position.mock({ x: 42 });

      expect(position).toBeInstanceOf(Position);
      expect(position.x).toBe(42);
      expect(typeof position.y).toBe("number");
      expect(typeof position.z).toBe("number");
    });
  });
});
