import { Test, TestingModule } from "@nestjs/testing";
import { AreaModel } from "@orbital/typegoose";
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
          TypegooseModule.forFeature([AreaModel]),
        ],
        providers: [AreasCRUDService, AreasRepository],
      }).compile();

      // Get the service, repository, and model
      service = module.get<AreasCRUDService>(AreasCRUDService);
      repository = module.get<AreasRepository>(AreasRepository);
      areaModel = module.get<Model<AreaModel>>(getModelToken(AreaModel.name));
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
});
