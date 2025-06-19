// Use require for chalk to ensure CommonJS compatibility
const chalk = require("chalk");
// Force colors in terminal output
chalk.level = 3; // Set to maximum color level
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
      // Use red color for error messages
      const coloredMessage = chalk.red(message);
      let output = this.formatMessage(coloredMessage);

      // Append context on a new line if provided
      if (context) {
        try {
          const contextStr =
            typeof context === "string"
              ? context
              : JSON.stringify(context, null, 2);
          output += `\n${contextStr}`;
        } catch (e) {
          output += `\nContext could not be stringified: ${context}`;
        }
      }

      // Use process.stderr.write instead of console.error
      process.stderr.write(`${output}\n`);
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context information
   */
  warn(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.WARN) {
      // Use yellow color for warning messages
      const coloredMessage = chalk.yellow(message);
      let output = this.formatMessage(coloredMessage);

      // Append context on a new line if provided
      if (context) {
        try {
          const contextStr =
            typeof context === "string"
              ? context
              : JSON.stringify(context, null, 2);
          output += `\n${contextStr}`;
        } catch (e) {
          output += `\nContext could not be stringified: ${context}`;
        }
      }

      // Use process.stderr.write instead of console.warn
      process.stderr.write(`${output}\n`);
    }
  }

  /**
   * Log a standard message (same as info)
   * @param message The message to log
   * @param context Optional context information
   */
  log(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.INFO) {
      // Use cyan color for info messages
      const coloredMessage = chalk.cyan(message);
      let output = this.formatMessage(coloredMessage);

      // Append context on a new line if provided
      if (context) {
        try {
          const contextStr =
            typeof context === "string"
              ? context
              : JSON.stringify(context, null, 2);
          output += `\n${contextStr}`;
        } catch (e) {
          output += `\nContext could not be stringified: ${context}`;
        }
      }

      // Use process.stdout.write instead of console.log
      process.stdout.write(`${output}\n`);
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
      // Use green color for debug messages
      const coloredMessage = chalk.green(message);
      let output = this.formatMessage(coloredMessage);

      // Append context on a new line if provided
      if (context) {
        try {
          const contextStr =
            typeof context === "string"
              ? context
              : JSON.stringify(context, null, 2);
          output += `\n${contextStr}`;
        } catch (e) {
          output += `\nContext could not be stringified: ${context}`;
        }
      }

      // Use process.stdout.write instead of console.debug
      process.stdout.write(`${output}\n`);
    }
  }

  /**
   * Log a verbose message
   * @param message The message to log
   * @param context Optional context information
   */
  verbose(message: string, context?: any): void {
    if (this.verbosityLevel >= VerbosityLevel.VERBOSE) {
      // Use magenta color for verbose messages
      const coloredMessage = chalk.magenta(message);
      let output = `${this.formatMessage(coloredMessage)}`;

      // Append context on a new line if provided
      if (context) {
        try {
          const contextStr =
            typeof context === "string"
              ? context
              : JSON.stringify(context, null, 2);
          output += `\n${contextStr}`;
        } catch (e) {
          output += `\nContext could not be stringified: ${context}`;
        }
      }

      // Use process.stdout.write instead of console.log
      process.stdout.write(`${output}\n`);
    }
  }

  /**
   * Format a message with the context prefix if one is set
   * @param message The message to format
   * @returns The formatted message
   */
  private formatMessage(message: string): string {
    if (this.contextPrefix) {
      // Create different background colors based on verbosity level
      let coloredPrefix;

      // Choose background color based on the context prefix
      if (
        this.contextPrefix.includes("Error") ||
        this.contextPrefix.includes("error")
      ) {
        coloredPrefix = chalk.bgRed.white.bold(` [ ${this.contextPrefix} ] `);
      } else if (
        this.contextPrefix.includes("Warn") ||
        this.contextPrefix.includes("warn")
      ) {
        coloredPrefix = chalk.bgYellow.black.bold(
          ` [ ${this.contextPrefix} ] `
        );
      } else if (
        this.contextPrefix.includes("Debug") ||
        this.contextPrefix.includes("debug")
      ) {
        coloredPrefix = chalk.bgGreen.white.bold(` [ ${this.contextPrefix} ] `);
      } else if (
        this.contextPrefix.includes("Test") ||
        this.contextPrefix.includes("test")
      ) {
        coloredPrefix = chalk.bgCyan.white.bold(` [ ${this.contextPrefix} ] `);
      } else {
        coloredPrefix = chalk.bgBlue.white.bold(` [ ${this.contextPrefix} ] `);
      }

      // Return the colored prefix with the message
      return `${coloredPrefix} ${message}`;
    }
    return message;
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
