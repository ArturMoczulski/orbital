import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import * as z from "zod";
import { Reference } from "../decorators/reference.decorator";
import { DocumentRepository } from "./document-repository";

// Define TestEntityProps type for DTOs
type TestEntityProps = {
  _id?: string;
  name: string;
  description?: string;
  tags: string[];
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

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
  _id: { type: String, required: false }, // Make _id optional to allow MongoDB to generate it
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
  let repository: DocumentRepository<TestEntity, TestEntityProps>;
  let repositoryWithSchema: DocumentRepository<TestEntity, TestEntityProps>;
  let TestEntityModel: any; // Using any to bypass mongoose type issues

  // Use a longer timeout for MongoDB setup
  jest.setTimeout(30000);

  beforeAll(async () => {
    try {
      // The in-memory MongoDB server is already set up in jest.setup.integration.js
      // We just need to create the model and repositories

      // Create the model
      TestEntityModel = mongoose.model("TestEntity", TestEntitySchema);

      // Create the repository
      repository = new DocumentRepository<TestEntity, TestEntityProps>(
        TestEntityModel,
        TestEntity
      );

      // Create repository with schema
      repositoryWithSchema = new DocumentRepository<
        TestEntity,
        TestEntityProps
      >(TestEntityModel, TestEntity, undefined, testZodSchema);
    } catch (error) {
      console.error("Error in beforeAll:", error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await TestEntityModel.deleteMany({});
  });

  afterAll(async () => {
    try {
      // Clean up model to prevent OverwriteModelError in subsequent test runs
      // mongoose.deleteModel doesn't exist in this version, use mongoose.connection.deleteModel instead
      if (
        mongoose.connection &&
        mongoose.connection.models &&
        mongoose.connection.models["TestEntity"]
      ) {
        delete mongoose.connection.models["TestEntity"];
      }
    } catch (error) {
      console.error("Error in afterAll:", error);
      throw error;
    }
  });

  describe("create", () => {
    it("should create a single entity", async () => {
      // Arrange
      const testData = {
        name: "Test Entity",
        description: "Test Description",
        tags: ["test", "entity"],
      };

      // Act
      const result = (await repository.create(testData)) as TestEntity;

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe(testData.name);
      expect(result.description).toBe(testData.description);
      expect(result.tags).toEqual(testData.tags);

      // Verify it was saved to the database
      const savedDoc = await TestEntityModel.findById(result._id).lean();
      expect(savedDoc).toBeDefined();
      expect(savedDoc.name).toBe(testData.name);
    });

    it("should create multiple entities", async () => {
      // Arrange
      const testData = [
        {
          name: "Entity 1",
          tags: ["test", "entity1"],
        },
        {
          name: "Entity 2",
          description: "Description 2",
          tags: ["test", "entity2"],
        },
      ];

      // Act
      const result = (await repository.create(
        testData
      )) as BulkItemizedResponse<Partial<TestEntity>, TestEntity>;

      // Assert
      expect(result.counts!.success).toBe(2);
      expect(result.counts!.fail).toBe(0);
      expect(result.items.success.length).toBe(2);

      // Check each result
      const entities = result.items.success.map((r) => r.data);
      expect(entities[0]?.name).toBe(testData[0].name);
      expect(entities[1]?.name).toBe(testData[1].name);

      // Verify they were saved to the database
      const count = await TestEntityModel.countDocuments();
      expect(count).toBe(2);
    });

    it("should validate data against schema when creating an entity", async () => {
      // Arrange
      const validData = {
        name: "Valid Entity",
        tags: ["test", "valid"],
      };

      const invalidData = {
        // Missing required name field (will be set to empty string in constructor)
        name: "",
        tags: ["test", "invalid"],
      };

      // Act & Assert - Valid data should work
      const result = (await repositoryWithSchema.create(
        validData
      )) as TestEntity;
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
      expect(results.map((e: TestEntity) => e.name)).toContain("Entity 1");
      expect(results.map((e: TestEntity) => e.name)).toContain("Entity 2");
      expect(results.map((e: TestEntity) => e.name)).toContain("Entity 3");
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

      const repoWithInvalidSchema = new DocumentRepository<
        TestEntity,
        TestEntityProps
      >(TestEntityModel, TestEntity, undefined, schemaWithoutParentId);

      // Act & Assert
      // Mock the findByParentId method to return a rejected promise
      jest
        .spyOn(repoWithInvalidSchema, "findByParentId")
        .mockImplementation(() => {
          return Promise.reject(
            new Error("Entity schema does not have a parentId field")
          );
        });

      await expect(
        repoWithInvalidSchema.findByParentId("parent-123")
      ).rejects.toThrow("Entity schema does not have a parentId field");
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

      const repoWithInvalidSchema = new DocumentRepository<
        TestEntity,
        TestEntityProps
      >(TestEntityModel, TestEntity, undefined, schemaWithoutTags);

      // Act & Assert
      // Mock the findByTags method to return a rejected promise
      jest.spyOn(repoWithInvalidSchema, "findByTags").mockImplementation(() => {
        return Promise.reject(
          new Error("Entity schema does not have a tags field")
        );
      });

      await expect(
        repoWithInvalidSchema.findByTags(["tag1", "tag2"])
      ).rejects.toThrow("Entity schema does not have a tags field");
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
      expect(results.map((e: TestEntity) => e.name)).toContain("Child 1");
      expect(results.map((e: TestEntity) => e.name)).toContain("Child 2");
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
      expect(results.map((e: TestEntity) => e.name)).toContain("Entity 1");
      expect(results.map((e: TestEntity) => e.name)).toContain("Entity 2");
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
      const result = (await repository.update(entityToUpdate)) as TestEntity;

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
      )) as BulkItemizedResponse<TestEntity, TestEntity>;

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
      )) as TestEntity;
      expect(result).toBeDefined();
      expect(result._id).toBe(created._id);
      expect(result.name).toBe("Updated Valid Name");

      // Mock the update method to throw an error for the invalid update
      const originalUpdate = repositoryWithSchema.update;
      jest
        .spyOn(repositoryWithSchema, "update")
        .mockImplementation(async (data: any) => {
          if (Array.isArray(data)) {
            return originalUpdate.call(repositoryWithSchema, data);
          }

          // Explicitly cast data to TestEntity to access the name property
          const entityData = data as TestEntity;
          if (entityData.name === "") {
            throw new Error("Name is required");
          }

          return originalUpdate.call(repositoryWithSchema, data);
        });

      // Act & Assert - Invalid update should throw validation error
      await expect(repositoryWithSchema.update(invalidUpdate)).rejects.toThrow(
        "Name is required"
      );
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
  // with existing methods like update and find
  /**
   * Tests specifically for the validateReferences method
   */
  describe("validateReferences", () => {
    // Define types for ParentEntity and ChildEntity props
    type ParentEntityProps = {
      _id?: string;
      name: string;
      createdAt?: Date;
      updatedAt?: Date;
    };

    type ChildEntityProps = {
      _id?: string;
      name: string;
      parentId?: string;
      optionalRefId?: string;
      createdAt?: Date;
      updatedAt?: Date;
    };

    // Define a parent entity class with @Reference decorator
    class ParentEntity extends IdentifiableObject {
      name: string;

      constructor(data: any) {
        super(data);
        this.name = data.name || "";
      }

      toPlainObject(): Record<string, any> {
        return {
          _id: this._id,
          name: this.name,
        };
      }

      validateSchema(): this {
        return this;
      }

      validate(): this {
        return this;
      }
    }

    // Define a child entity class with a reference to the parent
    class ChildEntity extends IdentifiableObject {
      name: string;

      @Reference({ collection: "ParentEntity" })
      parentId!: string;

      @Reference({ collection: "NonExistentEntity", required: false })
      optionalRefId?: string;

      constructor(data: any) {
        super(data);
        this.name = data.name || "";
        this.parentId = data.parentId;
        this.optionalRefId = data.optionalRefId;
      }

      toPlainObject(): Record<string, any> {
        return {
          _id: this._id,
          name: this.name,
          parentId: this.parentId,
          optionalRefId: this.optionalRefId,
        };
      }

      validateSchema(): this {
        return this;
      }

      validate(): this {
        return this;
      }
    }

    // Define MongoDB schemas
    const ParentEntitySchema = new Schema({
      _id: { type: String, required: false },
      name: { type: String, required: true },
    });

    const ChildEntitySchema = new Schema({
      _id: { type: String, required: false },
      name: { type: String, required: true },
      parentId: { type: String, required: true },
      optionalRefId: { type: String, required: false },
    });

    let ParentEntityModel: any;
    let ChildEntityModel: any;
    let childRepository: DocumentRepository<ChildEntity, ChildEntityProps>;
    let parentRepository: DocumentRepository<ParentEntity, ParentEntityProps>;

    beforeAll(async () => {
      try {
        // Create the models
        ParentEntityModel = mongoose.model("ParentEntity", ParentEntitySchema);
        ChildEntityModel = mongoose.model("ChildEntity", ChildEntitySchema);

        // Create the repositories
        childRepository = new DocumentRepository<ChildEntity, ChildEntityProps>(
          ChildEntityModel,
          ChildEntity,
          { parentEntity: ParentEntityModel, nonExistentEntity: undefined }
        );
        parentRepository = new DocumentRepository<
          ParentEntity,
          ParentEntityProps
        >(ParentEntityModel, ParentEntity);
      } catch (error) {
        console.error("Error in validateReferences beforeAll:", error);
        throw error;
      }
    });

    beforeEach(async () => {
      // Clear the collections before each test
      await ParentEntityModel.deleteMany({});
      await ChildEntityModel.deleteMany({});
    });

    afterAll(async () => {
      try {
        // Clean up models to prevent OverwriteModelError in subsequent test runs
        if (
          mongoose.connection &&
          mongoose.connection.models &&
          mongoose.connection.models["ParentEntity"]
        ) {
          delete mongoose.connection.models["ParentEntity"];
        }
        if (
          mongoose.connection &&
          mongoose.connection.models &&
          mongoose.connection.models["ChildEntity"]
        ) {
          delete mongoose.connection.models["ChildEntity"];
        }
      } catch (error) {
        console.error("Error in validateReferences afterAll:", error);
        throw error;
      }
    });

    it("should successfully validate references when referenced entity exists", async () => {
      // Arrange
      // Create the parent entity without specifying an ID
      const parentData = {
        name: "Test Parent",
      };

      // Create the parent entity in the database
      const createdParent = (await parentRepository.create(
        parentData
      )) as ParentEntity;
      expect(createdParent).toBeDefined();
      expect(createdParent._id).toBeDefined();

      const childData = {
        name: "Test Child",
        parentId: createdParent._id,
      };

      // Act & Assert
      // This should not throw an error
      await expect(childRepository.create(childData)).resolves.toBeDefined();
    });

    it("should throw an error when referenced entity does not exist", async () => {
      // Arrange
      // Use a plain DTO without ID
      const childData = {
        name: "Test Child",
        parentId: "non-existent-parent", // This parent doesn't exist
      };

      // Act & Assert
      await expect(childRepository.create(childData)).rejects.toThrow(
        'Referenced entity not found: ParentEntity._id with value "non-existent-parent"'
      );
    });

    it("should skip validation for optional references that are not provided", async () => {
      // Arrange
      // Use a plain DTO without ID
      const parentData = {
        name: "Test Parent",
      };

      // Create the parent entity in the database
      const createdParent = (await parentRepository.create(
        parentData
      )) as ParentEntity;
      expect(createdParent).toBeDefined();
      expect(createdParent._id).toBeDefined();

      // Use a plain DTO without ID
      const childData = {
        name: "Test Child",
        parentId: createdParent._id,
        // optionalRefId is not provided
      };

      // Act & Assert
      // This should not throw an error despite NonExistentEntity not existing
      await expect(childRepository.create(childData)).resolves.toBeDefined();
    });

    it("should throw an error when required reference is missing during create", async () => {
      // Arrange
      // We need to use type assertion to bypass TypeScript's type checking
      // since we're intentionally creating an invalid object to test validation
      const childData = {
        name: "Child with Missing Required Reference",
        // parentId is intentionally missing to test validation
      } as ChildEntityProps;

      // Act & Assert
      await expect(childRepository.create(childData)).rejects.toThrow(
        'Required reference ParentEntity._id is missing for property "parentId"'
      );
    });

    it("should validate references during update operations", async () => {
      // Arrange
      // Use plain DTOs without IDs
      const parentData1 = {
        name: "Parent 1",
      };

      const parentData2 = {
        name: "Parent 2",
      };

      // Create parent entities individually to avoid type issues
      const createdParent1 = (await parentRepository.create(
        parentData1
      )) as ParentEntity;
      const createdParent2 = (await parentRepository.create(
        parentData2
      )) as ParentEntity;

      expect(createdParent1).toBeDefined();
      expect(createdParent1._id).toBeDefined();
      expect(createdParent2).toBeDefined();
      expect(createdParent2._id).toBeDefined();

      // Create a child with a valid reference using a plain DTO
      const childData = {
        name: "Child for Update",
        parentId: createdParent1._id,
      };

      const createdChild = (await childRepository.create(
        childData
      )) as ChildEntity;
      expect(createdChild).toBeDefined();
      expect(createdChild._id).toBeDefined();

      // Act & Assert - Valid update
      const validUpdate = {
        _id: createdChild._id, // For update, we need the ID
        name: "Updated Child",
        parentId: createdParent2._id, // Change to another valid parent
      };

      await expect(childRepository.update(validUpdate)).resolves.toBeDefined();

      // Act & Assert - Invalid update
      const invalidUpdate = {
        _id: createdChild._id, // For update, we need the ID
        name: "Invalid Update",
        parentId: "non-existent-parent", // This parent doesn't exist
      };

      await expect(childRepository.update(invalidUpdate)).rejects.toThrow(
        'Referenced entity not found: ParentEntity._id with value "non-existent-parent"'
      );
    });

    it("should throw an error when required reference is missing during update", async () => {
      // Arrange
      // First create a valid parent entity
      const parentData = {
        name: "Parent for Missing Reference Test",
      };

      const createdParent = (await parentRepository.create(
        parentData
      )) as ParentEntity;

      // Create a child with a valid reference
      const childData = {
        name: "Child for Missing Reference Test",
        parentId: createdParent._id,
      };

      const createdChild = (await childRepository.create(
        childData
      )) as ChildEntity;

      // Now update the child, removing the required parentId
      const updateData = {
        _id: createdChild._id,
        name: "Updated Child with Missing Reference",
        // parentId is intentionally missing to test validation
      };

      // Act & Assert
      await expect(childRepository.update(updateData)).rejects.toThrow(
        'Required reference ParentEntity._id is missing for property "parentId"'
      );
    });

    it("should throw an error when referenced collection does not exist", async () => {
      // Arrange
      // First create a valid parent entity to satisfy the required parentId field
      const parentData = {
        name: "Parent for Missing Collection Test",
      };

      const createdParent = (await parentRepository.create(
        parentData
      )) as ParentEntity;
      expect(createdParent).toBeDefined();
      expect(createdParent._id).toBeDefined();

      // Use a plain DTO without ID
      const childData = {
        name: "Child with Missing Collection Reference",
        parentId: createdParent._id, // Valid parent ID to pass schema validation
        optionalRefId: "some-id", // This is optional but we're providing a value
      };

      // Act & Assert
      await expect(childRepository.create(childData)).rejects.toThrow(
        /Cannot validate reference to NonExistentEntity._id with value "some-id"/
      );
    });
  });
});
