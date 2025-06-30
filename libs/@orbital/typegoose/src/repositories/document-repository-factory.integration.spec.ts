import { BulkItemizedResponse } from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { z } from "zod";
import { WithDocument } from "../types/with-document";
import { DocumentRepositoryFactory } from "./document-repository-factory";

// Define a test domain class
class TestEntity extends IdentifiableObject {
  name: string;
  description?: string;
  tags: string[];

  constructor(data: any) {
    super(data);
    this.name = data.name || "";
    this.description = data.description;
    this.tags = data.tags || [];
  }

  toPlainObject(): Record<string, any> {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      tags: this.tags,
    };
  }

  validateSchema(): this {
    return this;
  }

  validate(): this {
    return this;
  }
}

// Define a test schema for MongoDB
const TestEntitySchema = new Schema({
  _id: { type: String, required: false }, // Make _id optional to allow MongoDB to generate it
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

describe("DocumentRepositoryFactory Integration Tests", () => {
  let TestEntityModel: any; // Using any to bypass mongoose type issues

  beforeAll(async () => {
    // Create the model
    TestEntityModel = mongoose.model("TestEntityFactory", TestEntitySchema);
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await TestEntityModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up model to prevent OverwriteModelError in subsequent test runs
    if (
      mongoose.connection &&
      mongoose.connection.models &&
      mongoose.connection.models["TestEntityFactory"]
    ) {
      delete mongoose.connection.models["TestEntityFactory"];
    }
  });

  describe("create", () => {
    it("should create a repository that can interact with MongoDB", async () => {
      // Arrange
      const repository = DocumentRepositoryFactory.create<TestEntity>(
        TestEntityModel,
        TestEntity
      );

      const testData = new TestEntity({
        _id: "factory-test-entity-id", // Explicitly set an ID for the test
        name: "Factory Test Entity",
        description: "Created via factory",
        tags: ["factory", "test"],
      });

      // Act
      const result = (await repository.create(
        testData
      )) as WithDocument<TestEntity>;

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe(testData.name);
      expect(result.description).toBe(testData.description);
      expect(result.tags).toEqual(testData.tags);
      expect(result.document).toBeDefined();

      // Verify it was saved to the database
      const savedDoc = await TestEntityModel.findById(result._id).lean();
      expect(savedDoc).toBeDefined();
      expect(savedDoc.name).toBe(testData.name);
    });

    it("should create a repository with schema validation", async () => {
      // Arrange
      const testSchema = z.object({
        _id: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()),
      });

      const repository = DocumentRepositoryFactory.create<TestEntity>(
        TestEntityModel,
        TestEntity,
        testSchema
      );

      const validData = new TestEntity({
        _id: "valid-factory-entity-id", // Explicitly set an ID for the test
        name: "Valid Entity",
        tags: ["valid", "schema"],
      });

      const invalidData = new TestEntity({
        _id: "invalid-factory-entity-id", // Explicitly set an ID for the test
        // Missing required name field (will be set to empty string in constructor)
        name: "",
        tags: ["invalid", "schema"],
      });

      // Act & Assert - Valid data should work
      const result = await repository.create(validData);
      expect(result).toBeDefined();
      expect((result as WithDocument<TestEntity>).name).toBe(validData.name);

      // Act & Assert - Invalid data should throw validation error
      await expect(repository.create(invalidData)).rejects.toThrow(
        "Validation error"
      );
    });

    it("should create a repository that can perform bulk operations", async () => {
      // Arrange
      const repository = DocumentRepositoryFactory.create<TestEntity>(
        TestEntityModel,
        TestEntity
      );

      const testEntities = [
        new TestEntity({
          _id: "factory-entity-1-id", // Explicitly set an ID for the test
          name: "Factory Entity 1",
          tags: ["factory", "bulk"],
        }),
        new TestEntity({
          _id: "factory-entity-2-id", // Explicitly set an ID for the test
          name: "Factory Entity 2",
          description: "Bulk created via factory",
          tags: ["factory", "bulk"],
        }),
      ];

      // Act
      const result = (await repository.create(
        testEntities
      )) as BulkItemizedResponse<Partial<TestEntity>, WithDocument<TestEntity>>;

      // Assert
      expect(result.counts!.success).toBe(2);
      expect(result.counts!.fail).toBe(0);
      expect(result.items.success.length).toBe(2);

      // Check each result
      const entities = result.items.success.map(
        (r) => r.data as WithDocument<TestEntity>
      );
      expect(entities[0]?.name).toBe(testEntities[0].name);
      expect(entities[1]?.name).toBe(testEntities[1].name);

      // Verify they were saved to the database
      const count = await TestEntityModel.countDocuments();
      expect(count).toBe(2);
    });
  });

  // Note: The DocumentRepositoryFactory doesn't currently have a createWithOptions method
  // This test would be implemented when that functionality is added
  // describe("createWithOptions", () => {
  //   it("should create a repository with custom options", async () => {
  //     // Test implementation would go here
  //   });
  // });
});
