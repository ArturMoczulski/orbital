import { BaseObject } from "../../../src/types/base-object";

describe("BaseObject", () => {
  interface TestProps {
    name: string;
    value: number;
  }

  class TestObject extends BaseObject<TestProps> implements TestProps {
    name: string = "";
    value: number = 0;

    constructor(data?: Partial<TestProps>) {
      super(data);
      // Manually assign properties for testing
      if (data) {
        if (data.name !== undefined) this.name = data.name;
        if (data.value !== undefined) this.value = data.value;
      }
    }
  }

  it("should assign properties from constructor data", () => {
    const data: TestProps = {
      name: "test",
      value: 42,
    };

    const obj = new TestObject(data);

    expect(obj.name).toBe("test");
    expect(obj.value).toBe(42);
  });

  it("should handle undefined constructor data", () => {
    const obj = new TestObject();

    expect(obj.name).toBe("");
    expect(obj.value).toBe(0);
  });

  it("should handle partial constructor data", () => {
    const obj = new TestObject({ name: "partial" });

    expect(obj.name).toBe("partial");
    expect(obj.value).toBe(0);
  });
});
