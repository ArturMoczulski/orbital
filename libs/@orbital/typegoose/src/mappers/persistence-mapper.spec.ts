import { IdentifiableObject } from "@orbital/core";
import { PersistenceMapper } from "./persistence-mapper";

// Create a test domain class that extends IdentifiableObject
class TestDomainObject extends IdentifiableObject {
  public name: string;
  public count: number;
  public nested?: NestedDomainObject;
  public items?: NestedDomainObject[];

  constructor(data: any = {}) {
    super(data);
    this.name = data.name || "";
    this.count = data.count || 0;

    if (data.nested) {
      this.nested = new NestedDomainObject(data.nested);
    }

    if (data.items && Array.isArray(data.items)) {
      this.items = data.items.map((item: any) => new NestedDomainObject(item));
    }
  }
}

// Create a nested domain class
class NestedDomainObject extends IdentifiableObject {
  public value: string;

  constructor(data: any = {}) {
    super(data);
    this.value = data.value || "";
  }
}

describe("PersistenceMapper", () => {
  describe("toPersistence", () => {
    it("should convert a domain object to a plain object", () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
      });

      // Act
      const result = PersistenceMapper.toPersistence(domainObject);

      // Assert
      expect(result).toEqual({
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
      });
    });

    it("should handle nested domain objects", () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        nested: {
          _id: "nested-id-456",
          value: "Nested Value",
        },
      });

      // Act
      const result = PersistenceMapper.toPersistence(domainObject);

      // Assert
      expect(result).toEqual({
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        nested: {
          _id: "nested-id-456",
          value: "Nested Value",
        },
      });
    });

    it("should handle arrays of domain objects", () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        items: [
          {
            _id: "item-id-1",
            value: "Item 1",
          },
          {
            _id: "item-id-2",
            value: "Item 2",
          },
        ],
      });

      // Act
      const result = PersistenceMapper.toPersistence(domainObject);

      // Assert
      expect(result).toEqual({
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        items: [
          {
            _id: "item-id-1",
            value: "Item 1",
          },
          {
            _id: "item-id-2",
            value: "Item 2",
          },
        ],
      });
    });

    it("should skip undefined properties", () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
        // count is undefined
      });

      // Act
      const result = PersistenceMapper.toPersistence(domainObject);

      // Assert
      expect(result).toEqual({
        _id: "test-id-123",
        name: "Test Object",
        count: 0, // Default value from constructor
      });
    });
  });

  describe("toDomain", () => {
    it("should convert a document to a domain object", () => {
      // Arrange
      let toObjectCalled = false;
      const document = {
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        toObject: () => {
          toObjectCalled = true;
          return {
            _id: "test-id-123",
            name: "Test Object",
            count: 42,
          };
        },
      } as unknown as Document & { toObject: () => any };

      // Act
      const result = PersistenceMapper.toDomain(TestDomainObject, document);

      // Assert
      expect(result).toBeInstanceOf(TestDomainObject);
      expect(result._id).toBe("test-id-123");
      expect(result.name).toBe("Test Object");
      expect(result.count).toBe(42);
      expect(toObjectCalled).toBe(true);
    });

    it("should handle documents without toObject method", () => {
      // Arrange
      const document = {
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
      } as unknown as Document;

      // Act
      const result = PersistenceMapper.toDomain(TestDomainObject, document);

      // Assert
      expect(result).toBeInstanceOf(TestDomainObject);
      expect(result._id).toBe("test-id-123");
      expect(result.name).toBe("Test Object");
      expect(result.count).toBe(42);
    });

    it("should handle nested objects", () => {
      // Arrange
      let toObjectCalled = false;
      const document = {
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        nested: {
          _id: "nested-id-456",
          value: "Nested Value",
        },
        toObject: () => {
          toObjectCalled = true;
          return {
            _id: "test-id-123",
            name: "Test Object",
            count: 42,
            nested: {
              _id: "nested-id-456",
              value: "Nested Value",
            },
          };
        },
      } as unknown as Document & { toObject: () => any };

      // Act
      const result = PersistenceMapper.toDomain(TestDomainObject, document);

      // Assert
      expect(result).toBeInstanceOf(TestDomainObject);
      expect(result.nested).toBeInstanceOf(NestedDomainObject);
      expect(result.nested?.value).toBe("Nested Value");
      expect(toObjectCalled).toBe(true);
    });

    it("should handle arrays of nested objects", () => {
      // Arrange
      let toObjectCalled = false;
      const document = {
        _id: "test-id-123",
        name: "Test Object",
        count: 42,
        items: [
          {
            _id: "item-id-1",
            value: "Item 1",
          },
          {
            _id: "item-id-2",
            value: "Item 2",
          },
        ],
        toObject: () => {
          toObjectCalled = true;
          return {
            _id: "test-id-123",
            name: "Test Object",
            count: 42,
            items: [
              {
                _id: "item-id-1",
                value: "Item 1",
              },
              {
                _id: "item-id-2",
                value: "Item 2",
              },
            ],
          };
        },
      } as unknown as Document & { toObject: () => any };

      // Act
      const result = PersistenceMapper.toDomain(TestDomainObject, document);

      // Assert
      expect(result).toBeInstanceOf(TestDomainObject);
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items?.length).toBe(2);
      expect(result.items?.[0]).toBeInstanceOf(NestedDomainObject);
      expect(result.items?.[0].value).toBe("Item 1");
      expect(result.items?.[1].value).toBe("Item 2");
      expect(toObjectCalled).toBe(true);
    });
  });
});
