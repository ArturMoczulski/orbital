import {
  BulkOperationFailItem,
  BulkOperationResultItem,
  BulkOperationSuccessItem,
} from "./bulk-operation-result-item";
import { BulkOperationResultItemStatus } from "./types";

describe("BulkOperationResultItem", () => {
  it("should create BulkOperationSuccessItem from valid success JSON", () => {
    const json = {
      item: "item1",
      status: BulkOperationResultItemStatus.SUCCESS,
      data: 42,
    };
    const result = BulkOperationResultItem.fromJson(json);

    expect(result).toBeInstanceOf(BulkOperationSuccessItem);
    expect(result.item).toBe("item1");
    expect(result.status).toBe(BulkOperationResultItemStatus.SUCCESS);
    expect(result.data).toBe(42);
    expect(result.error).toBeUndefined();
  });

  it("should create BulkOperationFailItem from valid fail JSON", () => {
    const json = {
      item: "item2",
      status: BulkOperationResultItemStatus.FAIL,
      error: { message: "Failed" },
    };
    const result = BulkOperationResultItem.fromJson(json);

    expect(result).toBeInstanceOf(BulkOperationFailItem);
    expect(result.item).toBe("item2");
    expect(result.status).toBe(BulkOperationResultItemStatus.FAIL);
    expect(result.error).toEqual({ message: "Failed" });
    expect(result.data).toBeUndefined();
  });

  it("should throw error for invalid JSON (missing status)", () => {
    const json = { item: "item1", data: 42 };
    expect(() => BulkOperationResultItem.fromJson(json)).toThrow(
      "Invalid JSON format for BulkOperationResultItem"
    );
  });
});
