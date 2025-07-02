import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import {
  AreaModel,
  DocumentRepository,
  WithDocument,
  WorldModel,
} from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { Document } from "mongoose";
import { AreasRepository } from "./areas.repository";

describe("AreasRepository", () => {
  let repository: AreasRepository;
  let mockAreaModel: ReturnModelType<typeof AreaModel>;
  let mockWorldModel: ReturnModelType<typeof WorldModel>;
  let mockArea: AreaModel;

  beforeEach(() => {
    // Create a mock area directly
    mockArea = {
      _id: "area-id-123",
      worldId: "world-id-456",
      name: "Test Area",
      description: "A test area",
      landmarks: ["landmark1", "landmark2"],
      connections: ["connection1", "connection2"],
      tags: ["test", "area"],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as AreaModel;

    // Create a mock document with save and toObject methods
    const mockAreaDocument = {
      ...mockArea,
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(mockArea),
    } as unknown as Document & AreaModel;

    // Create a proper mock model object with all required methods
    const mockModel = {
      // Constructor function
      new: jest.fn().mockReturnValue(mockAreaDocument),
      // Static methods
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockAreaDocument]),
    };

    // Create a function that also has all the properties of mockModel
    const modelFunction = function () {
      return mockAreaDocument;
    } as any;

    // Copy all properties from mockModel to modelFunction
    Object.assign(modelFunction, mockModel);

    // Cast to the required type
    mockAreaModel = modelFunction as unknown as ReturnModelType<
      typeof AreaModel
    >;

    // Create a mock world model with similar structure
    const mockWorldModelFunction = function () {
      return {
        _id: "world-id-456",
        name: "Test World",
        shard: "test-shard",
        techLevel: 1,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn(),
      };
    } as any;

    // Add the exists method to the mock model
    mockWorldModelFunction.exists = jest
      .fn()
      .mockResolvedValue({ _id: "world-id-456" });

    // Copy all properties from mockModel to modelFunction (reuse the same structure)
    Object.assign(mockWorldModelFunction, mockModel);

    // Cast to the required type
    mockWorldModel = mockWorldModelFunction as unknown as ReturnModelType<
      typeof WorldModel
    >;

    // Create repository with mock models
    repository = new AreasRepository(mockAreaModel, mockWorldModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  it("should be an instance of DocumentRepository", () => {
    expect(repository).toBeInstanceOf(DocumentRepository);
  });

  describe("findByWorldId", () => {
    it("should find areas by worldId", async () => {
      // Arrange
      const worldId = "world-id-456";

      // Create mock areas directly without using Area.mock
      const mockAreas = [
        {
          _id: "area-id-1",
          name: "Test Area 1",
          description: "Test area description 1",
          worldId,
          tags: ["test"],
          createdAt: new Date(),
          updatedAt: new Date(),
          landmarks: [],
          connections: [],
        } as unknown as AreaModel,
        {
          _id: "area-id-2",
          name: "Test Area 2",
          description: "Test area description 2",
          worldId,
          tags: ["test"],
          createdAt: new Date(),
          updatedAt: new Date(),
          landmarks: [],
          connections: [],
        } as unknown as AreaModel,
      ];

      // Mock the find method to return our mock areas
      jest
        .spyOn(repository, "find")
        .mockResolvedValue(mockAreas as WithDocument<AreaModel>[]);

      // Act
      const result = await repository.findByWorldId(worldId);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { worldId },
        undefined,
        undefined
      );
      expect(result).toEqual(mockAreas);
      expect(result.length).toBe(2);
      expect(result[0].worldId).toBe(worldId);
      expect(result[1].worldId).toBe(worldId);
    });

    it("should pass projection and options to find method", async () => {
      // Arrange
      const worldId = "world-id-456";
      const projection = { name: 1, description: 1 };
      const options = { sort: { name: 1 } };

      // Mock the find method
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      await repository.findByWorldId(worldId, projection, options);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { worldId },
        projection,
        options
      );
    });

    it("should return empty array when no areas found", async () => {
      // Arrange
      const worldId = "nonexistent-world-id";

      // Mock the find method to return empty array
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      const result = await repository.findByWorldId(worldId);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { worldId },
        undefined,
        undefined
      );
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  // Adding tests for the methods inherited from DocumentRepository
  describe("create", () => {
    it("should create a new area", async () => {
      // Arrange
      const newAreaData = {
        worldId: "world-id-456",
        name: "New Test Area",
        description: "A new test area",
        landmarks: ["landmark1"],
        connections: ["connection1"],
        tags: ["test", "new"],
      };

      // Mock the model's insertMany method
      const mockInsertMany = jest.fn().mockResolvedValue([
        {
          ...newAreaData,
          _id: "new-area-id",
          createdAt: new Date(),
          updatedAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue(newAreaData),
        },
      ]);
      mockAreaModel.insertMany = mockInsertMany;

      // Act
      const result = await repository.create(newAreaData);

      // Assert
      expect(mockInsertMany).toHaveBeenCalled();
      expect(result).toBeDefined();
      // Type assertion since we know it's a single entity result
      const areaResult = result as WithDocument<AreaModel>;
      expect(areaResult._id).toBeDefined();
      expect(areaResult.worldId).toBe(newAreaData.worldId);
      expect(areaResult.name).toBe(newAreaData.name);
    });

    it("should throw error when trying to create an area with a non-existent world ID", async () => {
      // Arrange
      const newAreaData = {
        worldId: "non-existent-world-id",
        name: "Area with Invalid World",
        description: "This area references a world that doesn't exist",
        landmarks: [],
        connections: [],
        tags: ["test"],
      };

      // Mock the WorldModel.exists method to return null (world not found)
      mockWorldModel.exists = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(repository.create(newAreaData)).rejects.toThrow(
        'Referenced entity not found: worlds._id with value "non-existent-world-id"'
      );
    });

    it("should create multiple areas", async () => {
      // Arrange
      const newAreasData = [
        {
          worldId: "world-id-456",
          name: "New Test Area 1",
          description: "A new test area 1",
          landmarks: ["landmark1"],
          connections: ["connection1"],
          tags: ["test", "new"],
        },
        {
          worldId: "world-id-456",
          name: "New Test Area 2",
          description: "A new test area 2",
          landmarks: ["landmark2"],
          connections: ["connection2"],
          tags: ["test", "new"],
        },
      ];

      // Mock the model's insertMany method
      const mockInsertMany = jest.fn().mockResolvedValue(
        newAreasData.map((data, index) => ({
          ...data,
          _id: `new-area-id-${index + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue(data),
        }))
      );
      mockAreaModel.insertMany = mockInsertMany;

      // Act
      let result;
      try {
        result = await repository.create(newAreasData);
      } catch (error) {
        console.error("Error in create multiple areas test:", error);
        throw error; // Re-throw to fail the test with the original error
      }

      // Assert
      expect(mockInsertMany).toHaveBeenCalled();
      expect(result).toBeDefined();
      // Type assertion since we know it's a bulk response
      const bulkResult = result as BulkItemizedResponse<any, any>;
      expect(bulkResult.counts.success).toBe(2);
      expect(bulkResult.counts.fail).toBe(0);
      expect(
        bulkResult.items.success.length + bulkResult.items.fail.length
      ).toBe(2);
    });
  });

  describe("find", () => {
    it("should find areas by filter", async () => {
      // Arrange
      const filter = { tags: "test" };
      const mockAreas = [
        {
          _id: "area-id-1",
          worldId: "world-id-456",
          name: "Test Area 1",
          description: "Test area description 1",
          tags: ["test"],
          landmarks: [],
          connections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "area-id-2",
          worldId: "world-id-456",
          name: "Test Area 2",
          description: "Test area description 2",
          tags: ["test"],
          landmarks: [],
          connections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the model's find method
      const mockFind = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue(
        mockAreas.map((area) => ({
          ...area,
          save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue(area),
        }))
      );

      mockAreaModel.find = mockFind;
      mockAreaModel.exec = mockExec;

      // Act
      const result = await repository.find(filter);

      // Assert
      expect(mockFind).toHaveBeenCalledWith(filter);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Test Area 1");
      expect(result[1].name).toBe("Test Area 2");
    });

    it("should apply projection and options", async () => {
      // Arrange
      const filter = { tags: "test" };
      const projection = { name: 1, description: 1 };
      const options = { sort: { name: 1 }, limit: 10 };

      // Mock the model's methods
      const mockFind = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue([]);

      mockAreaModel.find = mockFind;
      mockAreaModel.sort = mockSort;
      mockAreaModel.limit = mockLimit;
      mockAreaModel.exec = mockExec;

      // Act
      await repository.find(filter, projection, options);

      // Assert
      expect(mockFind).toHaveBeenCalledWith(filter, projection);
      expect(mockSort).toHaveBeenCalledWith(options.sort);
      expect(mockLimit).toHaveBeenCalledWith(options.limit);
    });
  });

  describe("findOne", () => {
    it("should find a single area by filter", async () => {
      // Arrange
      const filter = { name: "Test Area" };
      const mockArea = {
        _id: "area-id-1",
        worldId: "world-id-456",
        name: "Test Area",
        description: "Test area description",
        tags: ["test"],
        landmarks: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn(),
      };

      // Mock the find method to return our mock area
      jest.spyOn(repository, "find").mockResolvedValue([mockArea as any]);

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(filter, undefined, {
        limit: 1,
      });
      expect(result).toEqual(mockArea);
    });

    it("should return null when no area is found", async () => {
      // Arrange
      const filter = { name: "Nonexistent Area" };

      // Mock the find method to return empty array
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(filter, undefined, {
        limit: 1,
      });
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find an area by ID", async () => {
      // Arrange
      const areaId = "area-id-123";
      const mockArea = {
        _id: areaId,
        worldId: "world-id-456",
        name: "Test Area",
        description: "Test area description",
        tags: ["test"],
        landmarks: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findOne method to return our mock area
      jest.spyOn(repository, "findOne").mockResolvedValue(mockArea as any);

      // Act
      const result = await repository.findById(areaId);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith(
        { _id: areaId },
        undefined
      );
      expect(result).toEqual(mockArea);
    });

    it("should return null when area with ID is not found", async () => {
      // Arrange
      const areaId = "nonexistent-id";

      // Mock the findOne method to return null
      jest.spyOn(repository, "findOne").mockResolvedValue(null);

      // Act
      const result = await repository.findById(areaId);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith(
        { _id: areaId },
        undefined
      );
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an area", async () => {
      // Arrange
      const areaToUpdate = {
        _id: "area-id-123",
        worldId: "world-id-456",
        name: "Updated Area Name",
        description: "Updated description",
        landmarks: ["landmark1", "landmark2", "landmark3"],
        connections: ["connection1", "connection2"],
        tags: ["test", "updated"],
      };

      // Mock the model's findById and bulkWrite methods
      const mockFindById = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue({
        ...areaToUpdate,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue(areaToUpdate),
      });
      const mockBulkWrite = jest.fn().mockResolvedValue({ ok: 1 });

      mockAreaModel.findById = mockFindById;
      mockAreaModel.exec = mockExec;
      mockAreaModel.bulkWrite = mockBulkWrite;
      mockAreaModel.find = jest.fn().mockReturnThis();

      // Act
      const result = await repository.update(areaToUpdate);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(areaToUpdate._id);
      expect(mockBulkWrite).toHaveBeenCalled();
      expect(result).toBeDefined();
      // Type assertion since we know it's a single entity result
      const areaResult = result as WithDocument<AreaModel>;
      expect(areaResult._id).toBe(areaToUpdate._id);
      expect(areaResult.name).toBe(areaToUpdate.name);
    });

    it("should throw error when trying to update an area with a non-existent world ID", async () => {
      // Arrange
      const areaToUpdate = {
        _id: "area-id-123",
        worldId: "non-existent-world-id",
        name: "Area with Invalid World",
        description: "This area references a world that doesn't exist",
        landmarks: [],
        connections: [],
        tags: ["test"],
      };

      // Mock the model's findById method to return the area
      const mockFindById = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue({
        ...areaToUpdate,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue(areaToUpdate),
      });
      mockAreaModel.findById = mockFindById;
      mockAreaModel.exec = mockExec;

      // Mock the WorldModel.exists method to return null (world not found)
      mockWorldModel.exists = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(repository.update(areaToUpdate)).rejects.toThrow(
        'Referenced entity not found: worlds._id with value "non-existent-world-id"'
      );
    });

    it("should return null when area to update is not found", async () => {
      // Arrange
      const areaToUpdate = {
        _id: "nonexistent-id",
        worldId: "world-id-456",
        name: "Updated Area Name",
        description: "Updated description",
        landmarks: [],
        connections: [],
        tags: ["test", "updated"],
      };

      // Mock the model's findById method to return null
      const mockFindById = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue(null);

      mockAreaModel.findById = mockFindById;
      mockAreaModel.exec = mockExec;

      // Act
      const result = await repository.update(areaToUpdate);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(areaToUpdate._id);
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an area by ID", async () => {
      // Arrange
      const areaId = "area-id-123";

      // Mock the model's findById and deleteMany methods
      const mockFindById = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue({
        _id: areaId,
        name: "Test Area",
      });
      const mockDeleteMany = jest.fn().mockReturnThis();
      const mockDeleteExec = jest.fn().mockResolvedValue({ deletedCount: 1 });

      mockAreaModel.findById = mockFindById;
      mockAreaModel.exec = mockExec;
      mockAreaModel.deleteMany = mockDeleteMany;
      mockAreaModel.exec = mockDeleteExec;

      // Act
      const result = await repository.delete(areaId);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(areaId);
      expect(mockDeleteMany).toHaveBeenCalledWith({ _id: { $in: [areaId] } });
      expect(result).toBe(true);
    });

    it("should return null when area to delete is not found", async () => {
      // Arrange
      const areaId = "nonexistent-id";

      // Mock the model's findById method to return null
      const mockFindById = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue(null);

      mockAreaModel.findById = mockFindById;
      mockAreaModel.exec = mockExec;

      // Act
      const result = await repository.delete(areaId);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(areaId);
      expect(result).toBeNull();
    });

    it("should delete multiple areas by IDs", async () => {
      // Arrange
      const areaIds = ["area-id-1", "area-id-2"];

      // Mock the model's deleteMany method
      const mockDeleteMany = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 2 });

      mockAreaModel.deleteMany = mockDeleteMany;
      mockAreaModel.exec = mockExec;

      // Act
      const result = await repository.delete(areaIds);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith({ _id: { $in: areaIds } });
      expect(result).toBeDefined();
      // Type assertion since we know it's a bulk response
      const bulkResult = result as BulkCountedResponse;
      expect(bulkResult.counts.success).toBe(2);
    });
  });
});
