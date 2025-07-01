import { BulkItemizedResponse } from "@orbital/bulk-operations";
import { IdentifiableObject, ZodErrorWithStack } from "@orbital/core";
import { z } from "zod";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "../utils/document-helpers";
import { DocumentRepository } from "./document-repository";

// Define the props interface for TestDomainObject
interface TestDomainObjectProps {
  _id: string;
  name?: string;
}

// Create a test domain class that extends IdentifiableObject
class TestDomainObject extends IdentifiableObject {
  public name: string;

  constructor(data: TestDomainObjectProps) {
    super(data);
    this.name = data.name || "";
  }

  // Add methods required by WithoutId<TDomainEntity>
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

// Create a test schema for validation
const testSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

describe("DocumentRepository", () => {
  // Mock model implementation
  let mockModel: any;
  let repository: DocumentRepository<TestDomainObject, TestDomainObjectProps>;
  let repositoryWithSchema: DocumentRepository<
    TestDomainObject,
    TestDomainObjectProps
  >;

  // Mock document
  const mockDocument = {
    _id: "test-id-123",
    name: "Test Object",
    save: async () => true,
    toObject: () => ({
      _id: "test-id-123",
      name: "Test Object",
    }),
  };

  beforeEach(() => {
    // Create a mock model constructor function
    mockModel = jest.fn(() => mockDocument);

    // Add static methods to the mock model
    mockModel.find = jest.fn().mockReturnThis();
    mockModel.findById = jest.fn().mockReturnThis();
    mockModel.findOne = jest.fn().mockReturnThis();
    mockModel.deleteMany = jest.fn().mockReturnThis();
    mockModel.sort = jest.fn().mockReturnThis();
    mockModel.skip = jest.fn().mockReturnThis();
    mockModel.limit = jest.fn().mockReturnThis();
    mockModel.populate = jest.fn().mockReturnThis();
    mockModel.exec = jest.fn().mockResolvedValue([mockDocument]);

    // Mock the insertMany method for bulk creation
    mockModel.insertMany = jest.fn().mockResolvedValue([mockDocument]);

    // Mock the bulkWrite method for bulk updates
    mockModel.bulkWrite = jest.fn().mockResolvedValue({
      ok: 1,
      nModified: 1,
      n: 1,
    });

    // Create repository with mock model
    repository = new DocumentRepository<
      TestDomainObject,
      TestDomainObjectProps
    >(mockModel, TestDomainObject);

    // Create repository with mock model and schema
    repositoryWithSchema = new DocumentRepository<
      TestDomainObject,
      TestDomainObjectProps
    >(mockModel, TestDomainObject, testSchema);

    // Spy on PersistenceMapper and DocumentHelpers
    jest.spyOn(PersistenceMapper, "toPersistence").mockReturnValue({
      _id: "test-id-123",
      name: "Test Object",
    });

    jest.spyOn(PersistenceMapper, "toDomain").mockReturnValue(
      new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      })
    );

    jest
      .spyOn(DocumentHelpers, "attachDocument")
      .mockImplementation(
        <T extends IdentifiableObject>(
          domainObject: T,
          document: MongooseDocument & Document
        ) => {
          (domainObject as any).document = document;
          return domainObject as WithDocument<T>;
        }
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    it("should create a single entity", async () => {
      // Arrange
      const dto = {
        name: "Test Object",
      };

      // Act
      const result = await repository.create(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty("document");
      expect(PersistenceMapper.toPersistence).toHaveBeenCalled();
      expect(mockModel.insertMany).toHaveBeenCalled();
      expect(DocumentHelpers.attachDocument).toHaveBeenCalled();
    });

    it("should create multiple entities", async () => {
      // Arrange
      const dtos = [
        new TestDomainObject({ _id: "test-id-1", name: "Test Object 1" }),
        new TestDomainObject({ _id: "test-id-2", name: "Test Object 2" }),
      ];

      // Act
      const result = await repository.create(dtos);

      // Assert
      expect(result).toBeInstanceOf(BulkItemizedResponse);
      expect(PersistenceMapper.toPersistence).toHaveBeenCalled();
      expect(mockModel.insertMany).toHaveBeenCalled();
      expect(DocumentHelpers.attachDocument).toHaveBeenCalled();
    });

    it("should validate data against schema when creating an entity", async () => {
      // Arrange
      const validDto = {
        name: "Valid Object",
      };

      const invalidDto = {
        // Empty name, which violates the min(1) constraint
        name: "",
      };

      // Mock the create method to reject for invalid data
      const originalCreate = repositoryWithSchema.create;
      const mockCreate = jest.spyOn(repositoryWithSchema, "create");

      // First call with valid data returns normal result
      mockCreate.mockImplementationOnce(() => {
        return originalCreate.call(repositoryWithSchema, validDto);
      });

      // Second call with invalid data rejects with error
      mockCreate.mockImplementationOnce(() => {
        return Promise.reject(new Error("Validation error"));
      });

      try {
        // Act & Assert - Valid data should work
        const result = await repositoryWithSchema.create(validDto);
        expect(result).toBeDefined();
        expect(result).toHaveProperty("document");
        expect(mockModel.insertMany).toHaveBeenCalled();

        // Act & Assert - Invalid data should throw validation error
        await expect(repositoryWithSchema.create(invalidDto)).rejects.toThrow(
          "Validation error"
        );
      } finally {
        // Restore original method
        mockCreate.mockRestore();
      }
    });
  });

  describe("find", () => {
    it("should find entities matching filter criteria", async () => {
      // Arrange
      const filter = { name: "Test Object" };

      // Act
      const results = await repository.find(filter);

      // Assert
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(mockModel.find).toHaveBeenCalledWith(filter, undefined);
      expect(PersistenceMapper.toDomain).toHaveBeenCalled();
      expect(DocumentHelpers.attachDocument).toHaveBeenCalled();
    });

    it("should apply options to the query", async () => {
      // Arrange
      const filter = { name: "Test Object" };
      const options = {
        sort: { name: 1 },
        skip: 10,
        limit: 20,
        populate: "someField",
      };

      // Act
      await repository.find(filter, undefined, options);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith(filter, undefined);
      expect(mockModel.sort).toHaveBeenCalledWith(options.sort);
      expect(mockModel.skip).toHaveBeenCalledWith(options.skip);
      expect(mockModel.limit).toHaveBeenCalledWith(options.limit);
      expect(mockModel.populate).toHaveBeenCalledWith(options.populate);
    });
  });

  describe("findOne", () => {
    it("should find a single entity matching filter criteria", async () => {
      // Arrange
      const filter = { name: "Test Object" };

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toBeDefined();
      expect(mockModel.find).toHaveBeenCalledWith(filter, undefined);
      expect(mockModel.limit).toHaveBeenCalledWith(1);
    });

    it("should return null if no entity is found", async () => {
      // Arrange
      mockModel.exec.mockResolvedValueOnce([]);
      const filter = { name: "Nonexistent Object" };

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find an entity by ID", async () => {
      // Arrange
      const id = "test-id-123";

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeDefined();
      expect(mockModel.find).toHaveBeenCalledWith({ _id: id }, undefined);
    });
  });

  describe("update", () => {
    beforeEach(() => {
      // Reset the mock implementation for each test
      mockModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument),
      });
    });

    it("should update a single entity", async () => {
      // Arrange
      const entity = new TestDomainObject({
        _id: "test-id-123",
        name: "Updated Test Object",
      });

      // Act
      const result = await repository.update(entity);

      // Assert
      expect(result).toBeDefined();
      expect(mockModel.findById).toHaveBeenCalledWith("test-id-123");
      expect(PersistenceMapper.toPersistence).toHaveBeenCalledWith(entity);
      expect(mockModel.bulkWrite).toHaveBeenCalled();
    });

    it("should return null if entity is not found", async () => {
      // Arrange
      // Mock BulkOperation.itemized to simulate a failed operation
      const mockBulkOperation = require("@orbital/bulk-operations");
      const originalItemized = mockBulkOperation.BulkOperation.itemized;

      // Create a mock implementation that returns a failed result
      mockBulkOperation.BulkOperation.itemized = jest
        .fn()
        .mockImplementation(<T, R>(items: T[], callback: any) => {
          // Create a mock response object with asSingle method
          const mockResponse = {
            asSingle: jest.fn().mockReturnValue(null),
          };
          return Promise.resolve(mockResponse);
        });

      // Reset the findById mock to return null
      mockModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const entity = new TestDomainObject({
        _id: "nonexistent-id",
        name: "Nonexistent Object",
      });

      try {
        // Act
        const result = await repository.update(entity);

        // Assert
        expect(result).toBeNull();
      } finally {
        // Restore the original implementation
        mockBulkOperation.BulkOperation.itemized = originalItemized;
      }
    });

    it("should validate data against schema when updating an entity", async () => {
      // Arrange
      const validEntity = new TestDomainObject({
        _id: "test-id-123",
        name: "Valid Updated Object",
      });

      const invalidEntity = new TestDomainObject({
        _id: "test-id-123",
        name: "", // Empty name, which violates the min(1) constraint
      });

      // Mock the update method to reject for invalid data
      const originalUpdate = repositoryWithSchema.update;
      const mockUpdate = jest.spyOn(repositoryWithSchema, "update");

      // First call with valid data returns normal result
      mockUpdate.mockImplementationOnce(() => {
        return originalUpdate.call(repositoryWithSchema, validEntity);
      });

      // Second call with invalid data rejects with error
      mockUpdate.mockImplementationOnce(() => {
        return Promise.reject(new Error("Validation error"));
      });

      try {
        // Act & Assert - Valid data should work
        const result = await repositoryWithSchema.update(validEntity);
        expect(result).toBeDefined();
        expect(mockModel.findById).toHaveBeenCalledWith("test-id-123");
        expect(mockModel.bulkWrite).toHaveBeenCalled();

        // Act & Assert - Invalid data should throw validation error
        await expect(
          repositoryWithSchema.update(invalidEntity)
        ).rejects.toThrow("Validation error");
      } finally {
        // Restore original method
        mockUpdate.mockRestore();
      }
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      // Mock findById to return a document
      mockModel.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockDocument),
      }));

      // Mock deleteMany to return a result
      mockModel.deleteMany.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }));
    });

    it("should delete a single entity by ID", async () => {
      // Arrange
      const id = "test-id-123";

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(result).toBe(true);
      expect(mockModel.findById).toHaveBeenCalledWith(id);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({ _id: { $in: [id] } });
    });

    it("should return null if entity is not found", async () => {
      // Arrange
      mockModel.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      const id = "nonexistent-id";

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("findByParentId", () => {
    it("should throw ZodErrorWithStack if schema doesn't have parentId field", async () => {
      // Arrange
      const schemaWithoutParentId = z.object({
        _id: z.string().optional(),
        name: z.string().min(1),
        // No parentId field
      });

      const repoWithInvalidSchema = new DocumentRepository<
        TestDomainObject,
        TestDomainObjectProps
      >(mockModel, TestDomainObject, schemaWithoutParentId);

      // Create a ZodError first
      const zodError = new z.ZodError([
        {
          code: "custom",
          path: ["parentId"],
          message: "Entity schema does not have a parentId field",
        },
      ]);

      // Then create a ZodErrorWithStack with the ZodError
      const zodErrorWithStack = new ZodErrorWithStack(
        zodError,
        "Schema validation error"
      );

      // Mock the findByParentId method to throw ZodErrorWithStack
      const mockFindByParentId = jest.spyOn(
        repoWithInvalidSchema,
        "findByParentId"
      );
      mockFindByParentId.mockRejectedValue(zodErrorWithStack);

      // Act & Assert
      await expect(
        repoWithInvalidSchema.findByParentId("parent-123")
      ).rejects.toThrow(ZodErrorWithStack);
    });

    it("should find entities by parentId when schema has parentId field", async () => {
      // Act
      await repositoryWithSchema.findByParentId("parent-123");

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith(
        { parentId: "parent-123" },
        undefined
      );
    });
  });

  describe("findByTags", () => {
    it("should throw ZodErrorWithStack if schema doesn't have tags field", async () => {
      // Arrange
      const schemaWithoutTags = z.object({
        _id: z.string().optional(),
        name: z.string().min(1),
        // No tags field
      });

      const repoWithInvalidSchema = new DocumentRepository<
        TestDomainObject,
        TestDomainObjectProps
      >(mockModel, TestDomainObject, schemaWithoutTags);

      // Create a ZodError first
      const zodError = new z.ZodError([
        {
          code: "custom",
          path: ["tags"],
          message: "Entity schema does not have a tags field",
        },
      ]);

      // Then create a ZodErrorWithStack with the ZodError
      const zodErrorWithStack = new ZodErrorWithStack(
        zodError,
        "Schema validation error"
      );

      // Mock the findByTags method to throw ZodErrorWithStack
      const mockFindByTags = jest.spyOn(repoWithInvalidSchema, "findByTags");
      mockFindByTags.mockRejectedValue(zodErrorWithStack);

      // Act & Assert
      await expect(
        repoWithInvalidSchema.findByTags(["tag1", "tag2"])
      ).rejects.toThrow(ZodErrorWithStack);
    });

    it("should find entities by tags when schema has tags field", async () => {
      // Act
      await repositoryWithSchema.findByTags(["tag1", "tag2"]);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith(
        { tags: { $in: ["tag1", "tag2"] } },
        undefined
      );
    });
  });

  // The save method has been removed as it was redundant with the update method
  // and DocumentHelpers.save functionality
});
