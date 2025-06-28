import { BulkOperation } from "@scout/core";
import { ReturnModelType } from "@typegoose/typegoose";
import { z, ZodError } from "zod";
import { CrudRepository } from "./crud.repository";

// Spy on BulkOperation methods instead of mocking the entire module
jest.spyOn(BulkOperation, "itemized");
jest.spyOn(BulkOperation, "counted");

// Define a test entity type
type TestEntity = {
  _id?: string;
  name: string;
  description?: string;
  count: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  toPlainObject?: () => any;
};

// Type with required _id for update operations
type TestEntityWithId = Partial<TestEntity> & { _id: string };

// Define a Zod schema for validation
const testEntitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  count: z.number().int().positive(),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create a concrete implementation of CrudRepository for testing
class TestRepository extends CrudRepository<TestEntity> {
  constructor(model: ReturnModelType<any>, schema: z.ZodObject<any>) {
    super(model, schema);
  }
}

describe("CrudRepository", () => {
  let repository: TestRepository;
  let modelMock: any;

  // Mock entity data
  const mockEntity: TestEntity = {
    _id: "test-id-123",
    name: "Test Entity",
    description: "Test Description",
    count: 42,
    tags: ["tag1", "tag2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock entity with toPlainObject method
  const mockEntityWithToPlainObject: TestEntity = {
    ...mockEntity,
    toPlainObject: jest.fn().mockReturnValue({
      name: mockEntity.name,
      description: mockEntity.description,
      count: mockEntity.count,
      tags: mockEntity.tags,
      _id: mockEntity._id,
    }),
  };

  // Mock model instance with save method
  const mockModelInstance = {
    ...mockEntity,
    save: jest.fn().mockResolvedValue(mockEntity),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock for the model
    const saveMock = jest.fn().mockResolvedValue(mockModelInstance);

    // Create a mock instance that will be returned when the model is called as a constructor
    const mockInstance = {
      ...mockModelInstance,
      save: saveMock,
    };

    // Create the model mock function that returns the mock instance
    modelMock = jest.fn().mockReturnValue(mockInstance);

    // Add the save mock to the mockModelInstance for assertions
    mockModelInstance.save = saveMock;

    // Mock model static methods
    modelMock.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockModelInstance]),
    });

    modelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockModelInstance),
    });

    modelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockModelInstance),
    });

    modelMock.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockModelInstance),
    });

    // Mock bulk operations
    modelMock.insertMany = jest.fn().mockResolvedValue([mockModelInstance]);

    modelMock.bulkWrite = jest.fn().mockResolvedValue({
      insertedCount: 0,
      matchedCount: 1,
      modifiedCount: 1,
      deletedCount: 0,
      upsertedCount: 0,
    });

    modelMock.deleteMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    // Create repository instance with mocks
    repository = new TestRepository(modelMock, testEntitySchema);
  });

  describe("create", () => {
    it("should create and save a new entity (singular input)", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        description: "New Description",
        count: 10,
      };

      const result = await repository.create(createDto);

      // Verify BulkOperation.itemized was called with the right parameters
      expect(BulkOperation.itemized).toHaveBeenCalledWith(
        [createDto],
        expect.any(Function)
      );

      // Verify insertMany was called with the right data
      expect(modelMock.insertMany).toHaveBeenCalledWith([createDto]);

      // Verify the result is the mockModelInstance (from asSingle)
      expect(result).toEqual(mockModelInstance);
    });

    it("should create multiple entities (array input)", async () => {
      const createDtos: Partial<TestEntity>[] = [
        {
          name: "Entity 1",
          count: 10,
        },
        {
          name: "Entity 2",
          count: 20,
        },
      ];

      const result = await repository.create(createDtos);

      // Verify BulkOperation.itemized was called with the right parameters
      expect(BulkOperation.itemized).toHaveBeenCalledWith(
        createDtos,
        expect.any(Function)
      );

      // Verify insertMany was called with the right data
      expect(modelMock.insertMany).toHaveBeenCalledWith(createDtos);

      // Verify the result is a BulkItemizedResponse
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("counts");
      expect(result).toHaveProperty("status");
    });

    it("should validate entity with schema", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        count: 10,
      };

      const schemaSpy = jest.spyOn(testEntitySchema, "parse");
      await repository.create(createDto);

      // Schema validation should still be called
      expect(schemaSpy).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        count: -1, // Invalid: must be positive
      };

      // Mock schema.parse to throw an error
      jest.spyOn(testEntitySchema, "parse").mockImplementationOnce(() => {
        throw new Error("Validation error");
      });

      // Mock BulkOperation.itemized to simulate error handling
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        (items, operation) => {
          // Call the operation with mock success/fail functions
          operation(
            items,
            () => {}, // success - not called for validation errors
            () => {} // fail - would be called but we're just testing the flow
          );

          // Return a mock response with failed items
          return {
            items: [],
            counts: { total: 1, succeeded: 0, failed: 1 },
            status: "PARTIAL_SUCCESS",
            asSingle: () => {
              throw new Error("No successful items");
            },
          };
        }
      );

      try {
        await repository.create(createDto);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toBe("No successful items");
      } finally {
        // Restore the original spy implementation
        (BulkOperation.itemized as jest.Mock).mockImplementation(
          originalItemized
        );
      }

      // Verify insertMany was not called due to validation error
      expect(modelMock.insertMany).not.toHaveBeenCalled();
    });

    it("should call toPlainObject if entity has that method", async () => {
      // Create a simple object with toPlainObject method to avoid circular references
      const testEntity = {
        name: "Test Entity",
        count: 10,
        toPlainObject: jest.fn().mockReturnValue({
          name: "Test Entity",
          count: 10,
        }),
      };

      // Mock BulkOperation.itemized to avoid infinite recursion
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        (items, operation) => {
          // Call the operation with mock success/fail functions
          operation(
            items,
            () => {}, // success
            () => {} // fail
          );

          // Return a mock response
          return {
            items: [],
            counts: { total: 1, succeeded: 1, failed: 0 },
            status: "SUCCESS",
            asSingle: () => mockModelInstance,
          };
        }
      );

      await repository.create(testEntity);

      // Restore the original spy implementation
      (BulkOperation.itemized as jest.Mock).mockImplementation(
        originalItemized
      );

      expect(testEntity.toPlainObject).toHaveBeenCalled();
    });
  });

  describe("find", () => {
    it("should find entities with filter and projection", async () => {
      const filter = { name: "Test Entity" };
      const projection = { name: 1, count: 1 };

      const result = await repository.find(filter, projection);

      expect(result).toEqual([mockModelInstance]);
      expect(modelMock.find).toHaveBeenCalledWith(filter, projection);
    });

    it("should apply query options if provided", async () => {
      const filter = { name: "Test Entity" };
      const projection = { name: 1, count: 1 };
      const options = {
        sort: { createdAt: -1 },
        skip: 10,
        limit: 20,
        populate: "relatedField",
      };

      await repository.find(filter, projection, options);

      const findQuery = modelMock.find.mock.results[0].value;
      expect(findQuery.sort).toHaveBeenCalledWith(options.sort);
      expect(findQuery.skip).toHaveBeenCalledWith(options.skip);
      expect(findQuery.limit).toHaveBeenCalledWith(options.limit);
      expect(findQuery.populate).toHaveBeenCalledWith(options.populate);
    });
  });

  describe("findOne", () => {
    it("should find a single entity with filter and projection", async () => {
      const filter = { name: "Test Entity" };
      const projection = { name: 1, count: 1 };

      const result = await repository.findOne(filter, projection);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock.find).toHaveBeenCalledWith(filter, projection);

      // Verify limit was set to 1
      const findQuery = modelMock.find.mock.results[0].value;
      expect(findQuery.limit).toHaveBeenCalledWith(1);
    });

    it("should return null if no entity matches the filter", async () => {
      // Mock find to return empty array
      modelMock.find.mockReturnValueOnce({
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findOne({ name: "Nonexistent" });

      expect(result).toBeNull();
    });

    it("should apply query options except limit", async () => {
      const filter = { name: "Test Entity" };
      const projection = { name: 1, count: 1 };
      const options = {
        sort: { createdAt: -1 },
        skip: 10,
        limit: 20, // This should be overridden to 1
        populate: "relatedField",
      };

      await repository.findOne(filter, projection, options);

      const findQuery = modelMock.find.mock.results[0].value;
      expect(findQuery.sort).toHaveBeenCalledWith(options.sort);
      expect(findQuery.skip).toHaveBeenCalledWith(options.skip);
      expect(findQuery.limit).toHaveBeenCalledWith(1); // Should always be 1
      expect(findQuery.populate).toHaveBeenCalledWith(options.populate);
    });
  });

  describe("findById", () => {
    it("should find an entity by id", async () => {
      const result = await repository.findById(mockEntity._id!);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock.find).toHaveBeenCalledWith(
        { _id: mockEntity._id },
        undefined
      );

      // Verify limit was set to 1 (via findOne)
      const findQuery = modelMock.find.mock.results[0].value;
      expect(findQuery.limit).toHaveBeenCalledWith(1);
    });

    it("should find an entity by id with projection", async () => {
      const projection = { name: 1, count: 1 };
      const result = await repository.findById(mockEntity._id!, projection);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock.find).toHaveBeenCalledWith(
        { _id: mockEntity._id },
        projection
      );
    });

    it("should return null if entity not found", async () => {
      // Mock find to return empty array
      modelMock.find.mockReturnValueOnce({
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findById("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("findByParentId", () => {
    it("should find entities by parent ID", async () => {
      const parentId = "parent-id-123";

      await repository.findByParentId(parentId);

      expect(modelMock.find).toHaveBeenCalledWith({ parentId }, undefined);
    });

    it("should find top-level entities with empty parentId", async () => {
      await repository.findByParentId("");

      expect(modelMock.find).toHaveBeenCalledWith({ parentId: "" }, undefined);
    });

    it("should throw ZodError if schema doesn't have parentId field", async () => {
      // Create a schema without parentId
      const schemaWithoutParentId = z.object({
        name: z.string(),
        count: z.number(),
      });

      // Create a repository with the limited schema
      const limitedRepository = new TestRepository(
        modelMock,
        schemaWithoutParentId
      );

      try {
        await limitedRepository.findByParentId("any-id");
        fail("Should have thrown a ZodError");
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        expect(error.issues[0].message).toBe(
          "Entity schema does not have a parentId field"
        );
      }
    });
  });

  describe("findByTags", () => {
    it("should find entities by tags", async () => {
      const tags = ["tag1", "tag2", "tag3"];

      await repository.findByTags(tags);

      expect(modelMock.find).toHaveBeenCalledWith(
        { tags: { $in: tags } },
        undefined
      );
    });

    it("should throw ZodError if schema doesn't have tags field", async () => {
      // Create a schema without tags
      const schemaWithoutTags = z.object({
        name: z.string(),
        count: z.number(),
      });

      // Create a repository with the limited schema
      const limitedRepository = new TestRepository(
        modelMock,
        schemaWithoutTags
      );

      try {
        await limitedRepository.findByTags(["tag1"]);
        fail("Should have thrown a ZodError");
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        expect(error.issues[0].message).toBe(
          "Entity schema does not have a tags field"
        );
      }
    });
  });

  describe("update", () => {
    it("should update an entity by id (singular input)", async () => {
      // Ensure _id is not undefined
      const updateData: TestEntityWithId = {
        _id: mockEntity._id!,
        name: "Updated Entity",
        description: "Updated Description",
      };

      // Mock BulkOperation.itemized to avoid infinite recursion
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        (items, operation) => {
          // Call the operation with mock success/fail functions
          operation(
            items,
            () => {}, // success
            () => {} // fail
          );

          // Return a mock response
          return {
            items: [],
            counts: { total: 1, succeeded: 1, failed: 0 },
            status: "SUCCESS",
            asSingle: () => mockModelInstance,
          };
        }
      );

      const result = await repository.update(updateData);

      // Restore the original spy implementation
      (BulkOperation.itemized as jest.Mock).mockImplementation(
        originalItemized
      );

      // Verify bulkWrite was called with the right operations
      expect(modelMock.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: mockEntity._id },
            update: expect.objectContaining({
              name: "Updated Entity",
              description: "Updated Description",
            }),
            upsert: false,
          },
        },
      ]);

      // Verify findById was called to get the updated document
      expect(modelMock.findById).toHaveBeenCalledWith(mockEntity._id);

      // Verify the result is the mockModelInstance (from asSingle)
      expect(result).toEqual(mockModelInstance);
    });

    it("should update multiple entities (array input)", async () => {
      const updateData: TestEntityWithId[] = [
        {
          _id: "id1",
          name: "Updated Entity 1",
        },
        {
          _id: "id2",
          count: 30,
        },
      ];

      // Mock BulkOperation.itemized to avoid infinite recursion
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        (items, operation) => {
          // Call the operation with mock success/fail functions
          operation(
            items,
            () => {}, // success
            () => {} // fail
          );

          // Return a mock response
          return {
            items: [],
            counts: { total: 2, succeeded: 2, failed: 0 },
            status: "SUCCESS",
            asSingle: () => {
              throw new Error("Should not be called for array input");
            },
          };
        }
      );

      const result = await repository.update(updateData);

      // Restore the original spy implementation
      (BulkOperation.itemized as jest.Mock).mockImplementation(
        originalItemized
      );

      // Verify bulkWrite was called with the right operations
      expect(modelMock.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: "id1" },
            update: expect.objectContaining({ name: "Updated Entity 1" }),
            upsert: false,
          },
        },
        {
          updateOne: {
            filter: { _id: "id2" },
            update: expect.objectContaining({ count: 30 }),
            upsert: false,
          },
        },
      ]);

      // For array input, we just verify it's an object with the right properties
      expect(result).toBeDefined();
    });

    it("should validate update data with a partial schema", async () => {
      const updateData: TestEntityWithId = {
        _id: mockEntity._id!,
        name: "Updated Entity",
        count: 20,
      };

      // Create mock methods for the schema operations
      const partialMock = jest.fn().mockReturnValue({
        pick: jest.fn().mockReturnValue({
          parse: jest.fn(),
        }),
      });

      // Replace the schema's partial method with our mock
      const originalPartial = testEntitySchema.partial;
      testEntitySchema.partial = partialMock;

      // Mock BulkOperation.itemized to avoid infinite recursion
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        (items, operation) => {
          // Call the operation with mock success/fail functions
          operation(
            items,
            () => {}, // success
            () => {} // fail
          );

          // Return a mock response
          return {
            items: [],
            counts: { total: 1, succeeded: 1, failed: 0 },
            status: "SUCCESS",
            asSingle: () => mockModelInstance,
          };
        }
      );

      try {
        await repository.update(updateData);

        // Should have called partial() on the schema
        expect(partialMock).toHaveBeenCalled();

        // Should have called pick() with the update fields
        const pickMock = partialMock.mock.results[0].value.pick;
        expect(pickMock).toHaveBeenCalledWith({
          name: true,
          count: true,
        });

        // Should have called parse() with the update data
        const parseMock = pickMock.mock.results[0].value.parse;
        expect(parseMock).toHaveBeenCalledWith({
          name: "Updated Entity",
          count: 20,
        });
      } finally {
        // Restore the original method
        testEntitySchema.partial = originalPartial;
        // Restore the original spy implementation
        (BulkOperation.itemized as jest.Mock).mockImplementation(
          originalItemized
        );
      }
    });

    it("should call toPlainObject if entity has that method", async () => {
      // Create a simple object with toPlainObject method to avoid circular references
      const updateEntity: TestEntityWithId = {
        _id: "test-id",
        name: "Updated via toPlainObject",
        count: 15,
        toPlainObject: jest.fn().mockReturnValue({
          _id: "test-id",
          name: "Updated via toPlainObject",
          count: 15,
        }),
      };

      // Mock BulkOperation.itemized to avoid infinite recursion
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        (items, operation) => {
          // Call the operation with mock success/fail functions
          operation(
            items,
            () => {}, // success
            () => {} // fail
          );

          // Return a mock response
          return {
            items: [],
            counts: { total: 1, succeeded: 1, failed: 0 },
            status: "SUCCESS",
            asSingle: () => mockModelInstance,
          };
        }
      );

      await repository.update(updateEntity);

      // Restore the original spy implementation
      (BulkOperation.itemized as jest.Mock).mockImplementation(
        originalItemized
      );

      expect(updateEntity.toPlainObject).toHaveBeenCalled();
    });

    it("should return null if entity not found (singular input)", async () => {
      // Mock findById to return null after update
      modelMock.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock BulkOperation.itemized to simulate entity not found
      const originalItemized = BulkOperation.itemized;
      (BulkOperation.itemized as jest.Mock).mockImplementationOnce(
        async (items, operation) => {
          // Call the operation with mock success/fail functions
          await operation(
            items,
            () => {}, // success - not called when entity not found
            () => {} // fail - would be called but we're just testing the flow
          );

          // Return a mock response that will return null from asSingle
          return {
            items: [],
            counts: { total: 1, succeeded: 0, failed: 1 },
            status: "FAILED",
            asSingle: () => null,
          };
        }
      );

      const updateData: TestEntityWithId = {
        _id: "nonexistent-id",
        name: "Updated Entity",
      };

      const result = await repository.update(updateData);

      // Restore the original spy implementation
      (BulkOperation.itemized as jest.Mock).mockImplementation(
        originalItemized
      );

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an entity by id (singular input)", async () => {
      const result = await repository.delete(mockEntity._id!);

      // Verify findById was called to check if the entity exists
      expect(modelMock.findById).toHaveBeenCalledWith(mockEntity._id);

      // Verify BulkOperation.counted was called with the right parameters
      expect(BulkOperation.counted).toHaveBeenCalledWith(
        [mockEntity._id],
        expect.any(Function)
      );

      // Verify deleteMany was called with the right filter
      expect(modelMock.deleteMany).toHaveBeenCalledWith({
        _id: { $in: [mockEntity._id] },
      });

      // Verify the result is true (successful deletion)
      expect(result).toBe(true);
    });

    it("should delete multiple entities (array input)", async () => {
      const ids = ["id1", "id2", "id3"];

      const result = await repository.delete(ids);

      // Verify BulkOperation.counted was called with the right parameters
      expect(BulkOperation.counted).toHaveBeenCalledWith(
        ids,
        expect.any(Function)
      );

      // Verify deleteMany was called with the right filter
      expect(modelMock.deleteMany).toHaveBeenCalledWith({ _id: { $in: ids } });

      // Verify the result is a BulkCountedResponse
      expect(result).toHaveProperty("counts");
      expect(result).toHaveProperty("status");
    });

    it("should return null if entity not found (singular input)", async () => {
      // Mock findById to return null
      modelMock.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.delete("nonexistent-id");

      expect(result).toBeNull();

      // deleteMany should not be called if entity not found
      expect(modelMock.deleteMany).not.toHaveBeenCalled();
    });
  });
});
