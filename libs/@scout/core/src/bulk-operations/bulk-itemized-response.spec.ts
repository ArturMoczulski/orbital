import { BulkItemizedResponse } from "./bulk-itemized-response";
import {
  BulkOperationResponseDTO,
  BulkOperationResponseStatus,
  BulkOperationResultItemStatus,
} from "./types";
import {
  BulkOperationResultItem,
  BulkOperationSuccessItem,
  BulkOperationFailItem,
} from "./bulk-operation-result-item";

describe("BulkItemizedResponse", () => {
  // Test data
  const successItems = [
    new BulkOperationSuccessItem("item1", 42),
    new BulkOperationSuccessItem("item2", 43),
  ];
  const failItems = [
    new BulkOperationFailItem("item3", undefined, { message: "Failed" }),
  ];

  let response: BulkItemizedResponse<string, number>;

  beforeEach(() => {
    response = new BulkItemizedResponse<string, number>(
      BulkOperationResponseStatus.PARTIAL_SUCCESS,
      {
        success: [...successItems], // Clone to avoid mutation issues
        fail: [...failItems],
      }
    );
  });

  describe("Iterator", () => {
    it("should iterate over all items (success then fail) in order", () => {
      const iteratedItems: BulkOperationResultItem<string, number>[] = [];
      for (const item of response) {
        iteratedItems.push(item);
      }

      expect(iteratedItems).toHaveLength(3);
      expect(iteratedItems[0]).toEqual(successItems[0]);
      expect(iteratedItems[1]).toEqual(successItems[1]);
      expect(iteratedItems[2]).toEqual(failItems[0]);
    });

    it("should work with spread operator", () => {
      const spreadItems = [...response];
      expect(spreadItems).toHaveLength(3);
      expect(spreadItems[0].item).toBe("item1");
      expect(spreadItems[1].item).toBe("item2");
      expect(spreadItems[2].item).toBe("item3");
    });

    it("should work with Array.from", () => {
      const arrayItems = Array.from(response);
      expect(arrayItems).toHaveLength(3);
      expect(arrayItems[0].data).toBe(42);
      expect(arrayItems[1].data).toBe(43);
      expect(arrayItems[2].error).toEqual({ message: "Failed" });
    });

    it("should handle empty response", () => {
      const emptyResponse = new BulkItemizedResponse<string, number>();
      const iteratedItems = [...emptyResponse];
      expect(iteratedItems).toHaveLength(0);
    });
  });

  describe("forFails helper method", () => {
    it("should call callback for each failed item with correct index", () => {
      const mockCallback = jest.fn();
      response.forFails(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(failItems[0], 0);
    });

    it("should not call callback when there are no failed items", () => {
      const emptyFailResponse = new BulkItemizedResponse<string, number>(
        BulkOperationResponseStatus.SUCCESS,
        {
          success: successItems,
          fail: [],
        }
      );
      const mockCallback = jest.fn();
      emptyFailResponse.forFails(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should process multiple failed items correctly", () => {
      const multiFailResponse = new BulkItemizedResponse<string, number>(
        BulkOperationResponseStatus.PARTIAL_SUCCESS,
        {
          success: successItems,
          fail: [
            new BulkOperationFailItem("item3", undefined, {
              message: "Fail 1",
            }),
            new BulkOperationFailItem("item4", undefined, {
              message: "Fail 2",
            }),
          ],
        }
      );
      const collectedItems: BulkOperationResultItem<string, number>[] = [];
      multiFailResponse.forFails((item, index) => {
        collectedItems.push(item);
      });

      expect(collectedItems).toHaveLength(2);
      expect(collectedItems[0].item).toBe("item3");
      expect(collectedItems[1].item).toBe("item4");
    });
  });

  describe("forSuccesses helper method", () => {
    it("should call callback for each successful item with correct index", () => {
      const mockCallback = jest.fn();
      response.forSuccesses(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith(successItems[0], 0);
      expect(mockCallback).toHaveBeenCalledWith(successItems[1], 1);
    });

    it("should not call callback when there are no successful items", () => {
      const emptySuccessResponse = new BulkItemizedResponse<string, number>(
        BulkOperationResponseStatus.FAIL,
        { success: [], fail: failItems }
      );
      const mockCallback = jest.fn();
      emptySuccessResponse.forSuccesses(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should process multiple successful items correctly", () => {
      const collectedItems: BulkOperationResultItem<string, number>[] = [];
      response.forSuccesses((item, index) => {
        collectedItems.push(item);
      });

      expect(collectedItems).toHaveLength(2);
      expect(collectedItems[0].data).toBe(42);
      expect(collectedItems[1].data).toBe(43);
    });
  });

  it("should create instance from valid JSON with success and fail items", () => {
    const json = {
      status: BulkOperationResponseStatus.PARTIAL_SUCCESS,
      counts: { success: 2, fail: 1 },
      items: {
        success: [
          {
            item: "item1",
            status: BulkOperationResultItemStatus.SUCCESS,
            data: 42,
          },
          {
            item: "item2",
            status: BulkOperationResultItemStatus.SUCCESS,
            data: 43,
          },
        ],
        fail: [
          {
            item: "item3",
            status: BulkOperationResultItemStatus.FAIL,
            error: { message: "Failed" },
          },
        ],
      },
    };
    const result = BulkItemizedResponse.fromJson(json);

    expect(result).toBeInstanceOf(BulkItemizedResponse);
    expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    expect(result.counts).toEqual({ success: 2, fail: 1 });
    expect(result.items.success).toHaveLength(2);
    expect(result.items.fail).toHaveLength(1);

    expect(result.items.success[0]).toBeInstanceOf(BulkOperationSuccessItem);
    expect(result.items.success[0].item).toBe("item1");
    expect(result.items.success[0].data).toBe(42);

    expect(result.items.success[1]).toBeInstanceOf(BulkOperationSuccessItem);
    expect(result.items.success[1].item).toBe("item2");
    expect(result.items.success[1].data).toBe(43);

    expect(result.items.fail[0]).toBeInstanceOf(BulkOperationFailItem);
    expect(result.items.fail[0].item).toBe("item3");
    expect(result.items.fail[0].error).toEqual({ message: "Failed" });
  });

  it("should use array lengths as counts if counts not provided", () => {
    const json = {
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
    };
    const result = BulkItemizedResponse.fromJson(json);

    expect(result.counts).toEqual({ success: 1, fail: 1 });
  });

  it("should handle empty items arrays", () => {
    const json = {
      status: BulkOperationResponseStatus.SUCCESS,
      counts: { success: 0, fail: 0 },
      items: { success: [], fail: [] },
    };
    const result = BulkItemizedResponse.fromJson(json);

    expect(result.items.success).toHaveLength(0);
    expect(result.items.fail).toHaveLength(0);
    expect(result.counts).toEqual({ success: 0, fail: 0 });
  });

  it("should throw error for invalid JSON (missing status)", () => {
    const json = {
      counts: { success: 2, fail: 1 },
      items: { success: [], fail: [] },
    };
    expect(() =>
      BulkItemizedResponse.fromJson(json as BulkOperationResponseDTO)
    ).toThrow("Invalid JSON format for BulkItemizedResponse");
  });
});
