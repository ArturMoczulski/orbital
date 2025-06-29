import { z } from "zod";
import { ZodSchema } from "../decorators/zod-schema.decorator";
import { Area, AreaSchema } from "./area";
import { BaseObject } from "./base-object";
import { Position, PositionSchema } from "./position";

describe("BaseObject.zSchema", () => {
  it("should return the registered Zod schema for Position", () => {
    // Act
    const schema = Position.zSchema();

    // Assert
    expect(schema).toBe(PositionSchema);
  });

  it("should return the registered Zod schema for Area", () => {
    // Act
    const schema = Area.zSchema();

    // Assert
    expect(schema).toBe(AreaSchema);
  });

  it("should throw an error for a class without a registered schema", () => {
    // Arrange
    class TestClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    // Act & Assert
    expect(() => TestClass.zSchema()).toThrow(
      "No Zod schema registered for class TestClass or any of its parent classes"
    );
  });

  it("should inherit schema from parent class if not defined on child class", () => {
    // Arrange
    const parentSchema = z.object({
      parentProp: z.string(),
    });

    @ZodSchema(parentSchema)
    class ParentClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }

    class ChildClass extends ParentClass {}

    // Act
    const schema = ChildClass.zSchema();

    // Assert
    expect(schema).toBe(parentSchema);
  });

  it("should use child schema over parent schema when both are defined", () => {
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
    class ChildClass extends ParentClass {}

    // Act
    const parentResult = ParentClass.zSchema();
    const childResult = ChildClass.zSchema();

    // Assert
    expect(parentResult).toBe(parentSchema);
    expect(childResult).toBe(childSchema);
  });
});

describe("BaseObject constructor", () => {
  it("should not automatically validate the instance during construction", () => {
    // Arrange
    const validateSchemaSpy = jest.spyOn(
      BaseObject.prototype,
      "validateSchema"
    );

    // Act
    new Position({ x: 10, y: 20, z: 30 });

    // Assert
    expect(validateSchemaSpy).not.toHaveBeenCalled();

    // Cleanup
    validateSchemaSpy.mockRestore();
  });

  it("should not throw when construction data is invalid", () => {
    // Arrange & Act & Assert
    expect(() => {
      new Position({ x: "not a number" as any, y: 20, z: 30 });
    }).not.toThrow();
  });

  it("should assign data to properties", () => {
    // Arrange & Act
    const position = new Position({ x: 10, y: 20, z: 30 });

    // Assert
    expect(position.x).toBe(10);
    expect(position.y).toBe(20);
    expect(position.z).toBe(30);
  });
});

describe("BaseObject.validateSchema", () => {
  it("should validate a valid instance without throwing", () => {
    // Arrange
    const position = new Position({ x: 10, y: 20, z: 30 });

    // Act & Assert
    expect(() => position.validateSchema()).not.toThrow();
  });

  it("should return the instance when validation succeeds", () => {
    // Arrange
    const position = new Position({ x: 10, y: 20, z: 30 });

    // Act
    const result = position.validateSchema();

    // Assert
    expect(result).toBe(position);
  });

  it("should throw a ZodError when validation fails", () => {
    // Arrange
    const position = new Position({ x: 10, y: 20, z: 30 });

    // Corrupt the instance
    (position as any).x = "not a number";

    // Act & Assert
    expect(() => position.validateSchema()).toThrow();
  });

  it("should use the class's zSchema method for validation", () => {
    // Arrange
    const mockSchema = {
      parse: jest.fn().mockReturnValue(true),
    };

    const originalZSchema = Position.zSchema;
    Position.zSchema = jest.fn().mockReturnValue(mockSchema);

    const position = new Position({ x: 10, y: 20, z: 30 });

    // Act
    position.validateSchema();

    // Assert
    expect(Position.zSchema).toHaveBeenCalled();
    expect(mockSchema.parse).toHaveBeenCalledWith(position);

    // Restore original
    Position.zSchema = originalZSchema;
  });

  it("should not throw for classes without a registered schema", () => {
    // Arrange
    class TestClass extends BaseObject<any> {
      constructor() {
        super();
      }
    }
    const instance = new TestClass();

    // Act & Assert
    expect(() => instance.validateSchema()).not.toThrow();
  });
});

describe("BaseObject.toJsonSchema", () => {
  it("should return a JSON Schema object for Position", () => {
    // Act
    const jsonSchema = Position.toJsonSchema();

    // Assert
    expect(jsonSchema).toEqual(
      expect.objectContaining({
        type: "object",
        description: expect.any(String),
        properties: expect.any(Object),
      })
    );
  });

  it("should include the description from the Zod schema", () => {
    // Act
    const jsonSchema = Position.toJsonSchema() as { description: string };

    // Assert
    expect(jsonSchema.description).toBe("3D position in cartesian space");
  });
});
