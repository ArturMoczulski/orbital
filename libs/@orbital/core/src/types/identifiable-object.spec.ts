import { IdentifiableObject } from "./identifiable-object";

describe("IdentifiableObject", () => {
  describe("constructor", () => {
    it("should use provided id", () => {
      const obj = new IdentifiableObject({ id: "custom-id" });
      expect(obj.id).toBe("custom-id");
    });

    it("should generate a random id when none provided", () => {
      const obj1 = new IdentifiableObject();
      const obj2 = new IdentifiableObject();
      expect(typeof obj1.id).toBe("string");
      expect(obj1.id).not.toBe(obj2.id);
    });
  });

  describe("mock", () => {
    it("should return a IdentifiableObject with an id string", () => {
      const mockObj = IdentifiableObject.mock({ id: "override-id" });
      expect(mockObj).toBeInstanceOf(IdentifiableObject);
      expect(mockObj.id).toBe("override-id");
    });

    it("should generate id when override id not provided", () => {
      const mockObj = IdentifiableObject.mock();
      expect(typeof mockObj.id).toBe("string");
      expect(mockObj.id).toMatch(/^[0-9a-fA-F-]{36}$/);
    });
  });
});
