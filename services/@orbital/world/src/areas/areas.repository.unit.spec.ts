import {
  AreaModel,
  DocumentRepository,
  WithDocument,
} from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { Document } from "mongoose";
import { AreasRepository } from "./areas.repository";

describe("AreasRepository", () => {
  let repository: AreasRepository;
  let mockAreaModel: ReturnModelType<typeof AreaModel>;
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

    // Create repository with mock model
    repository = new AreasRepository(mockAreaModel);
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

  // Since AreasRepository extends DocumentRepository, we don't need to test
  // all the inherited methods as they are tested in document-repository.spec.ts
  // We just need to ensure our custom methods work correctly
});
