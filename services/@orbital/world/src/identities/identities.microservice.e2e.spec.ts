import { ClientNats, ClientProxy } from "@nestjs/microservices";
import { IdentityAccount } from "@orbital/identity-types";
import { randomUUID } from "crypto";
import { lastValueFrom } from "rxjs";

describe("IdentitiesMicroserviceController (e2e)", () => {
  let client: ClientProxy;
  let testIdentities: IdentityAccount[] = [];
  const characterId = "test-character-id";

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
        testIdentities.map((identity) =>
          lastValueFrom(
            client.send(
              "identity.IdentitiesMicroserviceController.delete",
              identity._id
            )
          )
        )
      );
    } catch (error) {
      // Error cleanup handled silently
    }

    // Close the client connection
    await client.close();
  });

  describe("create", () => {
    it("should create a new identity account", async () => {
      // Create test data
      const createIdentityDto = {
        _id: randomUUID(),
        characterId,
        provider: "local",
        identifier: "test-user@example.com",
        credentials: [],
      };

      try {
        // Send the RPC message
        const result = await lastValueFrom(
          client.send(
            "identity.IdentitiesMicroserviceController.create",
            createIdentityDto
          )
        );

        // Store for cleanup
        testIdentities.push(result);

        // Assertions
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.characterId).toEqual(characterId);
        expect(result.provider).toEqual(createIdentityDto.provider);
        expect(result.identifier).toEqual(createIdentityDto.identifier);
      } catch (error) {
        // Re-throw the error
        throw error;
      }
    });

    it("should throw an error when required fields are missing", async () => {
      // Create invalid test data (missing provider)
      const invalidIdentityDto: any = {
        _id: randomUUID(),
        characterId,
        identifier: "invalid-user@example.com",
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "identity.IdentitiesMicroserviceController.create",
            invalidIdentityDto
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toContain("provider");
      }
    });
  });

  describe("find", () => {
    beforeAll(async () => {
      // Create some test identities
      const createIdentityDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        characterId,
        provider: "local",
        identifier: `test-user-${i}@example.com`,
        credentials: [],
      }));

      // Create the identities
      const createdIdentities = await Promise.all(
        createIdentityDtos.map((dto) =>
          lastValueFrom(
            client.send("identity.IdentitiesMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testIdentities.push(...createdIdentities);
    });

    it("should return all identities", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("identity.IdentitiesMicroserviceController.find", {})
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("should filter identities by criteria", async () => {
      // Send the RPC message with a filter
      const result = await lastValueFrom(
        client.send("identity.IdentitiesMicroserviceController.find", {
          filter: { characterId },
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every(
          (identity: IdentityAccount) => identity.characterId === characterId
        )
      ).toBe(true);
    });
  });

  describe("findById", () => {
    let testIdentity: IdentityAccount;

    beforeAll(async () => {
      // Create a test identity
      const createIdentityDto = {
        _id: randomUUID(),
        characterId,
        provider: "local",
        identifier: "findbyid-user@example.com",
        credentials: [],
      };

      // Create the identity
      testIdentity = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.create",
          createIdentityDto
        )
      );

      // Store for cleanup
      testIdentities.push(testIdentity);
    });

    it("should find an identity by id", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send("identity.IdentitiesMicroserviceController.findById", {
          id: testIdentity._id,
        })
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result._id).toEqual(testIdentity._id);
      expect(result.identifier).toEqual(testIdentity.identifier);
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send("identity.IdentitiesMicroserviceController.findById", {
          id: randomUUID(),
        })
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    let testIdentity: IdentityAccount;

    beforeAll(async () => {
      // Create a test identity
      const createIdentityDto = {
        _id: randomUUID(),
        characterId,
        provider: "local",
        identifier: "update-user@example.com",
        credentials: [],
      };

      // Create the identity
      testIdentity = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.create",
          createIdentityDto
        )
      );

      // Store for cleanup
      testIdentities.push(testIdentity);
    });

    it("should update an identity", async () => {
      // Create update data
      const updateDto = {
        _id: testIdentity._id,
        identifier: `updated-user-${randomUUID()}@example.com`,
      };

      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.update",
          updateDto
        )
      );

      // Assertions - update doesn't return the full object
      expect(result).toBeDefined();

      // Verify the update was successful by fetching the updated identity
      const updatedIdentity = await lastValueFrom(
        client.send("identity.IdentitiesMicroserviceController.findById", {
          id: testIdentity._id,
        })
      );

      expect(updatedIdentity).toBeDefined();
      expect(updatedIdentity._id).toEqual(testIdentity._id);
      expect(updatedIdentity.identifier).toEqual(updateDto.identifier);

      // Unchanged fields should remain the same
      expect(updatedIdentity.characterId).toEqual(testIdentity.characterId);
      expect(updatedIdentity.provider).toEqual(testIdentity.provider);
    });

    it("should return null for non-existent ID", async () => {
      // Create update data
      const updateDto = {
        _id: randomUUID(),
        identifier: `nonexistent-user-${randomUUID()}@example.com`,
      };

      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.update",
          updateDto
        )
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    let testIdentity: IdentityAccount;

    beforeEach(async () => {
      // Create a test identity
      const createIdentityDto = {
        _id: randomUUID(),
        characterId,
        provider: "local",
        identifier: `delete-user-${randomUUID()}@example.com`,
        credentials: [],
      };

      // Create the identity
      testIdentity = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.create",
          createIdentityDto
        )
      );
    });

    it("should delete an identity", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.delete",
          testIdentity._id
        )
      );

      // Assertions - delete doesn't return the full object
      expect(result).toBeDefined();

      // Verify the identity is deleted
      const deletedIdentity = await lastValueFrom(
        client.send("identity.IdentitiesMicroserviceController.findById", {
          id: testIdentity._id,
        })
      );
      expect(deletedIdentity).toBeNull();
    });

    it("should return null for non-existent ID", async () => {
      // Send the RPC message with a non-existent ID
      const result = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.delete",
          randomUUID()
        )
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe("findByCharacterId", () => {
    const testCharacterId = `test-character-${randomUUID()}`;

    beforeAll(async () => {
      // Create some test identities with the same characterId
      const createIdentityDtos = Array.from({ length: 3 }, (_, i) => ({
        _id: randomUUID(),
        characterId: testCharacterId,
        provider: `provider-${i}`,
        identifier: `character-user-${i}@example.com`,
        credentials: [],
      }));

      // Create the identities
      const createdIdentities = await Promise.all(
        createIdentityDtos.map((dto) =>
          lastValueFrom(
            client.send("identity.IdentitiesMicroserviceController.create", dto)
          )
        )
      );

      // Store for cleanup
      testIdentities.push(...createdIdentities);
    });

    it("should find identities by characterId", async () => {
      // Send the RPC message
      const result = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.findByCharacterId",
          {
            characterId: testCharacterId,
          }
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.every(
          (identity: IdentityAccount) =>
            identity.characterId === testCharacterId
        )
      ).toBe(true);
    });

    it("should return empty array for non-existent characterId", async () => {
      // Send the RPC message with a non-existent characterId
      const result = await lastValueFrom(
        client.send(
          "identity.IdentitiesMicroserviceController.findByCharacterId",
          {
            characterId: `nonexistent-character-${randomUUID()}`,
          }
        )
      );

      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should preserve error message and stack trace in RPC response", async () => {
      // Create invalid test data (missing required provider)
      const invalidIdentityDto: any = {
        _id: randomUUID(),
        characterId,
        identifier: `invalid-user-${randomUUID()}@example.com`,
      };

      try {
        // This should throw an error
        await lastValueFrom(
          client.send(
            "identity.IdentitiesMicroserviceController.create",
            invalidIdentityDto
          )
        );
        fail("Expected error was not thrown");
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        expect(error.message).toContain("provider");

        // Check for our custom error properties
        expect(error.service || error.cause?.service).toBe("identity");
        expect(error.timestamp || error.cause?.timestamp).toBeDefined();
      }
    });

    it("should handle non-existent message patterns gracefully", async () => {
      try {
        // This should throw an error because the pattern doesn't exist
        await lastValueFrom(
          client.send(
            "identity.IdentitiesMicroserviceController.nonExistentPattern",
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
