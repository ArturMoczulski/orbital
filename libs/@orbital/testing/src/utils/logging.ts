/**
 * Logs detailed object information when VERBOSE_TEST environment variable is set to 'true'
 *
 * This utility is intended for use in E2E tests to provide detailed logging of complex objects
 * when needed for debugging, without cluttering normal test output.
 *
 * @param label A descriptive label for the logged object
 * @param obj The object to log
 * @example
 * ```
 * // In an E2E test:
 * const result = await someOperation();
 * logVerbose('Operation Result', result);
 * ```
 *
 * Run tests with verbose logging:
 * ```
 * VERBOSE_TEST=true yarn test:e2e
 * ```
 */
export const logVerbose = (label: string, obj: any): void => {
  if (process.env.VERBOSE_TEST === "true") {
    console.log(`\n[VERBOSE] ${label}:`);
    console.log(JSON.stringify(obj, null, 2));
  }
};
