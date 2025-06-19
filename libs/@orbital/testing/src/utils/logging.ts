import { ConsoleLogger, VerbosityLevel } from "@orbital/core";

/**
 * Creates a ConsoleLogger with appropriate verbosity level for tests
 *
 * The verbosity level is determined by the VERBOSE_TEST environment variable:
 * - If VERBOSE_TEST=true, verbosity is set to VERBOSE
 * - Otherwise, verbosity is set to DEBUG
 *
 * @param contextPrefix Optional prefix to prepend to all log messages (e.g., test name or component being tested)
 * @returns A ConsoleLogger instance configured for tests
 * @example
 * ```
 * // In a test file:
 * const logger = createTestLogger("AreaGenerator");
 * const service = new MyService(logger);
 * ```
 */
export const createTestLogger = (contextPrefix?: string): ConsoleLogger => {
  const verbosityLevel =
    process.env.VERBOSE_TEST === "true"
      ? VerbosityLevel.VERBOSE
      : VerbosityLevel.DEBUG;

  return new ConsoleLogger(verbosityLevel, contextPrefix);
};
