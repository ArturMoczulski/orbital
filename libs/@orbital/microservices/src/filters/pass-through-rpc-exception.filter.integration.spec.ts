import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import {
  Controller,
  INestApplication,
  Injectable,
  Module,
  UseFilters,
} from "@nestjs/common";
import {
  ClientsModule,
  MessagePattern,
  MicroserviceOptions,
  NatsOptions,
  Transport,
} from "@nestjs/microservices";
import { Test, TestingModule } from "@nestjs/testing";
import { lastValueFrom } from "rxjs";
import { RemoteMicroserviceError } from "../errors";
import { PassThroughRpcExceptionFilter } from "./pass-through-rpc-exception.filter";

// Define fail function since it's not exported from @jest/globals
const fail = (message: string): void => {
  throw new Error(message);
};

// Test service that will throw different types of errors
@Injectable()
class TestService {
  throwStandardError() {
    throw new Error("Standard error from service");
  }

  throwCustomError() {
    const error = new Error("Custom error with extra properties");
    (error as any).customProp = "custom value";
    throw error;
  }

  throwNonErrorObject() {
    throw { message: "This is not an Error object", code: "CUSTOM_CODE" };
  }

  throwString() {
    throw "Just a string error";
  }
}

// Test controller that exposes methods via MessagePattern
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("test-service"))
class TestController {
  constructor(private readonly testService: TestService) {}

  @MessagePattern("test.standardError")
  handleStandardError() {
    return this.testService.throwStandardError();
  }

  @MessagePattern("test.customError")
  handleCustomError() {
    return this.testService.throwCustomError();
  }

  @MessagePattern("test.nonErrorObject")
  handleNonErrorObject() {
    return this.testService.throwNonErrorObject();
  }

  @MessagePattern("test.stringError")
  handleStringError() {
    return this.testService.throwString();
  }

  @MessagePattern("test.success")
  handleSuccess() {
    return { success: true, message: "This should succeed" };
  }
}

// Module for the test application
@Module({
  providers: [TestService],
  controllers: [TestController],
})
class TestModule {}

