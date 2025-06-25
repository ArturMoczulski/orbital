import { IdentifiableObject } from "./identifiable-object";

describe("IdentifiableObject", () => {
  describe("constructor", () => {
    it("should use provided _id", () => {
      const obj = new IdentifiableObject({ _id: "custom-id" });
      expect(obj._id).toBe("custom-id");
    });

    it("should generate a random _id when none provided", () => {
      const obj1 = new IdentifiableObject();
      const obj2 = new IdentifiableObject();
      expect(typeof obj1._id).toBe("string");
      expect(obj1._id).not.toBe(obj2._id);
    });
  });

  describe("mock", () => {
    it("should return a IdentifiableObject with an _id string", () => {
      const mockObj = IdentifiableObject.mock({ _id: "override-id" });
      expect(mockObj).toBeInstanceOf(IdentifiableObject);
      expect(mockObj._id).toBe("override-id");
    });

    it("should generate _id when override _id not provided", () => {
      const mockObj = IdentifiableObject.mock();
      expect(typeof mockObj._id).toBe("string");
      expect(mockObj._id).toMatch(/^[0-9a-fA-F-]{36}$/);
    });
  });
});
