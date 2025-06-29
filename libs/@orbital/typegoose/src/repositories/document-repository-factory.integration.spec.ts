import { BulkItemizedResponse } from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
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
}

// Define a test schema for MongoDB
const TestEntitySchema = new Schema({
  _id: { type: String, required: true },
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

      const testData = {
        name: "Factory Test Entity",
        description: "Created via factory",
        tags: ["factory", "test"],
      };

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

    it("should create a repository that can perform bulk operations", async () => {
      // Arrange
      const repository = DocumentRepositoryFactory.create<TestEntity>(
        TestEntityModel,
        TestEntity
      );

      const testEntities = [
        {
          name: "Factory Entity 1",
          tags: ["factory", "bulk"],
        },
        {
          name: "Factory Entity 2",
          description: "Bulk created via factory",
          tags: ["factory", "bulk"],
        },
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
