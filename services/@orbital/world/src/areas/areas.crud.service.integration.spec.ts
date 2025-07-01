import { Test, TestingModule } from "@nestjs/testing";
import { AreaModel, WithDocument, WorldModel } from "@orbital/typegoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Model } from "mongoose";
import { getModelToken, TypegooseModule } from "nestjs-typegoose";
import { AreasCRUDService } from "./areas.crud.service";
import { AreasRepository } from "./areas.repository";

describe("AreasCRUDService Integration", () => {
  let service: AreasCRUDService;
  let repository: AreasRepository;
  let mongod: MongoMemoryServer;
  let areaModel: Model<AreaModel>;
  let worldModel: Model<WorldModel>;
  let module: TestingModule;

  // Use a longer timeout for MongoDB setup
  jest.setTimeout(30000);

  beforeAll(async () => {
    try {
      // Create an in-memory MongoDB server
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      // Connect to the in-memory database
      await mongoose.connect(uri);

      // Set up the test module with TypegooseModule
      module = await Test.createTestingModule({
        imports: [
          TypegooseModule.forRoot(uri),
          TypegooseModule.forFeature([AreaModel, WorldModel]),
        ],
        providers: [AreasCRUDService, AreasRepository],
      }).compile();

      // Get the service, repository, and model
      service = module.get<AreasCRUDService>(AreasCRUDService);
      repository = module.get<AreasRepository>(AreasRepository);
      areaModel = module.get<Model<AreaModel>>(getModelToken(AreaModel.name));
      worldModel = module.get<Model<WorldModel>>(
        getModelToken(WorldModel.name)
      );
    } catch (error) {
      console.error("Error in beforeAll:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up resources - proper shutdown sequence
      if (module) {
        await module.close();
      }

      // Disconnect from mongoose before closing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Stop the in-memory server
      if (mongod) {
        await mongod.stop();
      }
    } catch (error) {
      console.error("Error in afterAll:", error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clear only the areas collection instead of dropping the entire database
    if (mongoose.connection.readyState === 1) {
      await areaModel.deleteMany({});
    }
  });

  describe("findByWorldId", () => {
    it("should find areas by worldId", async () => {
      // Arrange - Create test areas
      const worldId = "test-world-id";
      const otherWorldId = "other-world-id";

      // Create areas directly using the model
      await areaModel.create([
        {
          _id: "area-1",
          name: "Area 1",
          description: "Test area 1",
          worldId,
          tags: ["test"],
        },
        {
          _id: "area-2",
          name: "Area 2",
          description: "Test area 2",
          worldId,
          tags: ["test"],
        },
        {
          _id: "area-3",
          name: "Area 3",
          description: "Test area 3",
          worldId: otherWorldId,
          tags: ["test"],
        },
      ]);

      // Act - Find areas by worldId
      const result = await service.findByWorldId(worldId);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].worldId).toBe(worldId);
      expect(result[1].worldId).toBe(worldId);
      expect(result.map((area) => area._id).sort()).toEqual(
        ["area-1", "area-2"].sort()
      );
    });

    it("should return empty array when no areas found", async () => {
      // Arrange - No areas in the database

      // Act
      const result = await service.findByWorldId("nonexistent-world-id");

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should apply projection when provided", async () => {
      // Arrange - Create a test area
      const worldId = "test-world-id";

      // Create area directly using the model
      await areaModel.create({
        _id: "area-1",
        name: "Area 1",
        description: "Test area 1",
        worldId,
        tags: ["test"],
      });

      // Act - Find area with projection
      // Include worldId in the projection since it's required by the Area model
      const result = await service.findByWorldId(worldId, {
        name: 1,
        _id: 1,
        worldId: 1, // Include worldId in the projection
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe("area-1");
      expect(result[0].name).toBe("Area 1");
      // Check for empty string instead of undefined
      expect(result[0].description).toBe("");
    });

    it("should apply options when provided", async () => {
      // Arrange - Create test areas
      const worldId = "test-world-id";

      // Create areas directly using the model
      await areaModel.create([
        {
          _id: "area-1",
          name: "B Area",
          description: "Test area B",
          worldId,
          tags: ["test"],
        },
        {
          _id: "area-2",
          name: "A Area",
          description: "Test area A",
          worldId,
          tags: ["test"],
        },
      ]);

      // Act - Find areas with sort option
      const result = await service.findByWorldId(worldId, undefined, {
        sort: { name: 1 },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("A Area");
      expect(result[1].name).toBe("B Area");
    });
  });

  // Test inherited CRUD methods to ensure they work with our specific entity
  describe("inherited CRUD methods", () => {
    it("should find areas with find method", async () => {
      // Arrange - Create test areas
      await areaModel.create([
        {
          _id: "area-1",
          name: "Area 1",
          description: "Test area 1",
          worldId: "world-1",
          tags: ["test"],
        },
        {
          _id: "area-2",
          name: "Area 2",
          description: "Test area 2",
          worldId: "world-2",
          tags: ["test"],
        },
      ]);

      // Act - Use the find method which should be inherited from CRUDService
      const result = await service.find({});

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result.map((area) => area._id).sort()).toEqual(
        ["area-1", "area-2"].sort()
      );
    });

    it("should find an area by id", async () => {
      // Arrange - Create area directly using the model
      await areaModel.create({
        _id: "find-area-id",
        name: "Find Area",
        description: "An area to find",
        worldId: "test-world-id",
        tags: ["test", "find"],
      });

      // Act
      const result = await service.findById("find-area-id");

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe("find-area-id");
      expect(result?.name).toBe("Find Area");
    });
  });
  // Test suite for world reference validation through the service layer
  describe("world reference validation", () => {
    beforeEach(async () => {
      // Clear the areas and worlds collections before each test
      if (mongoose.connection.readyState === 1) {
        await areaModel.deleteMany({});
        await worldModel.deleteMany({});
      }
    });

    it("should create an area with a valid world reference", async () => {
      // Arrange - Create a world first
      const worldId = "valid-world-id";
      await worldModel.create({
        _id: worldId,
        name: "Test World",
        description: "A test world",
        techLevel: 5,
        shard: "test-shard",
      });

      // Create area data with reference to the valid world
      const areaData = {
        name: "Test Area",
        description: "An area with valid world reference",
        worldId,
        tags: ["test"],
        landmarks: [],
        connections: [],
      };

      // Act - Create the area using the service
      const result = await service.create(areaData);

      // Assert
      expect(result).toBeDefined();
      // Type assertion to handle the union type
      const createdArea = result as WithDocument<AreaModel>;
      expect(createdArea._id).toBeDefined();
      expect(createdArea.worldId).toBe(worldId);

      // Verify the area was saved to the database
      const savedArea = await areaModel.findById(createdArea._id);
      expect(savedArea).toBeDefined();
      expect(savedArea?.worldId).toBe(worldId);
    });

    it("should reject creating an area with an invalid world reference", async () => {
      // Arrange - No world created, so the reference will be invalid
      const nonExistentWorldId = "non-existent-world-id";

      // Create area data with reference to a non-existent world
      const areaData = {
        name: "Test Area",
        description: "An area with invalid world reference",
        worldId: nonExistentWorldId,
        tags: ["test"],
        landmarks: [],
        connections: [],
      };

      // Act & Assert - Expect the creation to be rejected
      await expect(service.create(areaData)).rejects.toThrow();

      // Since we don't know the ID that would have been assigned, we can verify
      // by checking that no areas with this name exist
      const savedAreas = await areaModel.find({ name: areaData.name });
      expect(savedAreas.length).toBe(0);
    });

    it("should update an area with a valid world reference", async () => {
      // Arrange - Create a world and an area
      const originalWorldId = "original-world-id";
      const newWorldId = "new-world-id";

      // Create both worlds
      await worldModel.create([
        {
          _id: originalWorldId,
          name: "Original World",
          description: "The original world",
          techLevel: 3,
          shard: "test-shard-1",
        },
        {
          _id: newWorldId,
          name: "New World",
          description: "The new world",
          techLevel: 4,
          shard: "test-shard-2",
        },
      ]);

      // Create the area with the original world
      const areaId = "update-test-area";
      await areaModel.create({
        _id: areaId,
        name: "Update Test Area",
        description: "An area to test updating references",
        worldId: originalWorldId,
        tags: ["test"],
      });

      // Act - Update the area with a new valid world reference
      const updateResult = await service.update({
        _id: areaId,
        worldId: newWorldId,
        name: "Update Test Area", // Include required fields
        description: "An area to test updating references",
        landmarks: [],
        connections: [],
        tags: ["test"],
      });

      // Assert
      expect(updateResult).toBeDefined();
      // Type assertion to handle the union type
      const updatedResult = updateResult as WithDocument<AreaModel>;
      expect(updatedResult.worldId).toBe(newWorldId);

      // Verify the area was updated in the database
      const updatedArea = await areaModel.findById(areaId);
      expect(updatedArea).toBeDefined();
      expect(updatedArea?.worldId).toBe(newWorldId);
    });

    it("should reject updating an area with an invalid world reference", async () => {
      // Arrange - Create a world and an area
      const originalWorldId = "original-world-id";
      const nonExistentWorldId = "non-existent-world-id";

      // Create the original world
      await worldModel.create({
        _id: originalWorldId,
        name: "Original World",
        description: "The original world",
        techLevel: 3,
        shard: "test-shard-1",
      });

      // Create the area with the original world
      const areaId = "update-test-area";
      await areaModel.create({
        _id: areaId,
        name: "Update Test Area",
        description: "An area to test updating references",
        worldId: originalWorldId,
        tags: ["test"],
      });

      // Act & Assert - Expect the update to be rejected
      await expect(
        service.update({
          _id: areaId,
          worldId: nonExistentWorldId,
          name: "Update Test Area", // Include required fields
          description: "An area to test updating references",
          landmarks: [],
          connections: [],
          tags: ["test"],
        })
      ).rejects.toThrow();

      // Verify the area was not updated in the database
      const updatedArea = await areaModel.findById(areaId);
      expect(updatedArea).toBeDefined();
      expect(updatedArea?.worldId).toBe(originalWorldId);
    });

    it("should allow updating an area without changing the world reference", async () => {
      // Arrange - Create a world and an area
      const worldId = "existing-world-id";

      // Create the world
      await worldModel.create({
        _id: worldId,
        name: "Existing World",
        description: "An existing world",
        techLevel: 2,
        shard: "test-shard",
      });

      // Create the area with the world
      const areaId = "update-test-area";
      await areaModel.create({
        _id: areaId,
        name: "Original Name",
        description: "Original description",
        worldId,
        tags: ["test"],
      });

      // Act - Update the area without changing the world reference
      const updateResult = await service.update({
        _id: areaId,
        name: "Updated Name",
        description: "Updated description",
        worldId, // Keep the same worldId
        landmarks: [],
        connections: [],
        tags: ["test"],
      });

      // Assert
      expect(updateResult).toBeDefined();
      // Type assertion to handle the union type
      const updatedResult = updateResult as WithDocument<AreaModel>;
      expect(updatedResult.name).toBe("Updated Name");
      expect(updatedResult.description).toBe("Updated description");
      expect(updatedResult.worldId).toBe(worldId);

      // Verify the area was updated in the database
      const updatedArea = await areaModel.findById(areaId);
      expect(updatedArea).toBeDefined();
      expect(updatedArea?.name).toBe("Updated Name");
      expect(updatedArea?.description).toBe("Updated description");
      expect(updatedArea?.worldId).toBe(worldId);
    });
  });
});
