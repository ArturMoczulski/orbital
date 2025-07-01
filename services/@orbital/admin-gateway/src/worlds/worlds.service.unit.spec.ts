import { Test } from "@nestjs/testing";
import { World } from "@orbital/core";
import { WorldMicroservice } from "@orbital/world-rpc";
import { WorldsService } from "./worlds.service";

// Create a mock for the WorldMicroservice
const mockWorldMicroservice = {
  worlds: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByShard: jest.fn(),
    findByTechLevel: jest.fn(),
  },
};

describe("WorldsService", () => {
  let service: WorldsService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorldsService,
        {
          provide: WorldMicroservice,
          useValue: mockWorldMicroservice,
        },
      ],
    }).compile();

    service = moduleRef.get<WorldsService>(WorldsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("find", () => {
    it("should return an array of worlds", async () => {
      // Mock data using World.mock()
      const mockWorlds = [
        World.mock({
          _id: "world1",
          name: "Test World 1",
          shard: "shard1",
          techLevel: 5,
        }),
        World.mock({
          _id: "world2",
          name: "Test World 2",
          shard: "shard1",
          techLevel: 3,
        }),
      ];

      // Setup mock implementation
      mockWorldMicroservice.worlds.find.mockResolvedValue(mockWorlds);

      // Call the service method
      const result = await service.find();

      // Verify the result
      expect(result).toEqual(mockWorlds);
      expect(mockWorldMicroservice.worlds.find).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.find).toHaveBeenCalledWith({
        filter: {},
        projection: {},
        options: {},
      });
    });

    it("should return an empty array if the microservice returns null or undefined", async () => {
      // Setup mock implementation
      mockWorldMicroservice.worlds.find.mockResolvedValue(null);

      // Call the service method
      const result = await service.find();

      // Verify the result
      expect(result).toEqual([]);
      expect(mockWorldMicroservice.worlds.find).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.worlds.find.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.find()).rejects.toThrow("Microservice error");
      expect(mockWorldMicroservice.worlds.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("should return a single world by id", async () => {
      // Mock data using World.mock()
      const mockWorld = World.mock({
        _id: "world1",
        name: "Test World 1",
        shard: "shard1",
        techLevel: 5,
      });

      // Setup mock implementation
      mockWorldMicroservice.worlds.findById.mockResolvedValue(mockWorld);

      // Call the service method
      const result = await service.findById("world1");

      // Verify the result
      expect(result).toEqual(mockWorld);
      expect(mockWorldMicroservice.worlds.findById).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.findById).toHaveBeenCalledWith({
        id: "world1",
        projection: {},
      });
    });

    it("should throw an error if the world is not found", async () => {
      // Setup mock implementation
      mockWorldMicroservice.worlds.findById.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(service.findById("nonexistent")).rejects.toThrow(
        "World not found"
      );
      expect(mockWorldMicroservice.worlds.findById).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.findById).toHaveBeenCalledWith({
        id: "nonexistent",
        projection: {},
      });
    });

    it("should handle errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.worlds.findById.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.findById("world1")).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.worlds.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe("findByShard", () => {
    it("should return worlds filtered by shard", async () => {
      const shard = "shard1";
      // Mock data using World.mock()
      const mockWorlds = [
        World.mock({
          _id: "world1",
          name: "Test World 1",
          shard,
          techLevel: 5,
        }),
        World.mock({
          _id: "world2",
          name: "Test World 2",
          shard,
          techLevel: 3,
        }),
      ];

      // Setup mock implementation
      mockWorldMicroservice.worlds.findByShard.mockResolvedValue(mockWorlds);

      // Call the service method
      const result = await service.findByShard(shard);

      // Verify the result
      expect(result).toEqual(mockWorlds);
      expect(mockWorldMicroservice.worlds.findByShard).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.findByShard).toHaveBeenCalledWith({
        shard,
        projection: {},
        options: {},
      });
    });

    it("should return an empty array if no worlds are found for the shard", async () => {
      const shard = "nonexistent-shard";
      // Setup mock implementation
      mockWorldMicroservice.worlds.findByShard.mockResolvedValue(null);

      // Call the service method
      const result = await service.findByShard(shard);

      // Verify the result
      expect(result).toEqual([]);
      expect(mockWorldMicroservice.worlds.findByShard).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from the microservice", async () => {
      const shard = "shard1";
      // Setup mock implementation
      mockWorldMicroservice.worlds.findByShard.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.findByShard(shard)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.worlds.findByShard).toHaveBeenCalledTimes(1);
    });
  });

  describe("findByTechLevel", () => {
    it("should return worlds filtered by techLevel", async () => {
      const techLevel = 5;
      // Mock data using World.mock()
      const mockWorlds = [
        World.mock({
          _id: "world1",
          name: "Test World 1",
          shard: "shard1",
          techLevel,
        }),
        World.mock({
          _id: "world3",
          name: "Test World 3",
          shard: "shard2",
          techLevel,
        }),
      ];

      // Setup mock implementation
      mockWorldMicroservice.worlds.findByTechLevel.mockResolvedValue(
        mockWorlds
      );

      // Call the service method
      const result = await service.findByTechLevel(techLevel);

      // Verify the result
      expect(result).toEqual(mockWorlds);
      expect(
        mockWorldMicroservice.worlds.findByTechLevel
      ).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.findByTechLevel).toHaveBeenCalledWith(
        {
          techLevel,
          projection: {},
          options: {},
        }
      );
    });

    it("should return an empty array if no worlds are found for the techLevel", async () => {
      const techLevel = 99;
      // Setup mock implementation
      mockWorldMicroservice.worlds.findByTechLevel.mockResolvedValue(null);

      // Call the service method
      const result = await service.findByTechLevel(techLevel);

      // Verify the result
      expect(result).toEqual([]);
      expect(
        mockWorldMicroservice.worlds.findByTechLevel
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from the microservice", async () => {
      const techLevel = 5;
      // Setup mock implementation
      mockWorldMicroservice.worlds.findByTechLevel.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.findByTechLevel(techLevel)).rejects.toThrow(
        "Microservice error"
      );
      expect(
        mockWorldMicroservice.worlds.findByTechLevel
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("create", () => {
    it("should create a new world", async () => {
      // Mock data
      const createWorldDto = {
        name: "New Test World",
        shard: "shard1",
        techLevel: 7,
      };

      const createdWorld = World.mock({
        _id: "new-world",
        name: createWorldDto.name,
        shard: createWorldDto.shard,
        techLevel: createWorldDto.techLevel,
      });

      // Setup mock implementation
      mockWorldMicroservice.worlds.create.mockResolvedValue(createdWorld);

      // Call the service method
      const result = await service.create(createWorldDto);

      // Verify the result
      expect(result).toEqual(createdWorld);
      expect(mockWorldMicroservice.worlds.create).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.create).toHaveBeenCalledWith(
        createWorldDto
      );
    });

    it("should handle errors from the microservice", async () => {
      // Mock data
      const createWorldDto = {
        name: "New Test World",
        shard: "shard1",
        techLevel: 7,
      };

      // Setup mock implementation
      mockWorldMicroservice.worlds.create.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.create(createWorldDto)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.worlds.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("should update an existing world", async () => {
      // Mock data
      const worldId = "world1";
      const updateWorldDto = {
        name: "Updated Test World",
        techLevel: 8,
      };

      const updatedWorld = World.mock({
        _id: worldId,
        name: "Updated Test World",
        shard: "shard1",
        techLevel: 8,
      });

      // Setup mock implementation
      mockWorldMicroservice.worlds.update.mockResolvedValue(updatedWorld);

      // Call the service method
      const result = await service.update(worldId, updateWorldDto);

      // Verify the result
      expect(result).toEqual(updatedWorld);
      expect(mockWorldMicroservice.worlds.update).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.update).toHaveBeenCalledWith({
        _id: worldId,
        ...updateWorldDto,
      });
    });

    it("should handle errors from the microservice", async () => {
      // Mock data
      const worldId = "world1";
      const updateWorldDto = {
        name: "Updated Test World",
      };

      // Setup mock implementation
      mockWorldMicroservice.worlds.update.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.update(worldId, updateWorldDto)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.worlds.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("should delete a world", async () => {
      // Mock data
      const worldId = "world1";
      const deletedWorld = World.mock({
        _id: worldId,
        name: "Test World",
        shard: "shard1",
        techLevel: 5,
      });

      // Setup mock implementation
      mockWorldMicroservice.worlds.delete.mockResolvedValue(deletedWorld);

      // Call the service method
      const result = await service.delete(worldId);

      // Verify the result
      expect(result).toEqual(deletedWorld);
      expect(mockWorldMicroservice.worlds.delete).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.worlds.delete).toHaveBeenCalledWith(worldId);
    });

    it("should handle errors from the microservice", async () => {
      // Mock data
      const worldId = "world1";

      // Setup mock implementation
      mockWorldMicroservice.worlds.delete.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.delete(worldId)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.worlds.delete).toHaveBeenCalledTimes(1);
    });
  });
});
