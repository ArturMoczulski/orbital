import { ReturnModelType } from "@typegoose/typegoose";
import { z } from "zod";
import { CrudRepository } from "./crud.repository";

// Define a test entity interface
interface TestEntity {
  _id?: string;
  name: string;
  description?: string;
  count: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  toPlainObject?: () => any;
}

// Type with required _id for update operations
type TestEntityWithId = Partial<TestEntity> & { _id: string };

// Define a Zod schema for validation
const testEntitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  count: z.number().int().positive(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create a concrete implementation of CrudRepository for testing
class TestRepository extends CrudRepository<TestEntity> {
  constructor(model: ReturnModelType<any>, schema?: z.ZodObject<any>) {
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
      ...mockEntity,
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

    // Create repository instance with mocks
    repository = new TestRepository(modelMock, testEntitySchema);
  });

  describe("create", () => {
    it("should create and save a new entity", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        description: "New Description",
        count: 10,
      };

      const result = await repository.create(createDto);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock).toHaveBeenCalledWith(createDto);
      expect(mockModelInstance.save).toHaveBeenCalled();
    });

    it("should validate entity with schema if provided", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        count: 10,
      };

      const schemaSpy = jest.spyOn(testEntitySchema, "parse");
      await repository.create(createDto);

      expect(schemaSpy).toHaveBeenCalledWith({
        name: "New Entity",
        count: 10,
      });
    });

    it("should handle validation errors", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        count: -1, // Invalid: must be positive
      };

      await expect(repository.create(createDto)).rejects.toThrow();
    });

    it("should call toPlainObject if entity has that method", async () => {
      const result = await repository.create(mockEntityWithToPlainObject);

      expect(mockEntityWithToPlainObject.toPlainObject).toHaveBeenCalled();
      expect(modelMock).toHaveBeenCalledWith(mockEntity);
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

  describe("findById", () => {
    it("should find an entity by id", async () => {
      const result = await repository.findById(mockEntity._id!);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock.find).toHaveBeenCalledWith(
        { _id: mockEntity._id },
        undefined
      );
    });

    it("should return null if entity not found", async () => {
      // Mock find to return empty array
      modelMock.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findById("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should find all entities with optional filter and projection", async () => {
      const filter = { count: { $gt: 10 } };
      const projection = { name: 1, count: 1 };

      const result = await repository.findAll(filter, projection);

      expect(result).toEqual([mockModelInstance]);
      expect(modelMock.find).toHaveBeenCalledWith(filter, projection);
    });

    it("should use empty filter if none provided", async () => {
      await repository.findAll();

      expect(modelMock.find).toHaveBeenCalledWith({}, undefined);
    });
  });

  describe("update", () => {
    it("should update an entity by id", async () => {
      // Ensure _id is not undefined
      const updateData: TestEntityWithId = {
        _id: mockEntity._id!,
        name: "Updated Entity",
        description: "Updated Description",
      };

      const result = await repository.update(updateData);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEntity._id,
        { name: "Updated Entity", description: "Updated Description" },
        { new: true }
      );
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
      }
    });

    it("should call toPlainObject if entity has that method", async () => {
      // Ensure _id is not undefined
      const updateEntity: TestEntityWithId = {
        ...mockEntityWithToPlainObject,
        _id: mockEntityWithToPlainObject._id!,
        name: "Updated via toPlainObject",
      };

      await repository.update(updateEntity);

      expect(updateEntity.toPlainObject).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete an entity by id", async () => {
      const result = await repository.delete(mockEntity._id!);

      expect(result).toEqual(mockModelInstance);
      expect(modelMock.findByIdAndDelete).toHaveBeenCalledWith(mockEntity._id);
    });

    it("should return null if entity not found", async () => {
      // Mock findByIdAndDelete to return null
      modelMock.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.delete("nonexistent-id");

      expect(result).toBeNull();
    });
  });
});
