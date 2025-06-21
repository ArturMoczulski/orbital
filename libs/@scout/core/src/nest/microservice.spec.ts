import { Microservice } from "./microservice";
import { ScoutMicroservices } from "../microservice-manager/microservice-manager.service";
import { ClientProxy } from "@nestjs/microservices";
import { of, throwError } from "rxjs";
import {
  BulkCountedResponse,
  BulkOperationError,
  BulkOperationFailItem,
  BulkItemizedResponse,
  BulkResponse,
  BulkOperationResponseStatus,
  BulkOperationResultItemStatus,
  BulkOperationSuccessItem,
} from "../bulk-operations";

class TestMicroservice extends Microservice {
  constructor(
    clientProxy: ClientProxy,
    microservice: ScoutMicroservices = ScoutMicroservices.API
  ) {
    super(clientProxy, microservice);
  }

  public async testRequest<T>(message: string, params: any): Promise<T | null> {
    return await this.request<T>(message, params);
  }

  public async testStatusBulkRequest(
    message: string,
    params: any
  ): Promise<BulkResponse> {
    return await this.statusBulkRequest(message, params);
  }

  public async testCountedBulkRequest(
    message: string,
    params: any
  ): Promise<BulkCountedResponse> {
    return await this.countedBulkRequest(message, params);
  }

  public async testItemizedBulkRequest<
    DataItemType = any,
    ResultItemDataType = any,
  >(
    message: string,
    params: any
  ): Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>> {
    return await this.itemizedBulkRequest<DataItemType, ResultItemDataType>(
      message,
      params
    );
  }
}

