import { Test } from "@nestjs/testing";
import { Area, Position } from "@orbital/core";
import { WorldMicroservice } from "@orbital/world-rpc";
import { AreasService } from "./areas.service";

// Create a mock for the WorldMicroservice
const mockWorldMicroservice = {
  areas: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByWorldId: jest.fn(),
  },
};

describe("AreasService", () => {
  let service: AreasService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AreasService,
        {
          provide: WorldMicroservice,
          useValue: mockWorldMicroservice,
        },
      ],
    }).compile();

    service = moduleRef.get<AreasService>(AreasService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("find", () => {
    it("should return an array of areas", async () => {
      // Mock data using Area.mock()
      const mockAreas = [
        Area.mock({
          _id: "area1",
          name: "Test Area 1",
          worldId: "world1",
          position: new Position({ x: 0, y: 0, z: 0 }),
        }),
        Area.mock({
          _id: "area2",
          name: "Test Area 2",
          worldId: "world1",
          position: new Position({ x: 10, y: 10, z: 0 }),
        }),
      ];

      // Setup mock implementation
      mockWorldMicroservice.areas.find.mockResolvedValue(mockAreas);

      // Call the service method
      const result = await service.find();

      // Verify the result
      expect(result).toEqual(mockAreas);
      expect(mockWorldMicroservice.areas.find).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.areas.find).toHaveBeenCalledWith({
        filter: {},
        projection: {},
        options: {},
      });
    });

    it("should return an empty array if the microservice returns null or undefined", async () => {
      // Setup mock implementation
      mockWorldMicroservice.areas.find.mockResolvedValue(null);

      // Call the service method
      const result = await service.find();

      // Verify the result
      expect(result).toEqual([]);
      expect(mockWorldMicroservice.areas.find).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.areas.find.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.find()).rejects.toThrow("Microservice error");
      expect(mockWorldMicroservice.areas.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("should return a single area by id", async () => {
      // Mock data using Area.mock()
      const mockArea = Area.mock({
        _id: "area1",
        name: "Test Area 1",
        worldId: "world1",
        position: new Position({ x: 0, y: 0, z: 0 }),
      });

      // Setup mock implementation
      mockWorldMicroservice.areas.findById.mockResolvedValue(mockArea);

      // Call the service method
      const result = await service.findById("area1");

      // Verify the result
      expect(result).toEqual(mockArea);
      expect(mockWorldMicroservice.areas.findById).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.areas.findById).toHaveBeenCalledWith({
        id: "area1",
        projection: {},
      });
    });

    it("should throw an error if the area is not found", async () => {
      // Setup mock implementation
      mockWorldMicroservice.areas.findById.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(service.findById("nonexistent")).rejects.toThrow(
        "Area not found"
      );
      expect(mockWorldMicroservice.areas.findById).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.areas.findById).toHaveBeenCalledWith({
        id: "nonexistent",
        projection: {},
      });
    });

    it("should handle errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.areas.findById.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.findById("area1")).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.areas.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe("findByWorldId", () => {
    it("should return areas filtered by worldId", async () => {
      const worldId = "world1";
      // Mock data using Area.mock()
      const mockAreas = [
        Area.mock({
          _id: "area1",
          name: "Test Area 1",
          worldId,
          position: new Position({ x: 0, y: 0, z: 0 }),
        }),
        Area.mock({
          _id: "area2",
          name: "Test Area 2",
          worldId,
          position: new Position({ x: 10, y: 10, z: 0 }),
        }),
      ];

      // Setup mock implementation
      mockWorldMicroservice.areas.findByWorldId.mockResolvedValue(mockAreas);

      // Call the service method
      const result = await service.findByWorldId(worldId);

      // Verify the result
      expect(result).toEqual(mockAreas);
      expect(mockWorldMicroservice.areas.findByWorldId).toHaveBeenCalledTimes(
        1
      );
      expect(mockWorldMicroservice.areas.findByWorldId).toHaveBeenCalledWith({
        worldId,
        projection: {},
        options: {},
      });
    });

    it("should return an empty array if no areas are found for the worldId", async () => {
      const worldId = "nonexistent-world";
      // Setup mock implementation
      mockWorldMicroservice.areas.findByWorldId.mockResolvedValue(null);

      // Call the service method
      const result = await service.findByWorldId(worldId);

      // Verify the result
      expect(result).toEqual([]);
      expect(mockWorldMicroservice.areas.findByWorldId).toHaveBeenCalledTimes(
        1
      );
    });

    it("should handle errors from the microservice", async () => {
      const worldId = "world1";
      // Setup mock implementation
      mockWorldMicroservice.areas.findByWorldId.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.findByWorldId(worldId)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.areas.findByWorldId).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe("create", () => {
    it("should create a new area", async () => {
      // Mock data
      const createAreaDto = {
        name: "New Test Area",
        worldId: "world1",
        position: new Position({ x: 20, y: 20, z: 0 }),
        description: "A test area",
      };

      const createdArea = Area.mock({
        _id: "new-area",
        name: createAreaDto.name,
        worldId: createAreaDto.worldId,
        position: new Position(createAreaDto.position),
      });
      createdArea.description = createAreaDto.description;

      // Setup mock implementation
      mockWorldMicroservice.areas.create.mockResolvedValue(createdArea);

      // Call the service method
      const result = await service.create(createAreaDto);

      // Verify the result
      expect(result).toEqual(createdArea);
      expect(mockWorldMicroservice.areas.create).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.areas.create).toHaveBeenCalledWith(
        createAreaDto
      );
    });

    it("should handle errors from the microservice", async () => {
      // Mock data
      const createAreaDto = {
        name: "New Test Area",
        worldId: "world1",
        position: { x: 20, y: 20, z: 0 },
      };

      // Setup mock implementation
      mockWorldMicroservice.areas.create.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.create(createAreaDto)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.areas.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("should update an existing area", async () => {
      // Mock data
      const areaId = "area1";
      const updateAreaDto = {
        name: "Updated Test Area",
        description: "Updated description",
      };

      const updatedArea = Area.mock({
        _id: areaId,
        name: "Updated Test Area",
        worldId: "world1",
        position: new Position({ x: 0, y: 0, z: 0 }),
      });
      updatedArea.description = "Updated description";

      // Setup mock implementation
      mockWorldMicroservice.areas.update.mockResolvedValue(updatedArea);

      // Call the service method
      const result = await service.update(areaId, updateAreaDto);

      // Verify the result
      expect(result).toEqual(updatedArea);
      expect(mockWorldMicroservice.areas.update).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.areas.update).toHaveBeenCalledWith({
        _id: areaId,
        ...updateAreaDto,
      });
    });

    it("should handle errors from the microservice", async () => {
      // Mock data
      const areaId = "area1";
      const updateAreaDto = {
        name: "Updated Test Area",
      };

      // Setup mock implementation
      mockWorldMicroservice.areas.update.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.update(areaId, updateAreaDto)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.areas.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("should delete an area", async () => {
      // Mock data
      const areaId = "area1";
      const deletedArea = Area.mock({
        _id: areaId,
        name: "Test Area",
        worldId: "world1",
        position: new Position({ x: 0, y: 0, z: 0 }),
      });

      // Setup mock implementation
      mockWorldMicroservice.areas.delete.mockResolvedValue(deletedArea);

      // Call the service method
      const result = await service.delete(areaId);

      // Verify the result
      expect(result).toEqual(deletedArea);
      expect(mockWorldMicroservice.areas.delete).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.areas.delete).toHaveBeenCalledWith(areaId);
    });

    it("should handle errors from the microservice", async () => {
      // Mock data
      const areaId = "area1";

      // Setup mock implementation
      mockWorldMicroservice.areas.delete.mockRejectedValue(
        new Error("Microservice error")
      );

      // Call the service method and expect it to throw
      await expect(service.delete(areaId)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.areas.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("getMap", () => {
    it("should return a map for the area", async () => {
      // Mock data
      const areaId = "area1";

      // Call the service method
      const result = await service.getMap(areaId);

      // Verify the result
      expect(result).toHaveProperty("_id", areaId);
      expect(result).toHaveProperty("width", 64);
      expect(result).toHaveProperty("height", 64);
      expect(result).toHaveProperty("grid");
      expect(Array.isArray(result.grid)).toBe(true);
      expect(result.grid.length).toBe(64); // Height
      expect(result.grid[0].length).toBe(64); // Width
    });
  });
});