// Client module for testing
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "TEST_CLIENT",
        transport: Transport.NATS,
        options: {
          servers: ["nats://localhost:4223"],
          queue: "test-client-queue",
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
class TestClientModule {}

describe("PassThroughRpcExceptionFilter Integration", () => {
  let app: INestApplication;
  let clientModule: TestingModule;
  let client: any;

  beforeAll(async () => {
    // Create the test application
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Configure the app to use microservices
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: {
        servers: ["nats://localhost:4223"],
        queue: "test-server-queue",
      } as NatsOptions,
    });

    // Start the microservice
    await app.startAllMicroservices();
    await app.init();

    // Create the client module
    clientModule = await Test.createTestingModule({
      imports: [TestClientModule],
    }).compile();

    // Get the client
    client = clientModule.get("TEST_CLIENT");
    await client.connect();

    // Wait a moment for the connection to be fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 30000); // Increase timeout for setup

  afterAll(async () => {
    // Close the client and application
    await client.close();
    await app.close();
  });

  it("should successfully handle a valid request", async () => {
    // This should succeed
    const result = await lastValueFrom(client.send("test.success", {}));
    expect(result).toEqual({ success: true, message: "This should succeed" });
  });

  it("should properly transform standard Error objects", async () => {
    try {
      // This should throw
      await lastValueFrom(client.send("test.standardError", {}));
      fail("Expected an error to be thrown");
    } catch (error) {
      // The error might not be a RemoteMicroserviceError in the integration test
      // so we need to handle both cases
      // Add more debugging information
      console.log("Caught error type:", (error as any).constructor?.name);
      console.log(
        "Caught error instanceof RemoteMicroserviceError:",
        error instanceof RemoteMicroserviceError
      );
      console.log(
        "Caught error has getError method:",
        typeof (error as any).getError === "function"
      );
      console.log(
        "Caught error properties:",
        Object.getOwnPropertyNames(error as object)
      );
      console.log("Caught error JSON:", JSON.stringify(error, null, 2));

      let errorData: any;
      if (
        error instanceof RemoteMicroserviceError &&
        typeof (error as any).getError === "function"
      ) {
        errorData = (error as RemoteMicroserviceError).getError();
        console.log("Using RemoteMicroserviceError.getError()");
      } else {
        // If it's not a RemoteMicroserviceError, use the error directly
        errorData = error;
        console.log("Using error directly");
      }

      console.log("Error data:", errorData);

      // Verify the error is properly transformed
      // The error is not a RemoteMicroserviceError instance, but it has a payload property
      // that contains the information we need
      const payload = errorData.payload || errorData.cause || errorData;
      expect(payload.service).toBe("test-service");
      expect(payload.message).toBe("Standard error from service");
      expect(payload.originalError).toBeDefined();
      expect(payload.originalError.name).toBe("Error");
      expect(payload.originalError.message).toBe("Standard error from service");
      expect(payload.timestamp).toBeDefined();
    }
  });

  it("should preserve custom properties in Error objects", async () => {
    try {
      // This should throw
      await lastValueFrom(client.send("test.customError", {}));
      fail("Expected an error to be thrown");
    } catch (error) {
      // The error might not be a RemoteMicroserviceError in the integration test
      // so we need to handle both cases
      let errorData: any;
      if (
        error instanceof RemoteMicroserviceError &&
        typeof (error as any).getError === "function"
      ) {
        errorData = (error as RemoteMicroserviceError).getError();
      } else {
        // If it's not a RemoteMicroserviceError, use the error directly
        errorData = error;
      }

      // Verify the error is properly transformed
      // The error is not a RemoteMicroserviceError instance, but it has a payload property
      // that contains the information we need
      const payload = errorData.payload || errorData.cause || errorData;
      expect(payload.service).toBe("test-service");
      expect(payload.message).toBe("Custom error with extra properties");
      expect(payload.originalError).toBeDefined();
      expect(payload.originalError.name).toBe("Error");
      expect(payload.originalError.message).toBe(
        "Custom error with extra properties"
      );
      expect(payload.originalError.customProp).toBe("custom value");
      expect(payload.timestamp).toBeDefined();
    }
  });

  it("should handle non-Error objects", async () => {
    try {
      // This should throw
      await lastValueFrom(client.send("test.nonErrorObject", {}));
      fail("Expected an error to be thrown");
    } catch (error) {
      // Type assertion for the caught error
      // The error might not be a RemoteMicroserviceError in the integration test
      // so we need to handle both cases
      let errorData: any;
      if (
        error instanceof RemoteMicroserviceError &&
        typeof (error as any).getError === "function"
      ) {
        errorData = (error as RemoteMicroserviceError).getError();
      } else {
        // If it's not a RemoteMicroserviceError, use the error directly
        errorData = error;
      }

      // Verify the error is properly transformed
      // The error is not a RemoteMicroserviceError instance, but it has a payload property
      // that contains the information we need
      const payload = errorData.payload || errorData.cause || errorData;
      expect(payload.service).toBe("test-service");
      expect(payload.code).toBe("INTERNAL_SERVER_ERROR");
      expect(payload.originalError).toBeDefined();
      expect(payload.originalError.data).toContain("CUSTOM_CODE");
      expect(payload.timestamp).toBeDefined();
    }
  });

  it("should handle string errors", async () => {
    try {
      // This should throw
      await lastValueFrom(client.send("test.stringError", {}));
      fail("Expected an error to be thrown");
    } catch (error) {
      // Type assertion for the caught error
      // The error might not be a RemoteMicroserviceError in the integration test
      // so we need to handle both cases
      let errorData: any;
      if (
        error instanceof RemoteMicroserviceError &&
        typeof (error as any).getError === "function"
      ) {
        errorData = (error as RemoteMicroserviceError).getError();
      } else {
        // If it's not a RemoteMicroserviceError, use the error directly
        errorData = error;
      }

      // Verify the error is properly transformed
      // The error is not a RemoteMicroserviceError instance, but it has a payload property
      // that contains the information we need
      const payload = errorData.payload || errorData.cause || errorData;
      expect(payload.service).toBe("test-service");
      expect(payload.code).toBe("INTERNAL_SERVER_ERROR");
      expect(payload.message).toBe("Just a string error");
      expect(payload.originalError).toBeDefined();
      expect(payload.timestamp).toBeDefined();
    }
  });
});
