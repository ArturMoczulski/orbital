// microservice-decorators.spec.ts
import { of } from "rxjs";
import {
  MicroserviceCountedBulkRequest,
  MicroserviceItemizedBulkRequest,
  MicroserviceRequest,
  MicroserviceStatusBulkRequest,
} from "./decorators";
import { Microservice } from "./microservice";

// For testing purposes, define a dummy BulkItemizedResponse type if not already provided.
interface DummyBulkItemizedResponse<DataItemType, ResultItemDataType> {
  response: string;
}

// Helper type for method parameters.
type MethodParams = any[];

// Create test classes that extend Microservice and decorate a simple method.

class TestMicroserviceRequest extends Microservice {
  @MicroserviceRequest("testRequest")
  decoratedMethod(...args: any[]): any {
    // Simply return the received arguments.
    return args;
  }
}

class TestMicroserviceStatusBulkRequest extends Microservice {
  @MicroserviceStatusBulkRequest("testStatusBulk")
  decoratedMethod(...args: any[]): any {
    return args;
  }
}

class TestMicroserviceCountedBulkRequest extends Microservice {
  @MicroserviceCountedBulkRequest("testCountedBulk")
  decoratedMethod(...args: any[]): any {
    return args;
  }
}

class TestMicroserviceItemizedBulkRequest extends Microservice {
  @MicroserviceItemizedBulkRequest<string, number>("testItemizedBulk")
  decoratedMethod(...args: any[]): any {
    return args;
  }
}

describe(`@Microservice decorators`, () => {
  let clientProxyMock: any = {};
  clientProxyMock.send = jest.fn().mockReturnValue(of(clientProxyMock));
  clientProxyMock.pipe = jest.fn().mockReturnValue(of(clientProxyMock));

  describe("MicroserviceRequest decorator", () => {
    it("should call the base request method and append its response", async () => {
      const instance = new TestMicroserviceRequest(clientProxyMock as any);
      const result = await instance.decoratedMethod("arg1", "arg2");
      expect(result).toEqual(["arg1", "arg2", "requestResponse"]);
    });
  });

  describe("MicroserviceStatusBulkRequest decorator", () => {
    it("should call the base statusBulkRequest method and append its response", async () => {
      const instance = new TestMicroserviceStatusBulkRequest(
        clientProxyMock as any
      );
      const result = await instance.decoratedMethod("a", "b");
      expect(result).toEqual(["a", "b", "statusBulkResponse"]);
    });
  });

  describe("MicroserviceCountedBulkRequest decorator", () => {
    it("should call the base countedBulkRequest method and append its response", async () => {
      const instance = new TestMicroserviceCountedBulkRequest(
        clientProxyMock as any
      );
      const result = await instance.decoratedMethod("x", "y");
      expect(result).toEqual(["x", "y", "countedBulkResponse"]);
    });
  });

  describe("MicroserviceItemizedBulkRequest decorator", () => {
    it("should call the base itemizedBulkRequest method and append its response", async () => {
      const instance = new TestMicroserviceItemizedBulkRequest(
        clientProxyMock as any
      );
      const result = await instance.decoratedMethod("p", "q");
      expect(result).toEqual(["p", "q", { response: "itemizedBulkResponse" }]);
    });
  });
});
