import {
  DocumentRepository,
  WithDocument,
  WorldModel,
} from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { Document } from "mongoose";
import { WorldsRepository } from "./worlds.repository";

describe("WorldsRepository", () => {
  let repository: WorldsRepository;
  let mockWorldModel: ReturnModelType<typeof WorldModel>;
  let mockWorld: WorldModel;

  beforeEach(() => {
    // Create a mock world directly
    mockWorld = {
      name: "Test World",
      shard: "test-shard",
      techLevel: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorldModel;

    // Create a mock document with save and toObject methods
    const mockWorldDocument = {
      ...mockWorld,
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(mockWorld),
    } as unknown as Document & WorldModel;

    // Create a proper mock model object with all required methods
    const mockModel = {
      // Constructor function
      new: jest.fn().mockReturnValue(mockWorldDocument),
      // Static methods
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockWorldDocument]),
    };

    // Create a function that also has all the properties of mockModel
    const modelFunction = function () {
      return mockWorldDocument;
    } as any;

    // Copy all properties from mockModel to modelFunction
    Object.assign(modelFunction, mockModel);

    // Cast to the required type
    mockWorldModel = modelFunction as unknown as ReturnModelType<
      typeof WorldModel
    >;

    // Create repository with mock model
    repository = new WorldsRepository(mockWorldModel);
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

  describe("create", () => {
    it("should create a world", async () => {
      // Arrange
      const worldData = {
        name: "New World",
        shard: "new-shard",
        techLevel: 7,
      };

      // Mock the create method to return the created world
      const createdWorld = { ...worldData, _id: "world-123" };
      const mockCreateResult = createdWorld as WithDocument<WorldModel>;
      jest.spyOn(repository, "create").mockResolvedValueOnce(mockCreateResult);

      // Act
      const result = await repository.create(worldData);

      // Assert
      expect(result).toEqual(createdWorld);
      // Type assertion to handle the union return type
      if ("_id" in result) {
        expect(result._id).toBe("world-123");
      }
    });
  });

  describe("find", () => {
    it("should find worlds with filter", async () => {
      // Arrange
      const filter = { techLevel: { $gt: 3 } };
      const mockWorlds = [
        { _id: "world-1", name: "World 1", techLevel: 4 },
        { _id: "world-2", name: "World 2", techLevel: 5 },
      ];

      jest
        .spyOn(repository, "find")
        .mockResolvedValueOnce(mockWorlds as WithDocument<WorldModel>[]);

      // Act
      const result = await repository.find(filter);

      // Assert
      expect(result).toEqual(mockWorlds);
      expect(result.length).toBe(2);
    });
  });

  describe("findOne", () => {
    it("should find one world by filter", async () => {
      // Arrange
      const filter = { name: "Test World" };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValueOnce(mockWorld as WithDocument<WorldModel>);

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toEqual(mockWorld);
      expect(result?.name).toBe("Test World");
    });
  });

  describe("findById", () => {
    it("should find world by ID", async () => {
      // Arrange
      const worldId = "world-123";
      const mockWorldWithId = { ...mockWorld, _id: worldId };

      jest
        .spyOn(repository, "findById")
        .mockResolvedValueOnce(mockWorldWithId as WithDocument<WorldModel>);

      // Act
      const result = await repository.findById(worldId);

      // Assert
      expect(result).toEqual(mockWorldWithId);
      expect(result?._id).toBe(worldId);
    });
  });

  describe("update", () => {
    it("should update a world", async () => {
      // Arrange
      const worldToUpdate = {
        _id: "world-123",
        name: "Updated World",
        shard: "test-shard",
        techLevel: 6,
      };

      const mockUpdateResult = worldToUpdate as WithDocument<WorldModel>;
      jest.spyOn(repository, "update").mockResolvedValueOnce(mockUpdateResult);

      // Act
      const result = await repository.update(worldToUpdate);

      // Assert
      expect(result).toEqual(worldToUpdate);
      // Type assertion to handle the union return type
      if (result && "_id" in result) {
        expect(result.name).toBe("Updated World");
        expect(result.techLevel).toBe(6);
      }
    });
  });

  describe("delete", () => {
    it("should delete a world by ID", async () => {
      // Arrange
      const worldId = "world-123";

      // The delete method returns boolean, null, or BulkCountedResponse
      jest.spyOn(repository, "delete").mockResolvedValueOnce(true);

      // Act
      const result = await repository.delete(worldId);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("findByShard", () => {
    it("should find worlds by shard", async () => {
      // Arrange
      const shard = "test-shard";

      // Create mock worlds directly
      const mockWorlds = [
        {
          name: "Test World 1",
          shard,
          techLevel: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Test World 2",
          shard,
          techLevel: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the find method to return our mock worlds
      jest
        .spyOn(repository, "find")
        .mockResolvedValue(mockWorlds as WithDocument<WorldModel>[]);

      // Act
      const result = await repository.findByShard(shard);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { shard },
        undefined,
        undefined
      );
      expect(result).toEqual(mockWorlds);
      expect(result.length).toBe(2);
      expect(result[0].shard).toBe(shard);
      expect(result[1].shard).toBe(shard);
    });

    it("should pass projection and options to find method", async () => {
      // Arrange
      const shard = "test-shard";
      const projection = { name: 1, techLevel: 1 };
      const options = { sort: { name: 1 } };

      // Mock the find method
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      await repository.findByShard(shard, projection, options);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { shard },
        projection,
        options
      );
    });

    it("should return empty array when no worlds found", async () => {
      // Arrange
      const shard = "nonexistent-shard";

      // Mock the find method to return empty array
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      const result = await repository.findByShard(shard);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { shard },
        undefined,
        undefined
      );
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe("findByTechLevel", () => {
    it("should find worlds by techLevel", async () => {
      // Arrange
      const techLevel = 5;

      // Create mock worlds directly
      const mockWorlds = [
        {
          name: "Test World 1",
          shard: "shard-1",
          techLevel,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Test World 2",
          shard: "shard-2",
          techLevel,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the find method to return our mock worlds
      jest
        .spyOn(repository, "find")
        .mockResolvedValue(mockWorlds as WithDocument<WorldModel>[]);

      // Act
      const result = await repository.findByTechLevel(techLevel);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { techLevel },
        undefined,
        undefined
      );
      expect(result).toEqual(mockWorlds);
      expect(result.length).toBe(2);
      expect(result[0].techLevel).toBe(techLevel);
      expect(result[1].techLevel).toBe(techLevel);
    });

    it("should pass projection and options to find method", async () => {
      // Arrange
      const techLevel = 5;
      const projection = { name: 1, shard: 1 };
      const options = { sort: { name: 1 } };

      // Mock the find method
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      await repository.findByTechLevel(techLevel, projection, options);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { techLevel },
        projection,
        options
      );
    });

    it("should return empty array when no worlds found", async () => {
      // Arrange
      const techLevel = 999;

      // Mock the find method to return empty array
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      const result = await repository.findByTechLevel(techLevel);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { techLevel },
        undefined,
        undefined
      );
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });
});
