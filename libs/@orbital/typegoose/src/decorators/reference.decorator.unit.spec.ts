import "reflect-metadata";
import {
  getReferences,
  Reference,
  REFERENCE_METADATA_KEY,
} from "./reference.decorator";

describe("Reference Decorator", () => {
  it("should add metadata to the class", () => {
    // Arrange
    class TestClass {
      @Reference({ collection: "test-collection" })
      testProperty!: string;
    }

    // Act
    const metadata = Reflect.getMetadata(REFERENCE_METADATA_KEY, TestClass);

    // Assert
    expect(metadata).toBeDefined();
    expect(metadata).toBeInstanceOf(Array);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toMatchObject({
      propertyKey: "testProperty",
      collection: "test-collection",
      required: true,
      foreignField: "_id",
    });
  });

  it("should add multiple reference metadata to the class", () => {
    // Arrange
    class TestClass {
      @Reference({ collection: "test-collection-1" })
      testProperty1!: string;

      @Reference({ collection: "test-collection-2", required: false })
      testProperty2!: string;

      @Reference({ collection: "test-collection-3", foreignField: "customId" })
      testProperty3!: string;
    }

    // Act
    const metadata = Reflect.getMetadata(REFERENCE_METADATA_KEY, TestClass);

    // Assert
    expect(metadata).toBeDefined();
    expect(metadata).toBeInstanceOf(Array);
    expect(metadata.length).toBe(3);

    expect(metadata[0]).toMatchObject({
      propertyKey: "testProperty1",
      collection: "test-collection-1",
      required: true,
      foreignField: "_id",
    });

    expect(metadata[1]).toMatchObject({
      propertyKey: "testProperty2",
      collection: "test-collection-2",
      required: false,
      foreignField: "_id",
    });

    expect(metadata[2]).toMatchObject({
      propertyKey: "testProperty3",
      collection: "test-collection-3",
      required: true,
      foreignField: "customId",
    });
  });

  it("should retrieve metadata using getReferences function", () => {
    // Arrange
    class TestClass {
      @Reference({ collection: "test-collection" })
      testProperty!: string;
    }

    // Act
    const references = getReferences(TestClass);

    // Assert
    expect(references).toBeDefined();
    expect(references).toBeInstanceOf(Array);
    expect(references.length).toBe(1);
    expect(references[0]).toMatchObject({
      propertyKey: "testProperty",
      collection: "test-collection",
      required: true,
      foreignField: "_id",
    });
  });

  it("should return empty array when no references are defined", () => {
    // Arrange
    class TestClass {
      testProperty!: string;
    }

    // Act
    const references = getReferences(TestClass);

    // Assert
    expect(references).toBeDefined();
    expect(references).toBeInstanceOf(Array);
    expect(references.length).toBe(0);
  });

  it("should use default values for optional parameters", () => {
    // Arrange
    class TestClass {
      @Reference({ collection: "test-collection" })
      testProperty!: string;
    }

    // Act
    const references = getReferences(TestClass);

    // Assert
    expect(references[0].required).toBe(true);
    expect(references[0].foreignField).toBe("_id");
  });

  it("should respect provided values for optional parameters", () => {
    // Arrange
    class TestClass {
      @Reference({
        collection: "test-collection",
        required: false,
        foreignField: "customId",
      })
      testProperty!: string;
    }

    // Act
    const references = getReferences(TestClass);

    // Assert
    expect(references[0].required).toBe(false);
    expect(references[0].foreignField).toBe("customId");
  });

  // Note: We can't easily test the Symbol case in TypeScript as it would be a compile-time error
  // But we can test that the decorator function throws an error if we try to use it with a symbol
  it("should throw an error when used with a symbol property", () => {
    // Arrange
    const decorator = Reference({ collection: "test-collection" });
    const target = {};
    const propertyKey = Symbol("test");

    // Act & Assert
    expect(() => {
      decorator(target, propertyKey);
    }).toThrow("@Reference can only be applied to string properties");
  });
});
