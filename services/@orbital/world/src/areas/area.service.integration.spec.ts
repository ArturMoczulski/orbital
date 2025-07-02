import { Test, TestingModule } from "@nestjs/testing";
import { AreaModel, WorldModel } from "@orbital/typegoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Model } from "mongoose";
import { getModelToken, TypegooseModule } from "nestjs-typegoose";
import { AreaService } from "./area.service";
import { AreasCRUDService } from "./areas.crud.service";
import { AreasRepository } from "./areas.repository";

describe("AreaService Integration", () => {
  let service: AreaService;
  let crudService: AreasCRUDService;
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
        providers: [AreaService, AreasCRUDService, AreasRepository],
      }).compile();

      // Get the service, repository, and model
      service = module.get<AreaService>(AreaService);
      crudService = module.get<AreasCRUDService>(AreasCRUDService);
      repository = module.get<AreasRepository>(AreasRepository);
      areaModel = module.get<Model<AreaModel>>(getModelToken(AreaModel.name));
      worldModel = module.get<Model<WorldModel>>(
        getModelToken(WorldModel.name)
      );
    } catch (error) {
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
      throw error;
    }
  });

  beforeEach(async () => {
    // Clear only the areas collection instead of dropping the entire database
    if (mongoose.connection.readyState === 1) {
      await areaModel.deleteMany({});
      await worldModel.deleteMany({});
    }
  });

  // Test all methods in AreaService, including those proxied from CRUDService
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

  describe("findByParentId", () => {
    it("should find areas by parentId", async () => {
      // Arrange - Create test areas
      const parentId = "parent-area-id";
      const otherParentId = "other-parent-id";

      // Create areas directly using the model
      await areaModel.create([
        {
          _id: "area-1",
          name: "Area 1",
          description: "Test area 1",
          worldId: "world-1",
          parentId,
          tags: ["test"],
        },
        {
          _id: "area-2",
          name: "Area 2",
          description: "Test area 2",
          worldId: "world-1",
          parentId,
          tags: ["test"],
        },
        {
          _id: "area-3",
          name: "Area 3",
          description: "Test area 3",
          worldId: "world-2",
          parentId: otherParentId,
          tags: ["test"],
        },
      ]);

      // Act - Find areas by parentId
      const result = await service.findByParentId(parentId);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].parentId).toBe(parentId);
      expect(result[1].parentId).toBe(parentId);
      expect(result.map((area) => area._id).sort()).toEqual(
        ["area-1", "area-2"].sort()
      );
    });

    it("should return empty array when no areas found", async () => {
      // Arrange - No areas in the database

      // Act
      const result = await service.findByParentId("nonexistent-parent-id");

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should apply projection when provided", async () => {
      // Arrange - Create a test area
      const parentId = "parent-area-id";

      // Create area directly using the model
      await areaModel.create({
        _id: "area-1",
        name: "Area 1",
        description: "Test area 1",
        worldId: "world-1",
        parentId,
        tags: ["test"],
      });

      // Act - Find area with projection
      const result = await service.findByParentId(parentId, {
        name: 1,
        _id: 1,
        parentId: 1,
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
      const parentId = "parent-area-id";

      // Create areas directly using the model
      await areaModel.create([
        {
          _id: "area-1",
          name: "B Area",
          description: "Test area B",
          worldId: "world-1",
          parentId,
          tags: ["test"],
        },
        {
          _id: "area-2",
          name: "A Area",
          description: "Test area A",
          worldId: "world-1",
          parentId,
          tags: ["test"],
        },
      ]);

      // Act - Find areas with sort option
      const result = await service.findByParentId(parentId, undefined, {
        sort: { name: 1 },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("A Area");
      expect(result[1].name).toBe("B Area");
    });
  });

  describe("findByTags", () => {
    it("should find areas by tags", async () => {
      // Arrange - Create test areas
      const tags = ["fantasy", "medieval"];
      const otherTags = ["sci-fi", "futuristic"];

      // Create areas directly using the model
      await areaModel.create([
        {
          _id: "area-1",
          name: "Area 1",
          description: "Test area 1",
          worldId: "world-1",
          tags: ["fantasy", "castle"],
        },
        {
          _id: "area-2",
          name: "Area 2",
          description: "Test area 2",
          worldId: "world-1",
          tags: ["medieval", "village"],
        },
        {
          _id: "area-3",
          name: "Area 3",
          description: "Test area 3",
          worldId: "world-2",
          tags: ["sci-fi", "space-station"],
        },
      ]);

      // Act - Find areas by tags
      const result = await service.findByTags(tags);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      // Each area should have at least one of the tags we searched for
      expect(result[0].tags.some((tag) => tags.includes(tag))).toBe(true);
      expect(result[1].tags.some((tag) => tags.includes(tag))).toBe(true);
      expect(result.map((area) => area._id).sort()).toEqual(
        ["area-1", "area-2"].sort()
      );
    });

    it("should return empty array when no areas found", async () => {
      // Arrange - No areas in the database

      // Act
      const result = await service.findByTags(["nonexistent-tag"]);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should apply projection when provided", async () => {
      // Arrange - Create a test area
      const tags = ["fantasy", "castle"];

      // Create area directly using the model
      await areaModel.create({
        _id: "area-1",
        name: "Area 1",
        description: "Test area 1",
        worldId: "world-1",
        tags,
      });

      // Act - Find area with projection
      const result = await service.findByTags(tags, {
        name: 1,
        _id: 1,
        tags: 1,
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
      const tags = ["fantasy"];

      // Create areas directly using the model
      await areaModel.create([
        {
          _id: "area-1",
          name: "B Area",
          description: "Test area B",
          worldId: "world-1",
          tags: ["fantasy", "castle"],
        },
        {
          _id: "area-2",
          name: "A Area",
          description: "Test area A",
          worldId: "world-1",
          tags: ["fantasy", "village"],
        },
      ]);

      // Act - Find areas with sort option
      const result = await service.findByTags(tags, undefined, {
        sort: { name: 1 },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("A Area");
      expect(result[1].name).toBe("B Area");
    });
  });

  // Test methods proxied from CRUDService
  describe("create", () => {
    it("should create a new area", async () => {
      // Arrange
      const areaData = {
        name: "New Area",
        description: "A new test area",
        worldId: "test-world-id",
        tags: ["test", "new"],
        landmarks: [],
        connections: [],
      };

      // Create the world first so reference validation passes
      await worldModel.create({
        _id: "test-world-id",
        name: "Test World",
        description: "A test world",
        techLevel: 5,
        shard: "test-shard",
      });

      // Act
      const result = await service.create(areaData);

      // Assert
      expect(result).toBeDefined();

      // Type assertion to handle potential BulkItemizedResponse
      const area = result as AreaModel;

      expect(area._id).toBeDefined();
      expect(area.name).toBe("New Area");
      expect(area.description).toBe("A new test area");
      expect(area.worldId).toBe("test-world-id");

      // Verify the area was saved to the database
      const savedArea = await areaModel.findById(area._id);
      expect(savedArea).toBeDefined();
      expect(savedArea?.name).toBe("New Area");
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
  });

  describe("find", () => {
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

      // Act - Use the find method
      const result = await service.find({});

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result.map((area) => area._id).sort()).toEqual(
        ["area-1", "area-2"].sort()
      );
    });

    it("should find areas with projection", async () => {
      // Arrange - Create test area
      await areaModel.create({
        _id: "area-projection",
        name: "Projection Area",
        description: "Test area with projection",
        worldId: "world-1",
        tags: ["test", "projection"],
      });

      // Act - Find with projection
      const result = await service.find(
        { _id: "area-projection" },
        { name: 1, _id: 1 }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe("area-projection");
      expect(result[0].name).toBe("Projection Area");
      // Description should be empty string due to projection
      expect(result[0].description).toBe("");
    });

    it("should find areas with options", async () => {
      // Arrange - Create test areas with different names
      await areaModel.create([
        {
          _id: "area-sort-1",
          name: "Z Area",
          description: "Should be second",
          worldId: "world-sort",
          tags: ["test", "sort"],
        },
        {
          _id: "area-sort-2",
          name: "A Area",
          description: "Should be first",
          worldId: "world-sort",
          tags: ["test", "sort"],
        },
      ]);

      // Act - Find with sort option
      const result = await service.find({ worldId: "world-sort" }, undefined, {
        sort: { name: 1 },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("A Area");
      expect(result[1].name).toBe("Z Area");
    });
  });

  describe("findById", () => {
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

    it("should return null when area with ID is not found", async () => {
      // Act
      const result = await service.findById("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should find an area by id with projection", async () => {
      // Arrange - Create area directly using the model
      await areaModel.create({
        _id: "find-area-projection",
        name: "Find Area With Projection",
        description: "An area to find with projection",
        worldId: "test-world-id",
        tags: ["test", "find", "projection"],
      });

      // Act
      const result = await service.findById("find-area-projection", {
        name: 1,
        _id: 1,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe("find-area-projection");
      expect(result?.name).toBe("Find Area With Projection");
      // Description should be empty string due to projection
      expect(result?.description).toBe("");
    });
  });

  describe("update", () => {
    it("should update an area", async () => {
      // Arrange - Create a world and an area
      const worldId = "update-world-id";

      // Create the world
      await worldModel.create({
        _id: worldId,
        name: "Update World",
        description: "A world for update tests",
        techLevel: 3,
        shard: "test-shard",
      });

      // Create the area
      const areaId = "update-area-id";
      await areaModel.create({
        _id: areaId,
        name: "Original Name",
        description: "Original description",
        worldId,
        tags: ["test"],
      });

      // Act - Update the area
      const updateResult = await service.update({
        _id: areaId,
        name: "Updated Name",
        description: "Updated description",
        worldId,
        landmarks: [],
        connections: [],
        tags: ["test", "updated"],
      });

      // Assert
      expect(updateResult).toBeDefined();

      // Type assertion to handle potential BulkItemizedResponse
      const updatedAreaResult = updateResult as AreaModel;

      expect(updatedAreaResult._id).toBe(areaId);
      expect(updatedAreaResult.name).toBe("Updated Name");
      expect(updatedAreaResult.description).toBe("Updated description");
      expect(updatedAreaResult.tags).toContain("updated");

      // Verify the area was updated in the database
      const updatedArea = await areaModel.findById(areaId);
      expect(updatedArea).toBeDefined();
      expect(updatedArea?.name).toBe("Updated Name");
      expect(updatedArea?.description).toBe("Updated description");
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
  });

  describe("delete", () => {
    it("should delete an area by id", async () => {
      // Arrange - Create area directly using the model
      await areaModel.create({
        _id: "delete-area-id",
        name: "Delete Area",
        description: "An area to delete",
        worldId: "test-world-id",
        tags: ["test", "delete"],
      });

      // Act
      const result = await service.delete("delete-area-id");

      // Assert
      expect(result).toBe(true);

      // Verify the area was deleted from the database
      const deletedArea = await areaModel.findById("delete-area-id");
      expect(deletedArea).toBeNull();
    });

    it("should return null when trying to delete a non-existent area", async () => {
      // Act
      const result = await service.delete("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });
  });
});
