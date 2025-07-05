import { z } from "zod";
import { parseWithReferences, ParseWithReferencesOptions } from "./parser";

/**
 * Extend Zod's ZodType interface to add parseWithReferences method
 */
declare module "zod" {
  interface ZodType<Output> {
    /**
     * Parse data with this schema, validating references against dependencies
     *
     * @param data The data to validate
     * @param options Options for validation
     * @returns The validation result
     */
    parseWithReferences(
      data: unknown,
      options?: ParseWithReferencesOptions
    ): { success: boolean; data?: Output; error?: z.ZodError };
  }
}

/**
 * Add the parseWithReferences method to ZodType prototype
 */
z.ZodType.prototype.parseWithReferences = function (data, options = {}) {
  return parseWithReferences(this, data, options);
};