describe("Microservice", () => {
  let microservice: TestMicroservice;
  let clientProxy: ClientProxy;

  beforeEach(() => {
    clientProxy = {
      send: jest.fn(),
    } as any;
    microservice = new TestMicroservice(clientProxy);
  });

  describe("request", () => {
    it("should send message and return raw response", async () => {
      const message = "test_message";
      const params = { foo: "bar" };
      const responseData = { result: "success" };
      (clientProxy.send as jest.Mock).mockReturnValue(of(responseData));

      const result = await microservice.testRequest(message, params);

      expect(clientProxy.send).toHaveBeenCalledWith(message, params);
      expect(result).toEqual(responseData);
    });

    it("should throw error if request fails", async () => {
      const message = "error_message";
      const params = {};
      const error = new Error("Network error");
      (clientProxy.send as jest.Mock).mockReturnValue(throwError(() => error));

      const promise = microservice.testRequest(message, params);
      await expect(promise).rejects.toThrow("Network error");
    });
  });

  describe("statusBulkRequest", () => {
    it("should return hydrated BulkOperationResponse on success", async () => {
      const message = "status_message";
      const params = { foo: "bar" };
      const responseData = {
        status: BulkOperationResponseStatus.SUCCESS,
        data: { result: "success" },
      };
      (clientProxy.send as jest.Mock).mockReturnValue(of(responseData));

      const result = await microservice.testStatusBulkRequest(message, params);

      expect(clientProxy.send).toHaveBeenCalledWith(message, params);
      expect(result).toBeInstanceOf(BulkResponse);
      expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
    });

    it("should throw BulkOperationError on failure", async () => {
      const message = "error_message";
      const params = {};
      const error = new Error("Network error");
      (clientProxy.send as jest.Mock).mockReturnValue(throwError(() => error));

      const promise = microservice.testStatusBulkRequest(message, params);
      await expect(promise).rejects.toBeInstanceOf(BulkOperationError);
      await expect(promise).rejects.toHaveProperty("error", error);
    });
  });

  describe("countedBulkRequest", () => {
    it("should return hydrated BulkCountedResponse on success", async () => {
      const message = "counted_message";
      const params = { ids: [1, 2, 3] };
      const responseData = {
        status: BulkOperationResponseStatus.PARTIAL_SUCCESS,
        counts: { success: 2, fail: 1 },
        data: { extra: "info" },
      };
      (clientProxy.send as jest.Mock).mockReturnValue(of(responseData));

      const result = await microservice.testCountedBulkRequest(message, params);

      expect(clientProxy.send).toHaveBeenCalledWith(message, params);
      expect(result).toBeInstanceOf(BulkCountedResponse);
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
      expect(result.counts).toEqual({ success: 2, fail: 1 });
    });

    it("should throw BulkOperationError on failure", async () => {
      const message = "error_message";
      const params = {};
      const error = new Error("Network error");
      (clientProxy.send as jest.Mock).mockReturnValue(throwError(() => error));

      const promise = microservice.testCountedBulkRequest(message, params);
      await expect(promise).rejects.toBeInstanceOf(BulkOperationError);
      await expect(promise).rejects.toHaveProperty("error", error);
    });
  });

  describe("itemizedBulkRequest", () => {
    it("should return hydrated BulkItemizedResponse on success", async () => {
      const message = "itemized_message";
      const params = { items: [1, 2, 3] };
      const responseData = {
        status: BulkOperationResponseStatus.PARTIAL_SUCCESS,
        items: {
          success: [
            {
              item: "item1",
              status: BulkOperationResultItemStatus.SUCCESS,
              data: 42,
            },
          ],
          fail: [
            {
              item: "item2",
              status: BulkOperationResultItemStatus.FAIL,
              error: { message: "Failed" },
            },
          ],
        },
        counts: { success: 1, fail: 1 },
        data: { extra: "info" },
      };
      (clientProxy.send as jest.Mock).mockReturnValue(of(responseData));

      const result = await microservice.testItemizedBulkRequest<string, number>(
        message,
        params
      );

      expect(clientProxy.send).toHaveBeenCalledWith(message, params);
      expect(result).toBeInstanceOf(BulkItemizedResponse);
      expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
      expect(result.items.success).toHaveLength(1);
      expect(result.items.success[0]).toBeInstanceOf(BulkOperationSuccessItem);
      expect(result.items.success[0].item).toBe("item1");
      expect(result.items.success[0].data).toBe(42);
      expect(result.items.fail).toHaveLength(1);
      expect(result.items.fail[0]).toBeInstanceOf(BulkOperationFailItem);
      expect(result.items.fail[0].item).toBe("item2");
      expect(result.items.fail[0].error).toEqual({ message: "Failed" });
      expect(result.counts).toEqual({ success: 1, fail: 1 });
    });

    it("should throw BulkOperationError on failure", async () => {
      const message = "error_message";
      const params = {};
      const error = new Error("Network error");
      (clientProxy.send as jest.Mock).mockReturnValue(throwError(() => error));

      const promise = microservice.testItemizedBulkRequest(message, params);
      await expect(promise).rejects.toBeInstanceOf(BulkOperationError);
      await expect(promise).rejects.toHaveProperty("error", error);
    });

    it("should handle generic types correctly", async () => {
      const message = "typed_itemized_message";
      const params = { items: ["a", "b"] };
      const responseData = {
        status: BulkOperationResponseStatus.SUCCESS,
        items: {
          success: [
            {
              item: "a",
              status: BulkOperationResultItemStatus.SUCCESS,
              data: 1,
            },
            {
              item: "b",
              status: BulkOperationResultItemStatus.SUCCESS,
              data: 2,
            },
          ],
          fail: [],
        },
        counts: { success: 2, fail: 0 },
      };
      (clientProxy.send as jest.Mock).mockReturnValue(of(responseData));

      const result = await microservice.testItemizedBulkRequest<string, number>(
        message,
        params
      );

      expect(result.items.success[0].item).toBe("a");
      expect(result.items.success[0].data).toBe(1);
      expect(result.items.success[1].item).toBe("b");
      expect(result.items.success[1].data).toBe(2);
    });
  });
});
