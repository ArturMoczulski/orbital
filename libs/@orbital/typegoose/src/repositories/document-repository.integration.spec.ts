import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import * as z from "zod";
import { WithDocument } from "../types/with-document";
import { DocumentRepository } from "./document-repository";

// Define a test domain class
class TestEntity extends IdentifiableObject {
  name: string;
  description?: string;
  tags: string[];
  parentId?: string;

  constructor(data: any) {
    super(data);
    this.name = data.name || "";
    this.description = data.description;
    this.tags = data.tags || [];
    this.parentId = data.parentId;
  }

  toPlainObject(): Record<string, any> {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      tags: this.tags,
      parentId: this.parentId,
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
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  parentId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Define a Zod schema for validation
const testZodSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parentId: z.string().optional(),
});

describe("DocumentRepository Integration Tests", () => {
  let repository: DocumentRepository<TestEntity>;
  let repositoryWithSchema: DocumentRepository<TestEntity>;
  let TestEntityModel: any; // Using any to bypass mongoose type issues

  beforeAll(async () => {
    // Create the model
    TestEntityModel = mongoose.model("TestEntity", TestEntitySchema);

    // Create the repository
    repository = new DocumentRepository<TestEntity>(
      TestEntityModel,
      TestEntity
    );

    // Create repository with schema
    repositoryWithSchema = new DocumentRepository<TestEntity>(
      TestEntityModel,
      TestEntity,
      testZodSchema
    );
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await TestEntityModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up model to prevent OverwriteModelError in subsequent test runs
    // mongoose.deleteModel doesn't exist in this version, use mongoose.connection.deleteModel instead
    if (
      mongoose.connection &&
      mongoose.connection.models &&
      mongoose.connection.models["TestEntity"]
    ) {
      delete mongoose.connection.models["TestEntity"];
    }
  });

  describe("create", () => {
    it("should create a single entity", async () => {
      // Arrange
      const testData = new TestEntity({
        name: "Test Entity",
        description: "Test Description",
        tags: ["test", "entity"],
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

    it("should create multiple entities", async () => {
      // Arrange
      const testData = [
        new TestEntity({
          name: "Entity 1",
          tags: ["test", "entity1"],
        }),
        new TestEntity({
          name: "Entity 2",
          description: "Description 2",
          tags: ["test", "entity2"],
        }),
      ];

      // Act
      const result = (await repository.create(
        testData
      )) as BulkItemizedResponse<Partial<TestEntity>, WithDocument<TestEntity>>;

      // Assert
      expect(result.counts!.success).toBe(2);
      expect(result.counts!.fail).toBe(0);
      expect(result.items.success.length).toBe(2);

      // Check each result
      const entities = result.items.success.map(
        (r) => r.data as WithDocument<TestEntity>
      );
      expect(entities[0]?.name).toBe(testData[0].name);
      expect(entities[1]?.name).toBe(testData[1].name);

      // Verify they were saved to the database
      const count = await TestEntityModel.countDocuments();
      expect(count).toBe(2);
    });

    it("should validate data against schema when creating an entity", async () => {
      // Arrange
      const validData = new TestEntity({
        name: "Valid Entity",
        tags: ["test", "valid"],
      });

      const invalidData = new TestEntity({
        // Missing required name field (will be set to empty string in constructor)
        name: "",
        tags: ["test", "invalid"],
      });

      // Act & Assert - Valid data should work
      const result = (await repositoryWithSchema.create(
        validData
      )) as WithDocument<TestEntity>;
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe(validData.name);

      // Act & Assert - Invalid data should throw validation error
      await expect(repositoryWithSchema.create(invalidData)).rejects.toThrow();
    });
  });

  describe("find", () => {
    it("should find all entities", async () => {
      // Arrange
      const testEntities = [
        new TestEntity({ name: "Entity 1", tags: ["test", "find"] }),
        new TestEntity({ name: "Entity 2", tags: ["test", "find"] }),
        new TestEntity({ name: "Entity 3", tags: ["test", "other"] }),
      ];

      // Create test entities directly in the database
      await TestEntityModel.create(testEntities);

      // Act
      const results = await repository.find();

      // Assert
      expect(results.length).toBe(3);
      expect(results[0].document).toBeDefined();
      expect(results.map((e) => e.name)).toContain("Entity 1");
      expect(results.map((e) => e.name)).toContain("Entity 2");
      expect(results.map((e) => e.name)).toContain("Entity 3");
    });

    it("should find entities with filter", async () => {
      // Arrange
      const testEntities = [
        new TestEntity({ name: "Entity 1", tags: ["test", "find"] }),
        new TestEntity({ name: "Entity 2", tags: ["test", "find"] }),
        new TestEntity({ name: "Entity 3", tags: ["test", "other"] }),
      ];

      await TestEntityModel.create(testEntities);

      // Act
      const results = await repository.find({ name: "Entity 1" });

      // Assert
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Entity 1");
    });

    it("should find entities with options", async () => {
      // Arrange
      const testEntities = [
        new TestEntity({ name: "A Entity", tags: ["test"] }),
        new TestEntity({ name: "B Entity", tags: ["test"] }),
        new TestEntity({ name: "C Entity", tags: ["test"] }),
      ];

      await TestEntityModel.create(testEntities);

      // Act
      const results = await repository.find(
        {}, // No filter
        {}, // No projection
        { sort: { name: 1 }, limit: 2 } // Sort by name ascending, limit to 2
      );

      // Assert
      expect(results.length).toBe(2);
      expect(results[0].name).toBe("A Entity");
      expect(results[1].name).toBe("B Entity");
    });
  });

  describe("findOne", () => {
    it("should find a single entity", async () => {
      // Arrange
      const testEntity = new TestEntity({
        name: "Find One Entity",
        description: "Test Description",
        tags: ["test", "findOne"],
      });

      await TestEntityModel.create(testEntity);

      // Act
      const result = await repository.findOne({ name: "Find One Entity" });

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe("Find One Entity");
      expect(result?.description).toBe("Test Description");
      expect(result?.document).toBeDefined();
    });

    it("should return null if entity is not found", async () => {
      // Act
      const result = await repository.findOne({ name: "Non-existent Entity" });

      // Assert
      expect(result).toBeNull();
    });

    it("should throw ZodError if schema doesn't have parentId field", async () => {
      // Arrange
      const schemaWithoutParentId = z.object({
        _id: z.string().optional(),
        name: z.string().min(1),
        // No parentId field
      });

      const repoWithInvalidSchema = new DocumentRepository<TestEntity>(
        TestEntityModel,
        TestEntity,
        schemaWithoutParentId
      );

      // Act & Assert
      await expect(
        repoWithInvalidSchema.findByParentId("parent-123")
      ).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("should find an entity by ID", async () => {
      // Arrange
      const testEntity = new TestEntity({
        name: "Find By ID Entity",
        tags: ["test", "findById"],
      });

      const created = await TestEntityModel.create(testEntity);

      // Act
      const result = await repository.findById(created._id);

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe(created._id);
      expect(result?.name).toBe("Find By ID Entity");
    });

    it("should return null if entity with ID is not found", async () => {
      // Act
      const result = await repository.findById("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should throw error if schema doesn't have tags field", async () => {
      // Arrange
      const schemaWithoutTags = z.object({
        _id: z.string().optional(),
        name: z.string().min(1),
        // No tags field
      });

      const repoWithInvalidSchema = new DocumentRepository<TestEntity>(
        TestEntityModel,
        TestEntity,
        schemaWithoutTags
      );

      // Act & Assert
      await expect(
        repoWithInvalidSchema.findByTags(["tag1", "tag2"])
      ).rejects.toThrow();
    });
  });

  describe("findByParentId", () => {
    it("should find entities by parent ID", async () => {
      // Arrange
      const parentId = "parent-123";
      const testEntities = [
        new TestEntity({ name: "Child 1", parentId }),
        new TestEntity({ name: "Child 2", parentId }),
        new TestEntity({ name: "Other Entity", parentId: "other-parent" }),
      ];

      await TestEntityModel.create(testEntities);

      // Act
      const results = await repository.findByParentId(parentId);

      // Assert
      expect(results.length).toBe(2);
      expect(results.map((e) => e.name)).toContain("Child 1");
      expect(results.map((e) => e.name)).toContain("Child 2");
    });
  });

  describe("findByTags", () => {
    it("should find entities by tags", async () => {
      // Arrange
      const testEntities = [
        new TestEntity({ name: "Entity 1", tags: ["tag1", "common"] }),
        new TestEntity({ name: "Entity 2", tags: ["tag2", "common"] }),
        new TestEntity({ name: "Entity 3", tags: ["tag3"] }),
      ];

      await TestEntityModel.create(testEntities);

      // Act
      const results = await repository.findByTags(["tag1", "tag2"]);

      // Assert
      expect(results.length).toBe(2);
      expect(results.map((e) => e.name)).toContain("Entity 1");
      expect(results.map((e) => e.name)).toContain("Entity 2");
    });
  });

  describe("update", () => {
    it("should update a single entity", async () => {
      // Arrange
      const testEntity = new TestEntity({
        name: "Original Name",
        description: "Original Description",
        tags: ["original"],
      });

      const created = await TestEntityModel.create(testEntity);
      const entityToUpdate = new TestEntity({
        _id: created._id,
        name: "Updated Name",
        description: "Updated Description",
        tags: ["updated"],
      });

      // Act
      const result = (await repository.update(
        entityToUpdate
      )) as WithDocument<TestEntity>;

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe(created._id);
      expect(result?.name).toBe("Updated Name");
      expect(result?.description).toBe("Updated Description");
      expect(result?.tags).toEqual(["updated"]);

      // Verify it was updated in the database
      const updatedDoc = await TestEntityModel.findById(created._id).lean();
      expect(updatedDoc.name).toBe("Updated Name");
    });

    it("should update multiple entities", async () => {
      // Arrange
      const testEntities = [
        new TestEntity({ name: "Entity 1", tags: ["original"] }),
        new TestEntity({ name: "Entity 2", tags: ["original"] }),
      ];

      const created = await TestEntityModel.create(testEntities);

      const entitiesToUpdate = [
        new TestEntity({
          _id: created[0]._id,
          name: "Updated Entity 1",
          tags: ["updated"],
        }),
        new TestEntity({
          _id: created[1]._id,
          name: "Updated Entity 2",
          tags: ["updated"],
        }),
      ];

      // Act
      const result = (await repository.update(
        entitiesToUpdate
      )) as BulkItemizedResponse<TestEntity, WithDocument<TestEntity>>;

      // Assert
      expect(result.counts!.success).toBe(2);
      expect(result.counts!.fail).toBe(0);

      // Verify they were updated in the database
      const updatedDocs = await TestEntityModel.find().lean();
      expect(updatedDocs.length).toBe(2);
      expect(updatedDocs.map((d: any) => d.name)).toContain("Updated Entity 1");
      expect(updatedDocs.map((d: any) => d.name)).toContain("Updated Entity 2");
    });

    it("should return null if entity to update is not found", async () => {
      // Arrange
      const nonExistentEntity = new TestEntity({
        _id: "non-existent-id",
        name: "Non-existent Entity",
      });

      // Act
      const result = await repository.update(nonExistentEntity);

      // Assert
      expect(result).toBeNull();
    });

    it("should validate data against schema when updating an entity", async () => {
      // Arrange
      const testEntity = new TestEntity({
        name: "Original Valid Name",
        tags: ["test", "valid"],
      });

      const created = await TestEntityModel.create(testEntity);

      // Valid update
      const validUpdate = new TestEntity({
        _id: created._id,
        name: "Updated Valid Name",
        tags: ["updated", "valid"],
      });

      // Invalid update (empty name)
      const invalidUpdate = new TestEntity({
        _id: created._id,
        name: "", // Empty name, which violates the min(1) constraint
        tags: ["updated", "invalid"],
      });

      // Act & Assert - Valid update should work
      const result = (await repositoryWithSchema.update(
        validUpdate
      )) as WithDocument<TestEntity>;
      expect(result).toBeDefined();
      expect(result._id).toBe(created._id);
      expect(result.name).toBe("Updated Valid Name");

      // Act & Assert - Invalid update should throw validation error
      await expect(
        repositoryWithSchema.update(invalidUpdate)
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a single entity by ID", async () => {
      // Arrange
      const testEntity = new TestEntity({
        name: "Entity to Delete",
        tags: ["delete"],
      });

      const created = await TestEntityModel.create(testEntity);

      // Act
      const result = await repository.delete(created._id);

      // Assert
      expect(result).toBe(true);

      // Verify it was deleted from the database
      const deletedDoc = await TestEntityModel.findById(created._id);
      expect(deletedDoc).toBeNull();
    });

    it("should delete multiple entities by ID", async () => {
      // Arrange
      const testEntities = [
        new TestEntity({ name: "Entity 1 to Delete", tags: ["delete"] }),
        new TestEntity({ name: "Entity 2 to Delete", tags: ["delete"] }),
        new TestEntity({ name: "Entity to Keep", tags: ["keep"] }),
      ];

      const created = await TestEntityModel.create(testEntities);
      const idsToDelete = [created[0]._id, created[1]._id];

      // Act
      const result = (await repository.delete(
        idsToDelete
      )) as BulkCountedResponse<never>;

      // Assert
      expect(result.counts!.success).toBe(2);
      expect(result.counts!.fail).toBe(0);

      // Verify they were deleted from the database
      const remainingDocs = await TestEntityModel.find();
      expect(remainingDocs.length).toBe(1);
      expect(remainingDocs[0].name).toBe("Entity to Keep");
    });

    it("should return null if entity to delete is not found", async () => {
      // Act
      const result = await repository.delete("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });
  });

  // The save, createQuery, and executeQuery methods have been removed as they were redundant
  // with existing methods like update and find, and with DocumentHelpers.save functionality
});
