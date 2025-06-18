import { z } from "zod";
import { ZodSchema, zodSchemaRegistry } from "./zod-schema.decorator";
import { BaseObject } from "../types/base-object";

describe("ZodSchema Decorator", () => {
  it("should register a schema in the registry", () => {
    // Arrange
    const testSchema = z.object({
      name: z.string(),
      value: z.number(),
    });

    // Act
    @ZodSchema(testSchema)
    class TestClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    // Assert
    const registeredSchema = zodSchemaRegistry.get(TestClass);
    expect(registeredSchema).toBe(testSchema);
  });

  it("should allow retrieving the schema via the zSchema static method", () => {
    // Arrange
    const testSchema = z.object({
      name: z.string(),
      value: z.number(),
    });

    @ZodSchema(testSchema)
    class TestClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    // Act
    const retrievedSchema = TestClass.zSchema();

    // Assert
    expect(retrievedSchema).toBe(testSchema);
  });

  it("should preserve schema descriptions", () => {
    // Arrange
    const testSchema = z
      .object({
        name: z.string().describe("The name of the test"),
        value: z.number().describe("The value of the test"),
      })
      .describe("A test schema with descriptions");

    @ZodSchema(testSchema)
    class TestClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    // Act
    const retrievedSchema = TestClass.zSchema();

    // Assert
    expect(retrievedSchema.description).toBe("A test schema with descriptions");
  });

  it("should throw an error when trying to get schema from a class without decorator", () => {
    // Arrange
    class TestClassWithoutDecorator extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    // Act & Assert
    expect(() => TestClassWithoutDecorator.zSchema()).toThrow(
      "No Zod schema registered for class TestClassWithoutDecorator"
    );
  });

  it("should work with inheritance", () => {
    // Arrange
    const parentSchema = z.object({
      parentProp: z.string(),
    });

    const childSchema = z.object({
      childProp: z.number(),
    });

    @ZodSchema(parentSchema)
    class ParentClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    @ZodSchema(childSchema)
    class ChildClass extends ParentClass {
      constructor() {
        super();
      }
    }

    // Act & Assert
    expect(ParentClass.zSchema()).toBe(parentSchema);
    expect(ChildClass.zSchema()).toBe(childSchema);
  });

  it("should inherit schema through multiple levels of inheritance", () => {
    // Arrange
    const grandparentSchema = z.object({
      grandparentProp: z.string(),
    });

    @ZodSchema(grandparentSchema)
    class GrandparentClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    class ParentClass extends GrandparentClass {
      constructor() {
        super();
      }
    }

    class ChildClass extends ParentClass {
      constructor() {
        super();
      }
    }

    // Act & Assert
    expect(GrandparentClass.zSchema()).toBe(grandparentSchema);
    expect(ParentClass.zSchema()).toBe(grandparentSchema);
    expect(ChildClass.zSchema()).toBe(grandparentSchema);
  });

  it("should override schema at any level in the inheritance chain", () => {
    // Arrange
    const grandparentSchema = z.object({
      grandparentProp: z.string(),
    });

    const parentSchema = z.object({
      parentProp: z.number(),
    });

    const childSchema = z.object({
      childProp: z.boolean(),
    });

    @ZodSchema(grandparentSchema)
    class GrandparentClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    class MiddleClass extends GrandparentClass {
      constructor() {
        super();
      }
    }

    @ZodSchema(parentSchema)
    class ParentClass extends MiddleClass {
      constructor() {
        super();
      }
    }

    @ZodSchema(childSchema)
    class ChildClass extends ParentClass {
      constructor() {
        super();
      }
    }

    class GrandchildClass extends ChildClass {
      constructor() {
        super();
      }
    }

    // Act & Assert
    expect(GrandparentClass.zSchema()).toBe(grandparentSchema);
    expect(MiddleClass.zSchema()).toBe(grandparentSchema);
    expect(ParentClass.zSchema()).toBe(parentSchema);
    expect(ChildClass.zSchema()).toBe(childSchema);
    expect(GrandchildClass.zSchema()).toBe(childSchema);
  });
});
