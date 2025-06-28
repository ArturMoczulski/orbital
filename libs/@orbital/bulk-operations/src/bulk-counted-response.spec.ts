import { BulkCountedResponse } from "./bulk-counted-response";
import { BulkOperationResponseStatus } from "./types";

describe("BulkCountedResponse", () => {
  it("should create instance from valid JSON", () => {
    const json = {
      status: BulkOperationResponseStatus.PARTIAL_SUCCESS,
      counts: { success: 5, fail: 2 },
    };
    const result = BulkCountedResponse.fromJson(json);

    expect(result).toBeInstanceOf(BulkCountedResponse);
    expect(result.status).toBe(BulkOperationResponseStatus.PARTIAL_SUCCESS);
    expect(result.counts).toEqual({ success: 5, fail: 2 });
  });

  it("should throw error for invalid JSON (missing status)", () => {
    const json = { counts: { success: 5, fail: 2 } };
    expect(() => BulkCountedResponse.fromJson(json)).toThrow(
      "Invalid JSON format for BulkCountedResponse"
    );
  });

  it("should throw error for invalid JSON (missing counts)", () => {
    const json = { status: BulkOperationResponseStatus.SUCCESS };
    expect(() => BulkCountedResponse.fromJson(json)).toThrow(
      "Invalid JSON format for BulkCountedResponse"
    );
  });

  it("should handle missing count values with defaults", () => {
    const json = {
      status: BulkOperationResponseStatus.SUCCESS,
      counts: { success: 3 }, // missing fail
    };
    const result = BulkCountedResponse.fromJson(json);

    expect(result.counts).toEqual({ success: 3, fail: 0 });
  });
});
