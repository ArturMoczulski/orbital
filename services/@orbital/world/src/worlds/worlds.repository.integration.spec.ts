import { Test, TestingModule } from "@nestjs/testing";
import { WithDocument, WorldModel } from "@orbital/typegoose";
import { ReturnModelType } from "@typegoose/typegoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { getModelToken, TypegooseModule } from "nestjs-typegoose";
import { WorldsRepository } from "./worlds.repository";

describe("WorldsRepository Integration", () => {
  // Define a more explicit type alias for the WorldModel
  type WorldModelType = ReturnModelType<typeof WorldModel>;

  let repository: WorldsRepository;
  let mongod: MongoMemoryServer;
  let worldModel: WorldModelType;
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
      worldModel = module.get<WorldModelType>(getModelToken(WorldModel.name));
      console.log(worldModel);
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

  // Test inherited methods from DocumentRepository
  describe("create", () => {
    it("should create a new world", async () => {
      // Arrange
      const newWorld = {
        _id: "new-created-world",
        name: "New Created World",
        shard: "created-shard",
        techLevel: 9,
      };

      // Act
      const result = (await repository.create(
        newWorld
      )) as WithDocument<WorldModel>;

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe(newWorld.name);
      expect(result.shard).toBe(newWorld.shard);
      expect(result.techLevel).toBe(newWorld.techLevel);

      // Verify it was actually saved to the database
      const savedWorld = await worldModel.findById(result._id).exec();
      expect(savedWorld).toBeDefined();
      expect(savedWorld?.name).toBe(newWorld.name);
    });
  });

  describe("find", () => {
    it("should find worlds with find method", async () => {
      // Arrange - Create test worlds
      const worlds = await worldModel.create([
        {
          _id: "world-find-1",
          name: "World 1",
          shard: "shard-1",
          techLevel: 3,
        },
        {
          _id: "world-find-2",
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
    });

    it("should find worlds with specific options", async () => {
      // Arrange - Create test worlds
      await worldModel.create([
        {
          _id: "world-options-1",
          name: "Z World",
          shard: "options-shard",
          techLevel: 3,
        },
        {
          _id: "world-options-2",
          name: "A World",
          shard: "options-shard",
          techLevel: 5,
        },
      ]);

      // Act - Use find with sort option
      const result = await repository.find(
        { shard: "options-shard" },
        undefined,
        { sort: { name: 1 } }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("A World");
      expect(result[1].name).toBe("Z World");
    });
  });

  describe("findOne", () => {
    it("should find one world with findOne method", async () => {
      // Arrange - Create test worlds
      await worldModel.create([
        {
          _id: "world-findone-1",
          name: "Find One World 1",
          shard: "findone-shard",
          techLevel: 3,
        },
        {
          _id: "world-findone-2",
          name: "Find One World 2",
          shard: "findone-shard",
          techLevel: 5,
        },
      ]);

      // Act
      const result = await repository.findOne({ shard: "findone-shard" });

      // Assert
      expect(result).toBeDefined();
      expect(result?.shard).toBe("findone-shard");
    });
  });

  describe("findById", () => {
    it("should find a world by id", async () => {
      // Arrange - Create world directly using the model
      const world = await worldModel.create({
        _id: "world-find-by-id",
        name: "Find World",
        shard: "test-shard",
        techLevel: 7,
      });

      // Act
      const result = await repository.findById(world._id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe("Find World");
    });
  });

  describe("update", () => {
    it("should update an existing world", async () => {
      // Arrange - Create a world to update
      const world = await worldModel.create({
        _id: "world-to-update",
        name: "Original Name",
        shard: "original-shard",
        techLevel: 3,
      });

      const updatedData = {
        _id: world._id,
        name: "Updated Name",
        shard: "updated-shard",
        techLevel: 8,
      };

      // Act
      const result = (await repository.update(
        updatedData
      )) as WithDocument<WorldModel>;

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe(updatedData._id);
      expect(result?.name).toBe(updatedData.name);
      expect(result?.shard).toBe(updatedData.shard);
      expect(result?.techLevel).toBe(updatedData.techLevel);

      // Verify it was actually updated in the database
      const updatedWorld = await worldModel.findById(world._id).exec();
      expect(updatedWorld?.name).toBe(updatedData.name);
      expect(updatedWorld?.shard).toBe(updatedData.shard);
      expect(updatedWorld?.techLevel).toBe(updatedData.techLevel);
    });

    it("should return null when updating a non-existent world", async () => {
      // Arrange
      const nonExistentWorld = {
        _id: "non-existent-world",
        name: "This World Doesn't Exist",
        shard: "fake-shard",
        techLevel: 1,
      };

      // Act
      const result = await repository.update(nonExistentWorld);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an existing world", async () => {
      // Arrange - Create a world to delete
      const world = await worldModel.create({
        _id: "world-to-delete",
        name: "Delete Me",
        shard: "delete-shard",
        techLevel: 2,
      });

      // Act
      const result = await repository.delete(world._id);

      // Assert
      expect(result).toBe(true);

      // Verify it was actually deleted from the database
      const deletedWorld = await worldModel.findById(world._id).exec();
      expect(deletedWorld).toBeNull();
    });

    it("should return null when deleting a non-existent world", async () => {
      // Act
      const result = await repository.delete("non-existent-world");

      // Assert
      expect(result).toBeNull();
    });
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
        _id: "world-projection",
        name: "World 1",
        shard,
        techLevel: 3,
      });

      // Act - Find world with projection
      // Include required fields in the projection
      const result = await repository.findByShard(shard, {
        name: 1,
        shard: 1,
        techLevel: 1, // Include techLevel since it's required by the World model
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
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
          _id: "world-b",
          name: "B World",
          shard,
          techLevel: 3,
        },
        {
          _id: "world-a",
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
          _id: "world-tech-1",
          name: "World 1",
          shard: "shard-1",
          techLevel: 3,
        },
        {
          _id: "world-tech-2",
          name: "World 2",
          shard: "shard-2",
          techLevel,
        },
        {
          _id: "world-tech-3",
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
});
