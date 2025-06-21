import { BulkResponse } from "./bulk-response";
import { BulkOperationResponseDTO, BulkOperationResponseStatus } from "./types";
import * as stringify from "json-stringify-safe";

export class BulkCountedResponse<
  G extends string = never,
> extends BulkResponse {
  constructor(
    public status?: BulkOperationResponseStatus,
    public counts?: { success: number; fail: number } & {
      [K in G]: { success: number; fail: number };
    }
  ) {
    super(status);
    this.counts = counts;
  }

  static fromJson(json: any): BulkCountedResponse<string> {
    BulkCountedResponse.validateJson(json);

    const countsBase = {
      success:
        typeof json.counts.success === "number" ? json.counts.success : 0,
      fail: typeof json.counts.fail === "number" ? json.counts.fail : 0,
    };
    const groupEntries = Object.entries(json.counts).reduce(
      (acc, [key, value]) => {
        if (
          key !== "success" &&
          key !== "fail" &&
          typeof value === "object" &&
          value !== null
        ) {
          acc[key] = {
            success:
              typeof (value as any).success === "number"
                ? (value as any).success
                : 0,
            fail:
              typeof (value as any).fail === "number" ? (value as any).fail : 0,
          };
        }
        return acc;
      },
      {} as Record<string, { success: number; fail: number }>
    );
    const counts = { ...countsBase, ...groupEntries };
    return new BulkCountedResponse<string>(
      json.status as BulkOperationResponseStatus,
      counts as any
    );
  }

  static validateJson(json: BulkOperationResponseDTO) {
    if (!json) {
      throw new Error(
        `Invalid JSON format for BulkCountedResponse: no data provided ${stringify(
          json
        )}`
      );
    }

    if (json.status === undefined) {
      throw new Error(
        `Invalid JSON format for BulkCountedResponse: no status in response object: ${stringify(
          json
        )}`
      );
    }

    if (
      ![
        BulkOperationResponseStatus.FAIL,
        BulkOperationResponseStatus.PARTIAL_SUCCESS,
        BulkOperationResponseStatus.SUCCESS,
      ].includes(json.status)
    ) {
      throw new Error(
        `Invalid JSON format for BulkItemizedResponse: status ${stringify(
          json.status
        )} not supported`
      );
    }

    if (!json.counts) {
      throw new Error(
        `Invalid JSON format for BulkCountedResponse: no counts in response object: ${stringify(
          json
        )}`
      );
    }
  }

  toString() {
    return `${super.toString()} | Total: ${
      this.counts.success + this.counts.fail
    }: ✅ ${this.counts.success}${
      this.counts.fail > 0 ? " ❌ " + this.counts.fail : ""
    }`;
  }

  complete(): this {
    this.status =
      this.counts.success === 0
        ? BulkOperationResponseStatus.FAIL
        : this.counts.fail > 0
          ? BulkOperationResponseStatus.PARTIAL_SUCCESS
          : BulkOperationResponseStatus.SUCCESS;
    return this;
  }

  total() {
    return this.counts.success + this.counts.fail;
  }
}
