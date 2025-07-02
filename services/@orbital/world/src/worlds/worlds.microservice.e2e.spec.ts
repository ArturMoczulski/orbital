import { ClientNats, ClientProxy } from "@nestjs/microservices";
import { WorldModel } from "@orbital/typegoose";
import { randomUUID } from "crypto";
import { lastValueFrom } from "rxjs";

describe("WorldsMicroserviceController (e2e)", () => {
  let client: ClientProxy;
  let testWorlds: WorldModel[] = [];
  const shard = "test-shard";

  beforeAll(async () => {
    // Connect directly to the running NATS server
    client = new ClientNats({
      servers: [process.env.NATS_URL || "nats://localhost:4223"],
      queue: "test-client",
    });

    await client.connect();

    // Wait a moment for the connection to be fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up
    try {
      await Promise.all(
        testWorlds.map((world) =>
          lastValueFrom(
            client.send("world.WorldsMicroserviceController.delete", world._id)
          )
        )
      );
    } catch (error) {
      console.error("Error cleaning up test worlds:", error);
    }

    // Close the client connection
    await client.close();
  });

  describe("create", () => {
    it("should create a new world", async () => {
      // Create test data
      const createWorldDto = {
        // Add explicit ID since the service requires it
        _id: randomUUID(),
        name: "Test World for E2E",
        shard,
        techLevel: 5,
      };

      try {
        // Log the data being sent
        console.log(
          "Sending create data:",
          JSON.stringify(createWorldDto, null, 2)
        );

        // Send the RPC message
        const result = await lastValueFrom(
          client.send(
            "world.WorldsMicroserviceController.create",
            createWorldDto
          )
        );

        // Log the result
        console.log("Create result:", JSON.stringify(result, null, 2));

        // Store for cleanup
        testWorlds.push(result);

        // Assertions
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.name).toEqual(createWorldDto.name);
        expect(result.shard).toEqual(shard);
        expect(result.techLevel).toEqual(createWorldDto.techLevel);
      } catch (error) {
        console.error("Error creating world:", error);
        // Log more details about the error
        if (error.message) console.error("Error message:", error.message);
        if (error.stack) console.error("Error stack:", error.stack);
        throw error;
      }
    });

    it("should throw an error when required fields are missing", async () => {
      // Create invalid test data (missing techLevel)
      const invalidWorldDto: any = {
        name: `Invalid World ${randomUUID()}`,
        shard: "test-shard",
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "world.WorldsMicroserviceController.create",
            invalidWorldDto
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toContain("techLevel");
      }
    });
  });

  describe("find", () => {
    beforeAll(async () => {
      // Create some test worlds
      const createWorldDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test World ${i}`,
        shard,
        techLevel: i + 3,
      }));

      // Create the worlds
      const createdWorlds = await Promise.all(
        createWorldDtos.map((dto) =>
          lastValueFrom(
            client.send("world.WorldsMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testWorlds.push(...createdWorlds);
    });

    it("should return all worlds", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.find", {})
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("should filter worlds by criteria", async () => {
      // Send the RPC message with a filter
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.find", {
          filter: { shard },
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.every((world: WorldModel) => world.shard === shard)).toBe(
        true
      );
    });
  });

  describe("findById", () => {
    let testWorld: WorldModel;

    beforeAll(async () => {
      // Create a test world
      const createWorldDto = {
        _id: randomUUID(),
        name: "Test World for findById",
        shard,
        techLevel: 7,
      };

      // Create the world
      testWorld = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.create", createWorldDto)
      );

      // Store for cleanup
      testWorlds.push(testWorld);
    });

    it("should find a world by id", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findById", {
          id: testWorld._id,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toEqual(testWorld._id);
      expect(result.name).toEqual(testWorld.name);
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findById", {
          id: randomUUID(),
        })
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    let testWorld: WorldModel;

    beforeAll(async () => {
      // Create a test world
      const createWorldDto = {
        _id: randomUUID(),
        name: "Test World for update",
        shard,
        techLevel: 3,
      };

      // Create the world
      testWorld = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.create", createWorldDto)
      );

      // Store for cleanup
      testWorlds.push(testWorld);
    });

    it("should update a world", async () => {
      // Create update data
      const updateDto = {
        _id: testWorld._id,
        name: `Updated World - ${randomUUID()}`,
        techLevel: 8,
      };

      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.update", updateDto)
      );

      // Assertions - update doesn't return the full object
      expect(result).toBeDefined();

      // Verify the update was successful by fetching the updated world
      const updatedWorld = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findById", {
          id: testWorld._id,
        })
      );

      expect(updatedWorld).toBeDefined();
      expect(updatedWorld._id).toEqual(testWorld._id);
      expect(updatedWorld.name).toEqual(updateDto.name);
      expect(updatedWorld.techLevel).toEqual(updateDto.techLevel);

      // Unchanged fields should remain the same
      expect(updatedWorld.shard).toEqual(testWorld.shard);
    });

    it("should return null for non-existent ID", async () => {
      // Create update data
      const updateDto = {
        _id: randomUUID(),
        name: `Updated World - ${randomUUID()}`,
      };

      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.update", updateDto)
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    let testWorld: WorldModel;

    beforeEach(async () => {
      // Create a test world
      const createWorldDto = {
        _id: randomUUID(),
        name: "Test World for delete",
        shard,
        techLevel: 4,
      };

      // Create the world
      testWorld = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.create", createWorldDto)
      );
    });

    it("should delete a world", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.delete", testWorld._id)
      );

      // Assertions - delete doesn't return the full object
      expect(result).toBeDefined();

      // Verify the world is deleted
      const deletedWorld = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findById", {
          id: testWorld._id,
        })
      );
      expect(deletedWorld).toBeNull();
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.delete", randomUUID())
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("findByShard", () => {
    const testShard = `test-shard-${randomUUID()}`;

    beforeAll(async () => {
      // Create some test worlds with the same shard
      const createWorldDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test World for shard ${i}`,
        shard: testShard,
        techLevel: i + 3,
      }));

      // Create the worlds
      const createdWorlds = await Promise.all(
        createWorldDtos.map((dto) =>
          lastValueFrom(
            client.send("world.WorldsMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testWorlds.push(...createdWorlds);
    });

    it("should find worlds by shard", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findByShard", {
          shard: testShard,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((world: WorldModel) => world.shard === testShard)
      ).toBe(true);
    });

    it("should return empty array for non-existent shard", async () => {
      // Send the RPC message with a non-existent shard
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findByShard", {
          shard: `nonexistent-shard-${randomUUID()}`,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("findByTechLevel", () => {
    const techLevel = 9;

    beforeAll(async () => {
      // Create some test worlds with the same techLevel
      const createWorldDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        name: `Test World for techLevel ${i}`,
        shard: `shard-${i}`,
        techLevel,
      }));

      // Create the worlds
      const createdWorlds = await Promise.all(
        createWorldDtos.map((dto) =>
          lastValueFrom(
            client.send("world.WorldsMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testWorlds.push(...createdWorlds);
    });

    it("should find worlds by techLevel", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findByTechLevel", {
          techLevel,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((world: WorldModel) => world.techLevel === techLevel)
      ).toBe(true);
    });

    it("should return empty array for non-existent techLevel", async () => {
      // Send the RPC message with a non-existent techLevel
      const result = await lastValueFrom(
        client.send("world.WorldsMicroserviceController.findByTechLevel", {
          techLevel: 999,
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
      // Create invalid test data (missing required techLevel)
      const invalidWorldDto: any = {
        _id: randomUUID(),
        name: `Invalid World ${randomUUID()}`,
        shard: "test-shard",
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "world.WorldsMicroserviceController.create",
            invalidWorldDto
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        expect(error.message).toContain("techLevel");

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
            "world.WorldsMicroserviceController.nonExistentPattern",
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
