import { ClientNats, ClientProxy } from "@nestjs/microservices";
import { AreaModel } from "@orbital/typegoose";
import { randomUUID } from "crypto";
import { lastValueFrom } from "rxjs";

describe("AreasMicroserviceController (e2e)", () => {
  let client: ClientProxy;
  let testAreas: AreaModel[] = [];
  let worldId: string;
  let testWorld: any;

  beforeAll(async () => {
    // Connect directly to the running NATS server
    client = new ClientNats({
      servers: [process.env.NATS_URL || "nats://localhost:4223"],
      queue: "test-client",
    });

    await client.connect();

    // Wait a moment for the connection to be fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create a test world using the WorldsMicroserviceController
    try {
      // Create a test world with explicit _id
      const worldData = {
        // _id: randomUUID(), // Add explicit _id
        name: "Test World for Areas E2E",
        shard: "test-shard",
        techLevel: 5,
      };

      console.log("Creating test world:", JSON.stringify(worldData, null, 2));

      // Create the world using the WorldsMicroserviceController
      testWorld = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.create", worldData)
      );

      // Use this world's ID for all area tests
      worldId = testWorld._id;

      console.log(`Created test world with ID: ${worldId}`);
    } catch (error) {
      console.error("Error setting up database for tests:", error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up areas
    try {
      await Promise.all(
        testAreas.map((area) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.delete", area._id)
          )
        )
      );
    } catch (error) {
      console.error("Error cleaning up test areas:", error);
    }

    // Clean up the test world
    try {
      if (testWorld && testWorld._id) {
        await lastValueFrom(
          client.send(
            "world.WorldsMicroserviceController.delete",
            testWorld._id
          )
        );
        console.log(`Deleted test world with ID: ${testWorld._id}`);
      }
    } catch (error) {
      console.error("Error cleaning up test world:", error);
    }

    // Close the client connection
    await client.close();
  });

  describe("create", () => {
    it("should create a new area", async () => {
      // Create test data
      const createAreaDto = {
        _id: randomUUID(),
        name: "Test Area for E2E",
        worldId,
        description: "Test area created for e2e testing",
        landmarks: [],
        connections: [],
        tags: ["test", "e2e"],
      };

      try {
        // Log the data being sent
        console.log(
          "Sending create data:",
          JSON.stringify(createAreaDto, null, 2)
        );

        // Send the RPC message
        const result = await lastValueFrom(
          client.send("world.AreasMicroserviceController.create", createAreaDto)
        );

        // Log the result
        console.log("Create result:", JSON.stringify(result, null, 2));

        // Store for cleanup
        testAreas.push(result);

        // Assertions
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.name).toEqual(createAreaDto.name);
        expect(result.worldId).toEqual(worldId);
        expect(result.description).toEqual(createAreaDto.description);

        // These properties should exist but with default values
        expect(result.landmarks).toBeDefined();
        expect(result.connections).toBeDefined();
        expect(result.tags).toBeDefined();
      } catch (error) {
        console.error("Error creating area:", error);
        // Log more details about the error
        if (error.message) console.error("Error message:", error.message);
        if (error.stack) console.error("Error stack:", error.stack);
        throw error;
      }
    });

    it("should throw an error when required fields are missing", async () => {
      // Create invalid test data (missing worldId)
      const invalidAreaDto: any = {
        _id: randomUUID(),
        name: `Invalid Area ${randomUUID()}`,
        description: "An invalid area missing required fields",
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.create",
            invalidAreaDto
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toContain("worldId");
      }
    });
  });

  describe("find", () => {
    beforeAll(async () => {
      // Create some test areas
      const createAreaDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test Area ${i}`,
        worldId,
        description: `Test area ${i} for e2e testing`,
        position: { x: i * 100, y: i * 100, z: 0 },
        tags: ["test", "e2e", `test-${i}`],
      }));

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return all areas", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.find", {})
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("should filter areas by criteria", async () => {
      // Send the RPC message with a filter
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.find", {
          filter: { worldId },
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.every((area: AreaModel) => area.worldId === worldId)).toBe(
        true
      );
    });
  });

  describe("findById", () => {
    let testArea: AreaModel;

    beforeAll(async () => {
      // Create a test area
      const createAreaDto = {
        _id: randomUUID(),
        name: "Test Area for findById",
        worldId,
        description: "Test area for findById e2e testing",
        position: { x: 300, y: 300, z: 0 },
        tags: ["test", "e2e", "findById"],
      };

      // Create the area
      testArea = await lastValueFrom(
        client.send("world.AreasMicroserviceController.create", createAreaDto)
      );

      // Store for cleanup
      testAreas.push(testArea);
    });

    it("should return an area by ID", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findById", {
          id: testArea._id,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toEqual(testArea._id);
      expect(result.name).toEqual(testArea.name);
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findById", {
          id: randomUUID(),
        })
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    let testArea: AreaModel;

    beforeAll(async () => {
      // Create a test area
      const createAreaDto = {
        _id: randomUUID(),
        name: "Test Area for update",
        worldId,
        description: "Test area for update e2e testing",
        position: { x: 400, y: 400, z: 0 },
        tags: ["test", "e2e", "update"],
      };

      // Create the area
      testArea = await lastValueFrom(
        client.send("world.AreasMicroserviceController.create", createAreaDto)
      );

      // Store for cleanup
      testAreas.push(testArea);
    });

    it("should update an area", async () => {
      // Create update data
      const updateDto = {
        _id: testArea._id,
        name: `Updated Area - ${randomUUID()}`,
        description: "Updated description",
        tags: ["test", "e2e", "updated"],
      };

      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.update", updateDto)
      );

      // Assertions - update doesn't return the full object
      expect(result).toBeDefined();

      // Verify the update was successful by fetching the updated area
      const updatedArea = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findById", {
          id: testArea._id,
        })
      );

      expect(updatedArea).toBeDefined();
      expect(updatedArea._id).toEqual(testArea._id);
      expect(updatedArea.name).toEqual(updateDto.name);
      expect(updatedArea.description).toEqual(updateDto.description);
      expect(updatedArea.tags).toEqual(updateDto.tags);

      // Unchanged fields should remain the same
      expect(updatedArea.worldId).toEqual(testArea.worldId);
      expect(updatedArea.position).toEqual(testArea.position);
    });

    it("should return null for non-existent ID", async () => {
      // Create update data
      const updateDto = {
        name: `Updated Area - ${randomUUID()}`,
      };

      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.update", {
          _id: randomUUID(),
          updateDto,
        })
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    let testArea: AreaModel;

    beforeEach(async () => {
      // Create a test area
      const createAreaDto = {
        _id: randomUUID(),
        name: "Test Area for delete",
        worldId,
        description: "Test area for delete e2e testing",
        position: { x: 500, y: 500, z: 0 },
        tags: ["test", "e2e", "delete"],
      };

      // Create the area
      testArea = await lastValueFrom(
        client.send("world.AreasMicroserviceController.create", createAreaDto)
      );
    });

    it("should delete an area", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.delete", testArea._id)
      );

      // Assertions - delete doesn't return the full object
      expect(result).toBeDefined();

      // Verify the area is deleted
      const deletedArea = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findById", {
          id: testArea._id,
        })
      );
      expect(deletedArea).toBeNull();
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.delete", randomUUID())
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("findByWorldId", () => {
    const testWorldId = randomUUID();

    beforeAll(async () => {
      // Create some test areas with the same worldId
      const createAreaDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test Area for worldId ${i}`,
        worldId: testWorldId,
        description: `Test area ${i} for worldId e2e testing`,
        position: { x: i * 100, y: i * 100, z: 0 },
        tags: ["test", "e2e", `world-test-${i}`],
      }));

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return areas by worldId", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findByWorldId", {
          worldId: testWorldId,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((area: AreaModel) => area.worldId === testWorldId)
      ).toBe(true);
    });

    it("should return empty array for non-existent worldId", async () => {
      // Send the RPC message with a non-existent worldId
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findByWorldId", {
          worldId: randomUUID(),
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("findByParentId", () => {
    let parentId: string;
    let parentArea: AreaModel;

    beforeAll(async () => {
      try {
        // First create a parent area
        const parentAreaDto = {
          _id: randomUUID(),
          name: "Parent Area for findByParentId",
          worldId,
          description: "Parent area for findByParentId e2e testing",
          position: { x: 0, y: 0, z: 0 },
          tags: ["test", "e2e", "parent"],
        };

        // Create the parent area
        parentArea = await lastValueFrom(
          client.send("world.AreasMicroserviceController.create", parentAreaDto)
        );

        // Store for cleanup
        testAreas.push(parentArea);

        // Use this area's ID as the parentId
        parentId = parentArea._id;

        console.log(`Created parent area with ID: ${parentId}`);
      } catch (error) {
        console.error("Error creating parent area:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Try again with a new parent area
        try {
          const parentAreaDto2 = {
            _id: randomUUID(),
            name: "Parent Area for findByParentId (retry)",
            worldId,
            description: "Parent area for findByParentId e2e testing (retry)",
            position: { x: 0, y: 0, z: 0 },
            tags: ["test", "e2e", "parent", "retry"],
          };

          console.log(
            "Retrying with new parent area:",
            JSON.stringify(parentAreaDto2, null, 2)
          );

          // Create the parent area
          parentArea = await lastValueFrom(
            client.send(
              "world.AreasMicroserviceController.create",
              parentAreaDto2
            )
          );

          // Store for cleanup
          testAreas.push(parentArea);

          // Use this area's ID as the parentId
          parentId = parentArea._id;

          console.log(`Created parent area (retry) with ID: ${parentId}`);
        } catch (dbError) {
          console.error("Error creating parent area directly in DB:", dbError);
          throw dbError;
        }
      }

      // Create some test areas with the same parentId
      const createAreaDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test Area for parentId ${i}`,
        worldId,
        parentId,
        description: `Test area ${i} for parentId e2e testing`,
        position: { x: i * 100, y: i * 100, z: 0 },
        tags: ["test", "e2e", `parent-test-${i}`],
      }));

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return areas by parentId", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findByParentId", {
          parentId,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((area: AreaModel) => area.parentId === parentId)
      ).toBe(true);
    });

    it("should return empty array for non-existent parentId", async () => {
      // Send the RPC message with a non-existent parentId
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findByParentId", {
          parentId: randomUUID(),
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("findByTags", () => {
    const uniqueTag = `unique-tag-${randomUUID()}`;

    beforeAll(async () => {
      // Create some test areas with the unique tag
      const createAreaDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test Area for tags ${i}`,
        worldId,
        description: `Test area ${i} for tags e2e testing`,
        position: { x: i * 100, y: i * 100, z: 0 },
        tags: ["test", "e2e", uniqueTag, `tag-test-${i}`],
      }));

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return areas by tags", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findByTags", {
          tags: [uniqueTag],
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((area: AreaModel) => area.tags?.includes(uniqueTag))
      ).toBe(true);
    });

    it("should return empty array for non-existent tag", async () => {
      // Send the RPC message with a non-existent tag
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.findByTags", {
          tags: [`non-existent-tag-${randomUUID()}`],
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should preserve error message and stack trace in RPC response", async () => {
      // Create invalid test data (missing required worldId)
      const invalidAreaDto: any = {
        _id: randomUUID(),
        name: `Invalid Area ${randomUUID()}`,
        description: "An invalid area missing required fields",
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.create",
            invalidAreaDto
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        expect(error.message).toContain("worldId");

        // Check for our custom error properties
        expect(error.service || error.cause?.service).toBe("world");
        expect(error.timestamp || error.cause?.timestamp).toBeDefined();
      }
    });

    it("should handle non-existent message patterns gracefully", async () => {
      try {
        // This should throw an error because the pattern doesn't exist
        await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.nonExistentPattern",
            {}
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
      }
    });
  });
});
