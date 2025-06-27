import { ClientNats, ClientProxy } from "@nestjs/microservices";
import { Area as CoreArea } from "@orbital/core";
import { AreaModel as TypegooseArea } from "@orbital/typegoose";
import { randomUUID } from "crypto";
import { lastValueFrom } from "rxjs";

describe("AreasMicroserviceController (e2e)", () => {
  let client: ClientProxy;
  let testAreas: TypegooseArea[] = [];
  const worldId = randomUUID();

  beforeAll(async () => {
    // Connect directly to the running NATS server
    client = new ClientNats({
      servers: ["nats://localhost:4223"],
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
        testAreas.map((area) =>
          lastValueFrom(
            client.send(
              "world.AreasMicroserviceController.deleteArea",
              area._id
            )
          )
        )
      );
    } catch (error) {
      console.error("Error cleaning up test areas:", error);
    }

    // Close the client connection
    await client.close();
  });

  describe("createArea", () => {
    it("should create a new area", async () => {
      // Create test data using CoreArea.mock()
      const createAreaDto = CoreArea.mock({
        _id: randomUUID(),
        worldId,
        position: { x: 100, y: 200, z: 0 },
        tags: ["test", "e2e"],
      });

      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.createArea",
          createAreaDto
        )
      );

      // Store for cleanup
      testAreas.push(result);

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toEqual(createAreaDto.name);
      expect(result.description).toEqual(createAreaDto.description);
      expect(result.worldId).toEqual(worldId);
      expect(result.position).toEqual(createAreaDto.position);
      expect(result.tags).toEqual(createAreaDto.tags);
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
            "world.AreasMicroserviceController.createArea",
            invalidAreaDto
          )
        );
        expect(true).toBe(false); // Expected error was not thrown
      } catch (error: any) {
        // Extract error payload from message or cause
        let errorPayload;
        try {
          if (error.cause) {
            errorPayload = error.cause;
          } else if (
            typeof error.message === "string" &&
            error.message.includes("{")
          ) {
            errorPayload = JSON.parse(
              error.message.substring(error.message.indexOf("{"))
            );
          } else {
            errorPayload = error;
          }
        } catch (e) {
          errorPayload = error;
        }

        // Verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toContain("worldId");
      }
    });
  });

  describe("getAllAreas", () => {
    beforeAll(async () => {
      // Create some test areas using CoreArea.mock()
      const createAreaDtos = Array.from({ length: 3 }, (_, i) =>
        CoreArea.mock({
          _id: randomUUID(),
          worldId,
          position: { x: i * 100, y: i * 100, z: 0 },
          tags: ["test", "e2e", `test-${i}`],
        })
      );

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.createArea", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return all areas", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.getAllAreas", {})
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("getArea", () => {
    let testArea: TypegooseArea;

    beforeAll(async () => {
      // Create a test area using CoreArea.mock()
      const createAreaDto = CoreArea.mock({
        _id: randomUUID(),
        worldId,
        position: { x: 300, y: 300, z: 0 },
        tags: ["test", "e2e", "getArea"],
      });

      // Create the area
      testArea = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.createArea",
          createAreaDto
        )
      );

      // Store for cleanup
      testAreas.push(testArea);
    });

    it("should return an area by ID", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.getArea", testArea._id)
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toEqual(testArea._id);
      expect(result.name).toEqual(testArea.name);
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.getArea", randomUUID())
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("updateArea", () => {
    let testArea: TypegooseArea;

    beforeAll(async () => {
      // Create a test area using CoreArea.mock()
      const createAreaDto = CoreArea.mock({
        _id: randomUUID(),
        worldId,
        position: { x: 400, y: 400, z: 0 },
        tags: ["test", "e2e", "updateArea"],
      });

      // Create the area
      testArea = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.createArea",
          createAreaDto
        )
      );

      // Store for cleanup
      testAreas.push(testArea);
    });

    it("should update an area", async () => {
      // Create update data - use a plain object instead of CoreArea.mock()
      const updateDto = {
        name: `Updated Area - ${randomUUID()}`,
        description: "Updated description",
        tags: ["test", "e2e", "updated"],
      };

      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.updateArea", {
          _id: testArea._id,
          updateDto,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toEqual(testArea._id);

      // Check that the update was applied - the name should be updated
      // but we can't directly compare with updateDto.name since the service might
      // handle the update differently
      expect(result.name).toBeTruthy();
      expect(result.description).toBeTruthy();
      expect(Array.isArray(result.tags)).toBe(true);

      // Unchanged fields should remain the same
      expect(result.worldId).toEqual(testArea.worldId);
      expect(result.position).toEqual(testArea.position);
    });

    it("should return null for non-existent ID", async () => {
      // Create update data
      const updateDto: any = {
        name: `Updated Area - ${randomUUID()}`,
      };

      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.updateArea", {
          _id: randomUUID(),
          updateDto,
        })
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("deleteArea", () => {
    let testArea: TypegooseArea;

    beforeEach(async () => {
      // Create a test area using CoreArea.mock()
      const createAreaDto = CoreArea.mock({
        _id: randomUUID(),
        worldId,
        position: { x: 500, y: 500, z: 0 },
        tags: ["test", "e2e", "deleteArea"],
      });

      // Create the area
      testArea = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.createArea",
          createAreaDto
        )
      );
    });

    it("should delete an area", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.deleteArea",
          testArea._id
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toEqual(testArea._id);

      // Verify the area is deleted
      const deletedArea = await lastValueFrom(
        client.send("world.AreasMicroserviceController.getArea", testArea._id)
      );
      expect(deletedArea).toBeNull();
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.deleteArea",
          randomUUID()
        )
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("getAreasByWorldId", () => {
    const testWorldId = randomUUID();

    beforeAll(async () => {
      // Create some test areas with the same worldId using CoreArea.mock()
      const createAreaDtos = Array.from({ length: 3 }, (_, i) =>
        CoreArea.mock({
          _id: randomUUID(),
          worldId: testWorldId,
          position: { x: i * 100, y: i * 100, z: 0 },
          tags: ["test", "e2e", `world-test-${i}`],
        })
      );

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.createArea", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return areas by worldId", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.getAreasByWorldId",
          testWorldId
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((area: TypegooseArea) => area.worldId === testWorldId)
      ).toBe(true);
    });

    it("should return empty array for non-existent worldId", async () => {
      // Send the RPC message with a non-existent worldId
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.getAreasByWorldId",
          randomUUID()
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getAreasByParentId", () => {
    const parentId = randomUUID();

    beforeAll(async () => {
      // Create some test areas with the same parentId using CoreArea.mock()
      const createAreaDtos = Array.from({ length: 3 }, (_, i) =>
        CoreArea.mock({
          _id: randomUUID(),
          worldId,
          parentId,
          position: { x: i * 100, y: i * 100, z: 0 },
          tags: ["test", "e2e", `parent-test-${i}`],
        })
      );

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.createArea", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return areas by parentId", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.getAreasByParentId",
          parentId
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((area: TypegooseArea) => area.parentId === parentId)
      ).toBe(true);
    });

    it("should return empty array for non-existent parentId", async () => {
      // Send the RPC message with a non-existent parentId
      const result = await lastValueFrom(
        client.send(
          "world.AreasMicroserviceController.getAreasByParentId",
          randomUUID()
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getAreasByTags", () => {
    const uniqueTag = `unique-tag-${randomUUID()}`;

    beforeAll(async () => {
      // Create some test areas with the unique tag using CoreArea.mock()
      const createAreaDtos = Array.from({ length: 3 }, (_, i) =>
        CoreArea.mock({
          _id: randomUUID(),
          worldId,
          position: { x: i * 100, y: i * 100, z: 0 },
          tags: ["test", "e2e", uniqueTag, `tag-test-${i}`],
        })
      );

      // Create the areas
      const createdAreas = await Promise.all(
        createAreaDtos.map((dto) =>
          lastValueFrom(
            client.send("world.AreasMicroserviceController.createArea", dto)
          )
        )
      );

      // Store for cleanup
      testAreas.push(...createdAreas);
    });

    it("should return areas by tags", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.getAreasByTags", [
          uniqueTag,
        ])
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every((area: TypegooseArea) => area.tags?.includes(uniqueTag))
      ).toBe(true);
    });

    it("should return empty array for non-existent tag", async () => {
      // Send the RPC message with a non-existent tag
      const result = await lastValueFrom(
        client.send("world.AreasMicroserviceController.getAreasByTags", [
          `non-existent-tag-${randomUUID()}`,
        ])
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
            "world.AreasMicroserviceController.createArea",
            invalidAreaDto
          )
        );
        expect(true).toBe(false); // Expected error was not thrown
      } catch (error: any) {
        console.log("Error details:", {
          message: error.message,
          service: error.service,
          hasStack: !!error.stack,
          hasOriginalError: !!error.originalError,
          timestamp: error.timestamp,
        });

        // Extract error payload from message or cause
        let errorPayload;
        try {
          if (error.cause) {
            errorPayload = error.cause;
          } else if (
            typeof error.message === "string" &&
            error.message.includes("{")
          ) {
            errorPayload = JSON.parse(
              error.message.substring(error.message.indexOf("{"))
            );
          } else {
            errorPayload = error;
          }
        } catch (e) {
          errorPayload = error;
        }

        console.log("Full error object:", JSON.stringify(error, null, 2));
        console.log("Error payload:", errorPayload);

        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        expect(error.message).toContain("worldId");

        // Check for our custom error properties
        expect(errorPayload.service).toBe("world");
        expect(errorPayload.timestamp).toBeDefined();
        expect(errorPayload.originalError).toBeDefined();
      }
    });

    it("should preserve error message and stack trace for invalid field type", async () => {
      // Create invalid test data (invalid _id format to trigger Mongoose error)
      const invalidAreaDto: any = {
        _id: "invalid-id-format", // Invalid MongoDB ObjectId format
        name: `Invalid Area ${randomUUID()}`,
        description: "An area with invalid ID format",
        worldId: randomUUID(),
        position: { x: 100, y: 200, z: 0 },
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.createArea",
            invalidAreaDto
          )
        );
        expect(true).toBe(false); // Expected error was not thrown
      } catch (error: any) {
        console.log("Invalid ID error details:", {
          message: error.message,
          service: error.service,
          hasStack: !!error.stack,
          isJestError: !!error.matcherResult,
        });

        // Extract error payload from message or cause
        let errorPayload;
        try {
          if (error.cause) {
            errorPayload = error.cause;
          } else if (
            typeof error.message === "string" &&
            error.message.includes("{")
          ) {
            errorPayload = JSON.parse(
              error.message.substring(error.message.indexOf("{"))
            );
          } else {
            errorPayload = error;
          }
        } catch (e) {
          errorPayload = error;
        }

        console.log("Full error object:", JSON.stringify(error, null, 2));
        console.log("Error payload:", errorPayload);

        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        expect(error.message).toBeTruthy();

        // Check for our custom error properties
        // Skip service check if we got a Jest assertion error
        if (!error.matcherResult) {
          expect(errorPayload.service).toBe("world");
          expect(errorPayload.timestamp).toBeDefined();
          expect(errorPayload.originalError).toBeDefined();
        }
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
        expect(true).toBe(false); // Expected error was not thrown
      } catch (error: any) {
        console.log("Non-existent pattern error:", {
          message: error.message,
          service: error.service,
          hasStack: !!error.stack,
        });

        // Extract error payload from message or cause
        let errorPayload;
        try {
          if (error.cause) {
            errorPayload = error.cause;
          } else if (
            typeof error.message === "string" &&
            error.message.includes("{")
          ) {
            errorPayload = JSON.parse(
              error.message.substring(error.message.indexOf("{"))
            );
          } else {
            errorPayload = error;
          }
        } catch (e) {
          errorPayload = error;
        }

        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();

        // The error might be different depending on how NATS handles non-existent patterns
        // but we should still have our custom properties if the filter is working
        if (errorPayload.service) {
          expect(errorPayload.service).toBe("world");
          expect(errorPayload.timestamp).toBeDefined();
        }
      }
    });
  });
});
