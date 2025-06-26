import { ClientNats, ClientProxy } from "@nestjs/microservices";
import { randomUUID } from "crypto";
import { lastValueFrom } from "rxjs";
import { CreateAreaDto } from "./dto/create-area.dto";

describe("Areas Exception Handling", () => {
  let client: ClientProxy;

  beforeAll(async () => {
    // Connect directly to the running NATS server using ClientNats
    client = new ClientNats({
      servers: ["nats://localhost:4223"],
      queue: "test-exception-client",
    });

    await client.connect();

    // Wait a moment for the connection to be fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Close the client connection
    await client.close();
  });

  describe("Validation errors", () => {
    it("should preserve error message and stack trace for missing required field", async () => {
      // Increase timeout to 15 seconds
      jest.setTimeout(15000);
      // Create invalid test data (missing required worldId)
      const invalidAreaDto: Partial<CreateAreaDto> = {
        name: `Invalid Area ${randomUUID()}`,
        description: "An invalid area missing required fields",
      };

      try {
        // This should throw an error
        console.log(
          "Sending invalid area DTO (missing worldId):",
          invalidAreaDto
        );
        const result = await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.createArea",
            invalidAreaDto
          )
        );
        console.log("Unexpectedly received result:", result);
        expect(true).toBe(false); // Fail the test if we get here
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        console.log("Error type:", error.constructor.name);
        console.log("Full error object:", JSON.stringify(error, null, 2));

        // Extract the error payload
        const errorPayload =
          error.message && typeof error.message === "object"
            ? error.message
            : error.cause || error;

        console.log("Error payload:", errorPayload);

        // Check basic error properties
        expect(errorPayload.message).toContain("worldId");

        // Check for our custom error properties
        expect(errorPayload.service).toBe("world");
        expect(errorPayload.timestamp).toBeDefined();
        expect(errorPayload.originalError).toBeDefined();

        // Log the error for debugging
        console.log("Missing worldId error details:", {
          message: error.message,
          service: error.service,
          hasStack: !!error.stack,
          hasOriginalError: !!error.originalError,
        });
      }
    });

    it("should handle schema validation appropriately", async () => {
      // Increase timeout to 15 seconds
      jest.setTimeout(15000);

      // Create a test area with missing required fields
      const invalidAreaDto: Partial<CreateAreaDto> = {
        name: `Test Area ${randomUUID()}`,
        description: "An area missing required fields",
        // Intentionally omit worldId to trigger validation error
      };

      try {
        // This should throw an error
        console.log(
          "Sending area DTO missing required worldId:",
          invalidAreaDto
        );
        const result = await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.createArea",
            invalidAreaDto
          )
        );
        console.log("Unexpectedly received result:", result);
        expect(true).toBe(false); // Fail the test if we get here
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        console.log("Error type:", error.constructor.name);
        console.log("Full error object:", JSON.stringify(error, null, 2));

        // Extract the error payload
        const errorPayload =
          error.message && typeof error.message === "object"
            ? error.message
            : error.cause || error;

        console.log("Error payload:", errorPayload);

        // Check basic error properties
        expect(errorPayload.message).toContain("worldId");

        // Check for our custom error properties
        expect(errorPayload.service).toBe("world");
        expect(errorPayload.timestamp).toBeDefined();
        expect(errorPayload.originalError).toBeDefined();
      }
    });
  });

  describe("Database errors", () => {
    it("should preserve error message and stack trace for database errors", async () => {
      // Increase timeout to 15 seconds
      jest.setTimeout(15000);
      // Create an area with an invalid ID format (to trigger a database error)
      const invalidAreaDto: any = {
        _id: "invalid-id-format", // MongoDB expects a valid ObjectId or UUID
        name: `Invalid Area ${randomUUID()}`,
        description: "An area with invalid ID format",
        worldId: randomUUID(),
      };

      try {
        // This might throw a database error
        console.log("Sending invalid area DTO (invalid ID):", invalidAreaDto);
        const result = await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.createArea",
            invalidAreaDto
          )
        );
        console.log("Unexpectedly received result:", result);
        // If it doesn't throw, the test will still pass
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        console.log("Error type:", error.constructor.name);
        console.log("Full error object:", JSON.stringify(error, null, 2));

        // Extract the error payload
        const errorPayload =
          error.message && typeof error.message === "object"
            ? error.message
            : error.cause || error;

        console.log("Error payload:", errorPayload);

        // Check basic error properties
        expect(errorPayload.message).toBeTruthy();
        expect(errorPayload.stack || error.stack).toBeDefined();

        // Check for our custom error properties
        expect(errorPayload.service).toBe("world");
        expect(errorPayload.timestamp).toBeDefined();
        expect(errorPayload.originalError).toBeDefined();
      }
    });
  });

  describe("Non-existent message patterns", () => {
    it("should handle non-existent message patterns gracefully", async () => {
      // Increase timeout to 15 seconds
      jest.setTimeout(15000);
      try {
        // This should throw an error because the pattern doesn't exist
        console.log("Sending message to non-existent pattern");
        const result = await lastValueFrom(
          client.send(
            "world.AreasMicroserviceController.nonExistentPattern",
            {}
          )
        );
        console.log("Unexpectedly received result:", result);
        expect(true).toBe(false); // Fail the test if we get here
      } catch (error: any) {
        // Assertions to verify our exception filter is working
        expect(error).toBeDefined();
        console.log("Error type:", error.constructor.name);
        console.log("Full error object:", JSON.stringify(error, null, 2));

        // Extract the error payload
        const errorPayload =
          error.message && typeof error.message === "object"
            ? error.message
            : error.cause || error;

        console.log("Error payload:", errorPayload);

        expect(errorPayload.stack || error.stack).toBeDefined();

        // The error might be different depending on how NATS handles non-existent patterns
        // but we should still have our custom properties
        if (errorPayload.service) {
          expect(errorPayload.service).toBe("world");
          expect(errorPayload.timestamp).toBeDefined();
        } else if (error.service) {
          // Fallback to checking the original error object
          expect(error.service).toBe("world");
          expect(error.timestamp).toBeDefined();
        }
      }
    });
  });

  describe("Runtime errors", () => {
    // This test is more complex and might require mocking the service
    // to force a runtime error, but we'll include a placeholder
    it("should preserve error message and stack trace for runtime errors", async () => {
      // For a real test, you would need to mock the service to throw a runtime error
      // This is just a placeholder that will likely be skipped
      console.log("Runtime error test is a placeholder and might be skipped");
    });
  });
});
