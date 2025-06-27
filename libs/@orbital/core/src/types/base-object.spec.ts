import { BaseObject } from "./base-object";

class TestObject extends BaseObject<any> {
  public name: string;
  public age: number;
  public nested?: NestedObject;

  constructor(data?: any) {
    super(data);
    this.name = data?.name || "";
    this.age = data?.age || 0;
    this.nested = data?.nested;
  }

  public getFullName(): string {
    return `${this.name} Test`;
  }
}

class NestedObject extends BaseObject<any> {
  public value: string;

  constructor(data?: any) {
    super(data);
    this.value = data?.value || "";
  }

  public getValue(): string {
    return this.value;
  }
}

describe("BaseObject", () => {
  describe("toPlainObject", () => {
    it("should convert a simple object to a plain object", () => {
      const testObj = new TestObject({ name: "John", age: 30 });
      const plainObj = testObj.toPlainObject();

      // Check that properties are copied
      expect(plainObj.name).toBe("John");
      expect(plainObj.age).toBe(30);

      // Check that methods are not included
      expect(typeof plainObj.getFullName).toBe("undefined");
    });

    it("should recursively convert nested objects", () => {
      const nested = new NestedObject({ value: "test value" });
      const testObj = new TestObject({ name: "John", age: 30, nested });
      const plainObj = testObj.toPlainObject();

      // Check that nested object is also converted
      expect(plainObj.nested).toBeInstanceOf(Object);
      expect(plainObj.nested.value).toBe("test value");

      // Check that nested methods are not included
      expect(typeof plainObj.nested.getValue).toBe("undefined");
    });

    it("should handle null and undefined properties", () => {
      const testObj = new TestObject({ name: "John", age: null });
      const plainObj = testObj.toPlainObject();

      expect(plainObj.name).toBe("John");
      expect(plainObj.age).toBeNull();
      expect(plainObj.nested).toBeUndefined();
    });

    it("should handle arrays of objects", () => {
      const nested1 = new NestedObject({ value: "value1" });
      const nested2 = new NestedObject({ value: "value2" });

      const testObj = new TestObject({
        name: "John",
        age: 30,
        items: [nested1, nested2, { simple: "object" }],
      });

      const plainObj = testObj.toPlainObject();

      expect(Array.isArray(plainObj.items)).toBe(true);
      expect(plainObj.items.length).toBe(3);
      expect(plainObj.items[0].value).toBe("value1");
      expect(plainObj.items[1].value).toBe("value2");
      expect(plainObj.items[2].simple).toBe("object");
    });
  });
});
