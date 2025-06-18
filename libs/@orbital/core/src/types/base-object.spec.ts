import { BaseObject } from "./base-object";

describe("BaseObject", () => {
  type TestData = { a: number; b: string };
  class TestObj extends BaseObject<TestData> {
    a!: number;
    b!: string;
  }

  describe("constructor", () => {
    it("should assign provided data to instance properties", () => {
      const data = { a: 123, b: "hello" };
      const obj = new TestObj(data);
      expect(obj.a).toBe(123);
      expect(obj.b).toBe("hello");
    });

    it("should leave default values undefined when no data provided", () => {
      const obj = new TestObj();
      expect(obj.a).toBeUndefined();
      expect(obj.b).toBeUndefined();
    });

    it("should include extra properties when using Object.assign", () => {
      const data = { a: 1, b: "x", c: true } as any;
      const obj = new TestObj(data);
      expect((obj as any).c).toBe(true);
      expect(obj.a).toBe(1);
      expect(obj.b).toBe("x");
    });
  });
});
