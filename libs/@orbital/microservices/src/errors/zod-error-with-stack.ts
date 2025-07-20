import { ZodError } from "zod";

/**
 * ZodError with stack trace for proper serialization and transmission over RPC.
 *
 * This class wraps a ZodError but extends Error to ensure proper stack trace
 * capture. It preserves all the original ZodError details while making them
 * accessible in a way that can be properly serialized and transmitted.
 */
export class ZodErrorWithStack extends Error {
  /** The original ZodError that was thrown */
  readonly originalError: ZodError;

  /** The formatted issues from the ZodError */
  readonly issues: Array<{
    code: string;
    path: (string | number)[];
    message: string;
    // Only include optional properties that might exist on some ZodIssue types
    [key: string]: any;
  }>;

  /**
   * Creates a new ZodErrorWithStack
   *
   * @param zodError The original ZodError
   * @param message Optional custom message (defaults to the ZodError's formatted message)
   */
  constructor(zodError: ZodError, message?: string) {
    // Use the provided message or the formatted ZodError message
    super(message || zodError.message);

    // Ensure the name is set correctly for error identification
    this.name = "ZodErrorWithStack";

    // Store the original ZodError
    this.originalError = zodError;

    // Extract and store the issues in a serializable format
    this.issues = zodError.errors.map((issue) => {
      // Create a base issue object with properties common to all ZodIssue types
      const baseIssue: {
        code: string;
        path: (string | number)[];
        message: string;
        [key: string]: any;
      } = {
        code: issue.code,
        path: issue.path,
        message: issue.message,
      };

      // Add any additional properties that might exist on specific ZodIssue types
      return Object.entries(issue).reduce((acc, [key, value]) => {
        if (key !== "code" && key !== "path" && key !== "message") {
          acc[key] = value;
        }
        return acc;
      }, baseIssue);
    });

    // Capture the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZodErrorWithStack);
    }
  }

  /**
   * Creates a formatted string representation of the validation issues
   *
   * @returns A formatted string with all validation issues
   */
  formatIssues(): string {
    return this.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return `${path ? `[${path}] ` : ""}${issue.message}`;
      })
      .join("\n");
  }

  /**
   * Creates a ZodErrorWithStack from a ZodError
   *
   * @param error The error to convert (can be any type)
   * @param message Optional custom message
   * @returns A ZodErrorWithStack if the input is a ZodError, otherwise returns the original error
   */
  static fromError(
    error: unknown,
    message?: string
  ): ZodErrorWithStack | unknown {
    if (error instanceof ZodError) {
      return new ZodErrorWithStack(error, message);
    }
    return error;
  }

  /**
   * Ensures the error is properly serialized when converted to JSON
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      issues: this.issues,
    };
  }
}
