import { BulkOperationResponseStatus } from "./types";

export interface BulkResponseConstructor<T extends BulkResponse> {
  new (...args: any[]): T;
  fromJson(json: any): T;
}

export class BulkResponse {
  constructor(public status?: BulkOperationResponseStatus) {}

  static fromJson(json: any): BulkResponse {
    if (!json || typeof json.status !== "number") {
      throw new Error("Invalid JSON format for BulkOperationResponse");
    }
    return new BulkResponse(json.status as BulkOperationResponseStatus);
  }

  toString() {
    const statusName =
      this.status !== undefined
        ? BulkOperationResponseStatus[this.status]
        : "UNKNOWN";
    return `${this.constructor.name} (${statusName})`;
  }

  complete(): this {
    return this;
  }
}

export class BulkOperationError extends Error {
  public status: BulkOperationResponseStatus = BulkOperationResponseStatus.FAIL;
  public response?: BulkResponse;
  public originalError?: Error | any;

  constructor(error: Error | any, response?: BulkResponse) {
    super(error?.message);
    this.stack = error.stack;
    this.originalError = error; // Store the original error

    if (response) {
      this.response = response;
    }
  }

  /**
   * Gets the original error that was wrapped
   * @returns The original error that was wrapped
   */
  getOriginalError(): Error | any {
    return this.originalError;
  }

  static fromJson(json: any): BulkOperationError {
    if (!json || typeof json.status !== "number") {
      throw new Error("Invalid JSON format for BulkOperationError");
    }
    const error =
      json.error instanceof Error
        ? json.error
        : json.error && typeof json.error === "object"
          ? Object.assign(
              new Error(json.error.message || "Unknown error"),
              json.error
            )
          : json.error;
    const instance = new BulkOperationError(error);
    instance.status = json.status as BulkOperationResponseStatus;
    return instance;
  }
}
