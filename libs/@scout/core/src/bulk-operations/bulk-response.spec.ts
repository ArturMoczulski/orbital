import { BulkOperationError, BulkResponse } from "./bulk-response";
import { BulkOperationResponseStatus } from "./types";

describe("BulkOperationResponse", () => {
  it("should create instance from valid JSON", () => {
    const json = { status: BulkOperationResponseStatus.SUCCESS };
    const result = BulkResponse.fromJson(json);

    expect(result).toBeInstanceOf(BulkResponse);
    expect(result.status).toBe(BulkOperationResponseStatus.SUCCESS);
  });

  it("should throw error for invalid JSON (missing status)", () => {
    const json = {};
    expect(() => BulkResponse.fromJson(json)).toThrow(
      "Invalid JSON format for BulkOperationResponse"
    );
  });

  it("should throw error for invalid JSON (status not a number)", () => {
    const json = { status: "invalid" };
    expect(() => BulkResponse.fromJson(json)).toThrow(
      "Invalid JSON format for BulkOperationResponse"
    );
  });
});

describe("BulkOperationError", () => {
  it("should create instance from valid JSON with plain error object", () => {
    const json = {
      status: BulkOperationResponseStatus.FAIL,
      error: { message: "Test error", stack: "stack trace" },
    };
    const result = BulkOperationError.fromJson(json);

    expect(result).toBeInstanceOf(BulkOperationError);
    expect(result.status).toBe(BulkOperationResponseStatus.FAIL);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Test error");
    expect(result.stack).toBe("stack trace");
  });

  it("should create instance from valid JSON with simple error string", () => {
    const json = {
      status: BulkOperationResponseStatus.FAIL,
      error: "Simple error",
    };
    const result = BulkOperationError.fromJson(json);

    expect(result).toBeInstanceOf(BulkOperationError);
    expect(result.status).toBe(BulkOperationResponseStatus.FAIL);
    expect(result.message).toBe("Simple error");
  });

  it("should throw error for invalid JSON (missing status)", () => {
    const json = { error: { message: "Test error" } };
    expect(() => BulkOperationError.fromJson(json)).toThrow(
      "Invalid JSON format for BulkOperationError"
    );
  });
});
