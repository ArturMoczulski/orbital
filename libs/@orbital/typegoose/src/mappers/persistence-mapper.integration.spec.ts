import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { PersistenceMapper } from "./persistence-mapper";

// Define a test domain class
class TestEntity extends IdentifiableObject {
  name: string;
  description?: string;
  tags: string[];
  nestedObject?: {
    key1: string;
    key2: number;
  };
  arrayOfObjects?: Array<{
    id: string;
    value: string;
    _id?: string; // Add _id property to match MongoDB's behavior
  }>;

  constructor(data: any) {
    super(data);
    this.name = data.name || "";
    this.description = data.description;
    this.tags = data.tags || [];
    this.nestedObject = data.nestedObject;
    this.arrayOfObjects = data.arrayOfObjects;
  }
}

// Define a test schema for MongoDB
const TestEntitySchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  nestedObject: {
    key1: { type: String },
    key2: { type: Number },
  },
  arrayOfObjects: [
    {
      id: { type: String },
      value: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

describe("PersistenceMapper Integration Tests", () => {
  let TestEntityModel: any; // Using any to bypass mongoose type issues

  beforeAll(async () => {
    // Create the model
    TestEntityModel = mongoose.model("TestEntityMapper", TestEntitySchema);
  });

  afterAll(async () => {
    // Clean up model to prevent OverwriteModelError in subsequent test runs
    if (
      mongoose.connection &&
      mongoose.connection.models &&
      mongoose.connection.models["TestEntityMapper"]
    ) {
      delete mongoose.connection.models["TestEntityMapper"];
    }
  });

  describe("toPersistence", () => {
    it("should convert a domain object to a persistence object", () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "test-id-123",
        name: "Test Entity",
        description: "Test Description",
        tags: ["test", "mapper"],
        nestedObject: {
          key1: "value1",
          key2: 42,
        },
        arrayOfObjects: [
          { id: "obj1", value: "value1" },
          { id: "obj2", value: "value2" },
        ],
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      });

      // Act
      const persistenceObject = PersistenceMapper.toPersistence(domainObject);

      // Assert
      expect(persistenceObject).toBeDefined();
      expect(persistenceObject._id).toBe("test-id-123");
      expect(persistenceObject.name).toBe("Test Entity");
      expect(persistenceObject.description).toBe("Test Description");
      expect(persistenceObject.tags).toEqual(["test", "mapper"]);
      expect(persistenceObject.nestedObject).toEqual({
        key1: "value1",
        key2: 42,
      });
      expect(persistenceObject.arrayOfObjects).toEqual([
        { id: "obj1", value: "value1" },
        { id: "obj2", value: "value2" },
      ]);
      expect(persistenceObject.createdAt).toEqual(new Date("2023-01-01"));
      expect(persistenceObject.updatedAt).toEqual(new Date("2023-01-02"));
    });
  });

  describe("toDomain", () => {
    it("should convert a document to a domain object", async () => {
      // Arrange
      const testData = {
        _id: "test-id-456",
        name: "Document Entity",
        description: "Document Description",
        tags: ["document", "mapper"],
        nestedObject: {
          key1: "docValue1",
          key2: 99,
        },
        arrayOfObjects: [
          { id: "docObj1", value: "docValue1" },
          { id: "docObj2", value: "docValue2" },
        ],
        createdAt: new Date("2023-02-01"),
        updatedAt: new Date("2023-02-02"),
      };

      // Create a real document in MongoDB
      const document = new TestEntityModel(testData);
      await document.save();

      // Act
      const domainObject = PersistenceMapper.toDomain(
        TestEntity,
        document as any
      );

      // Assert
      expect(domainObject).toBeDefined();
      expect(domainObject).toBeInstanceOf(TestEntity);
      expect(domainObject._id).toBe("test-id-456");
      expect(domainObject.name).toBe("Document Entity");
      expect(domainObject.description).toBe("Document Description");
      expect(domainObject.tags).toEqual(["document", "mapper"]);
      expect(domainObject.nestedObject).toEqual({
        key1: "docValue1",
        key2: 99,
      });
      // Check array structure but ignore the exact _id values
      expect(domainObject.arrayOfObjects).toHaveLength(2);
      expect(domainObject.arrayOfObjects?.[0].id).toBe("docObj1");
      expect(domainObject.arrayOfObjects?.[0].value).toBe("docValue1");
      expect(domainObject.arrayOfObjects?.[0]._id).toBeDefined();
      expect(domainObject.arrayOfObjects?.[1].id).toBe("docObj2");
      expect(domainObject.arrayOfObjects?.[1].value).toBe("docValue2");
      expect(domainObject.arrayOfObjects?.[1]._id).toBeDefined();

      // Clean up
      await TestEntityModel.deleteOne({ _id: "test-id-456" });
    });

    it("should convert a lean document to a domain object", async () => {
      // Arrange
      const testData = {
        _id: "test-id-789",
        name: "Lean Document",
        description: "Lean Description",
        tags: ["lean", "mapper"],
        createdAt: new Date("2023-03-01"),
        updatedAt: new Date("2023-03-02"),
      };

      // Create a document and retrieve it as a lean object
      await TestEntityModel.create(testData);
      const leanDocument = await TestEntityModel.findById("test-id-789").lean();

      // Act
      const domainObject = PersistenceMapper.toDomain(
        TestEntity,
        leanDocument as any
      );

      // Assert
      expect(domainObject).toBeDefined();
      expect(domainObject).toBeInstanceOf(TestEntity);
      expect(domainObject._id).toBe("test-id-789");
      expect(domainObject.name).toBe("Lean Document");
      expect(domainObject.description).toBe("Lean Description");
      expect(domainObject.tags).toEqual(["lean", "mapper"]);

      // Clean up
      await TestEntityModel.deleteOne({ _id: "test-id-789" });
    });
  });

  describe("roundtrip conversion", () => {
    it("should maintain data integrity when converting domain to persistence and back", () => {
      // Arrange
      const originalDomain = new TestEntity({
        _id: "roundtrip-id",
        name: "Roundtrip Entity",
        description: "Testing roundtrip conversion",
        tags: ["roundtrip", "test"],
        nestedObject: {
          key1: "roundtrip1",
          key2: 123,
        },
        arrayOfObjects: [
          { id: "rt1", value: "rtValue1" },
          { id: "rt2", value: "rtValue2" },
        ],
      });

      // Act
      const persistenceObject = PersistenceMapper.toPersistence(originalDomain);
      const roundtripDomain = PersistenceMapper.toDomain(
        TestEntity,
        persistenceObject as any // Type assertion to bypass TypeScript error
      );

      // Assert
      expect(roundtripDomain).toBeInstanceOf(TestEntity);
      expect(roundtripDomain._id).toBe(originalDomain._id);
      expect(roundtripDomain.name).toBe(originalDomain.name);
      expect(roundtripDomain.description).toBe(originalDomain.description);
      expect(roundtripDomain.tags).toEqual(originalDomain.tags);
      expect(roundtripDomain.nestedObject).toEqual(originalDomain.nestedObject);
      expect(roundtripDomain.arrayOfObjects).toEqual(
        originalDomain.arrayOfObjects
      );
    });
  });
});
