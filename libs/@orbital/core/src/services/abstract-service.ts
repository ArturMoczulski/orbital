import { Logger, ConsoleLogger } from "./logger";

/**
 * Abstract base class for services
 * Provides common functionality for logging and verbosity control
 */
export abstract class AbstractService {
  protected logger: Logger;

  /**
   * Creates a new AbstractService
   * @param logger The logger to use
   */
  constructor(logger: Logger = new ConsoleLogger()) {
    this.logger = logger;
  }

  /**
   * Set the logger
   * @param logger The new logger
   */
  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  /**
   * Get the current logger
   * @returns The current logger
   */
  getLogger(): Logger {
    return this.logger;
  }

  // verbosity control is delegated entirely to the injected Logger
}
