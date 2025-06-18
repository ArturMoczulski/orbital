import { Position } from "./position";

describe("Position", () => {
  describe("constructor", () => {
    it("should initialize to zeros when no data provided", () => {
      const pos = new Position();
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
      expect(pos.z).toBe(0);
    });

    it("should assign provided data", () => {
      const data = { x: 1, y: 2, z: 3 };
      const pos = new Position(data);
      expect(pos.x).toBe(1);
      expect(pos.y).toBe(2);
      expect(pos.z).toBe(3);
    });
  });

  describe("mock", () => {
    it("should return a Position with numeric coordinates", () => {
      const mockPos = Position.mock();
      expect(mockPos).toBeInstanceOf(Position);
      expect(typeof mockPos.x).toBe("number");
      expect(typeof mockPos.y).toBe("number");
      expect(typeof mockPos.z).toBe("number");
    });

    it("should override properties via overrides", () => {
      const override = { x: 9, y: 8, z: 7 };
      const mockPos = Position.mock(override);
      expect(mockPos.x).toBe(9);
      expect(mockPos.y).toBe(8);
      expect(mockPos.z).toBe(7);
    });
  });
});
