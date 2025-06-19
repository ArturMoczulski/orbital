/**
 * Verbosity levels for logging
 */
export enum VerbosityLevel {
  /** No logging */
  NONE = 0,
  /** Error messages only */
  ERROR = 1,
  /** Warnings and errors */
  WARN = 2,
  /** Info, warnings, and errors */
  INFO = 3,
  /** Debug, info, warnings, and errors */
  DEBUG = 4,
  /** All messages including verbose details */
  VERBOSE = 5,
}

/**
 * Interface for a logger
 */
export interface Logger {
  /**
   * Log an error message
   * @param message The message to log
   * @param context Optional context information
   */
  error(message: string, context?: any): void;

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context information
   */
  warn(message: string, context?: any): void;

  /**
   * Log a standard message (same as info)
   * @param message The message to log
   * @param context Optional context information
   */
  log(message: string, context?: any): void;

  /**
   * Log an info message (alias for log)
   * @param message The message to log
   * @param context Optional context information
   */
  info(message: string, context?: any): void;

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Optional context information
   */
  debug(message: string, context?: any): void;

  /**
   * Log a verbose message
   * @param message The message to log
   * @param context Optional context information
   */
  verbose(message: string, context?: any): void;

  /**
   * Set the current verbosity level
   * @param level The new verbosity level
   */
  setVerbosityLevel(level: VerbosityLevel): void;

  /**
   * Get the current verbosity level
   * @returns The current verbosity level
   */
  getVerbosityLevel(): VerbosityLevel;
}

/**
 * Default console implementation of Logger
 */
export class ConsoleLogger implements Logger {
  private verbosityLevel: VerbosityLevel;
  private contextPrefix?: string;

  /**
   * Creates a new ConsoleLogger
   * @param verbosityLevel The verbosity level for the logger
   * @param contextPrefix Optional prefix to prepend to all log messages (e.g., service or component name)
   */
  constructor(
    verbosityLevel: VerbosityLevel = VerbosityLevel.INFO,
    contextPrefix?: string
  ) {
    this.verbosityLevel = verbosityLevel;
    this.contextPrefix = contextPrefix;
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param context Optional context information
   */
  error(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.ERROR) {
      const formattedMessage = this.formatMessage(message);
      console.error(formattedMessage, context ? context : "");
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context information
   */
  warn(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.WARN) {
      const formattedMessage = this.formatMessage(message);
      console.warn(formattedMessage, context ? context : "");
    }
  }

  /**
   * Log a standard message (same as info)
   * @param message The message to log
   * @param context Optional context information
   */
  log(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.INFO) {
      const formattedMessage = this.formatMessage(message);
      console.log(formattedMessage, context ? context : "");
    }
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param context Optional context information
   */
  info(message: string, context?: any): void {
    this.log(message, context);
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Optional context information
   */
  debug(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.DEBUG) {
      const formattedMessage = this.formatMessage(message);
      console.debug(formattedMessage, context ? context : "");
    }
  }

  /**
   * Log a verbose message
   * @param message The message to log
   * @param context Optional context information
   */
  verbose(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.VERBOSE) {
      const formattedMessage = this.formatMessage(`[VERBOSE] ${message}`);
      console.debug(formattedMessage, context ? context : "");
    }
  }

  /**
   * Format a message with the context prefix if one is set
   * @param message The message to format
   * @returns The formatted message
   */
  private formatMessage(message: string): string {
    return this.contextPrefix ? `[${this.contextPrefix}] ${message}` : message;
  }

  /**
   * Set the verbosity level
   * @param level The new verbosity level
   */
  setVerbosityLevel(level: VerbosityLevel): void {
    this.verbosityLevel = level;
  }

  /**
   * Get the current verbosity level
   * @returns The current verbosity level
   */
  getVerbosityLevel(): VerbosityLevel {
    return this.verbosityLevel;
  }
}
