import { Test, TestingModule } from "@nestjs/testing";
import { WorldModel } from "@orbital/typegoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Model } from "mongoose";
import { getModelToken, TypegooseModule } from "nestjs-typegoose";
import { WorldsRepository } from "./worlds.repository";

describe("WorldsRepository Integration", () => {
  let repository: WorldsRepository;
  let mongod: MongoMemoryServer;
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
          TypegooseModule.forFeature([WorldModel]),
        ],
        providers: [WorldsRepository],
      }).compile();

      // Get the repository and model
      repository = module.get<WorldsRepository>(WorldsRepository);
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
    // Clear only the worlds collection instead of dropping the entire database
    if (mongoose.connection.readyState === 1) {
      await worldModel.deleteMany({});
    }
  });

  describe("findByShard", () => {
    it("should find worlds by shard", async () => {
      // Arrange - Create test worlds
      const shard = "test-shard";
      const otherShard = "other-shard";

      // Create worlds directly using the model
      await worldModel.create([
        {
          _id: "world-1",
          name: "World 1",
          shard,
          techLevel: 3,
        },
        {
          _id: "world-2",
          name: "World 2",
          shard,
          techLevel: 5,
        },
        {
          _id: "world-3",
          name: "World 3",
          shard: otherShard,
          techLevel: 7,
        },
      ]);

      // Act - Find worlds by shard
      const result = await repository.findByShard(shard);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].shard).toBe(shard);
      expect(result[1].shard).toBe(shard);
      expect(result.map((world) => world._id).sort()).toEqual(
        ["world-1", "world-2"].sort()
      );
    });

    it("should return empty array when no worlds found", async () => {
      // Arrange - No worlds in the database

      // Act
      const result = await repository.findByShard("nonexistent-shard");

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should apply projection when provided", async () => {
      // Arrange - Create a test world
      const shard = "test-shard";

      // Create world directly using the model
      await worldModel.create({
        _id: "world-1",
        name: "World 1",
        shard,
        techLevel: 3,
      });

      // Act - Find world with projection
      // Include required fields in the projection
      const result = await repository.findByShard(shard, {
        name: 1,
        _id: 1,
        shard: 1,
        techLevel: 1, // Include techLevel since it's required by the World model
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe("world-1");
      expect(result[0].name).toBe("World 1");
      expect(result[0].shard).toBe(shard);
      // techLevel should be the actual value since it's included in the projection
      expect(result[0].techLevel).toBe(3);
    });

    it("should apply options when provided", async () => {
      // Arrange - Create test worlds
      const shard = "test-shard";

      // Create worlds directly using the model
      await worldModel.create([
        {
          _id: "world-1",
          name: "B World",
          shard,
          techLevel: 3,
        },
        {
          _id: "world-2",
          name: "A World",
          shard,
          techLevel: 5,
        },
      ]);

      // Act - Find worlds with sort option
      const result = await repository.findByShard(shard, undefined, {
        sort: { name: 1 },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("A World");
      expect(result[1].name).toBe("B World");
    });
  });

  describe("findByTechLevel", () => {
    it("should find worlds by techLevel", async () => {
      // Arrange - Create test worlds
      const techLevel = 5;

      // Create worlds directly using the model
      await worldModel.create([
        {
          _id: "world-1",
          name: "World 1",
          shard: "shard-1",
          techLevel: 3,
        },
        {
          _id: "world-2",
          name: "World 2",
          shard: "shard-2",
          techLevel,
        },
        {
          _id: "world-3",
          name: "World 3",
          shard: "shard-3",
          techLevel,
        },
      ]);

      // Act - Find worlds by techLevel
      const result = await repository.findByTechLevel(techLevel);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].techLevel).toBe(techLevel);
      expect(result[1].techLevel).toBe(techLevel);
      expect(result.map((world) => world._id).sort()).toEqual(
        ["world-2", "world-3"].sort()
      );
    });

    it("should return empty array when no worlds found", async () => {
      // Arrange - No worlds with the specified techLevel

      // Act
      const result = await repository.findByTechLevel(999);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  // Test inherited CRUD methods to ensure they work with our specific entity
  describe("inherited CRUD methods", () => {
    it("should find worlds with find method", async () => {
      // Arrange - Create test worlds
      await worldModel.create([
        {
          _id: "world-1",
          name: "World 1",
          shard: "shard-1",
          techLevel: 3,
        },
        {
          _id: "world-2",
          name: "World 2",
          shard: "shard-2",
          techLevel: 5,
        },
      ]);

      // Act - Use the find method which should be inherited from DocumentRepository
      const result = await repository.find({});

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result.map((world) => world._id).sort()).toEqual(
        ["world-1", "world-2"].sort()
      );
    });

    it("should find a world by id", async () => {
      // Arrange - Create world directly using the model
      await worldModel.create({
        _id: "find-world-id",
        name: "Find World",
        shard: "test-shard",
        techLevel: 7,
      });

      // Act
      const result = await repository.findById("find-world-id");

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe("find-world-id");
      expect(result?.name).toBe("Find World");
    });
  });
});
