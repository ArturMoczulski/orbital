"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = exports.VerbosityLevel = void 0;
// Use require for chalk to ensure CommonJS compatibility
const chalk = require("chalk");
// Force colors in terminal output
chalk.level = 3; // Set to maximum color level
/**
 * Verbosity levels for logging
 */
var VerbosityLevel;
(function (VerbosityLevel) {
    /** No logging */
    VerbosityLevel[VerbosityLevel["NONE"] = 0] = "NONE";
    /** Error messages only */
    VerbosityLevel[VerbosityLevel["ERROR"] = 1] = "ERROR";
    /** Warnings and errors */
    VerbosityLevel[VerbosityLevel["WARN"] = 2] = "WARN";
    /** Info, warnings, and errors */
    VerbosityLevel[VerbosityLevel["INFO"] = 3] = "INFO";
    /** Debug, info, warnings, and errors */
    VerbosityLevel[VerbosityLevel["DEBUG"] = 4] = "DEBUG";
    /** All messages including verbose details */
    VerbosityLevel[VerbosityLevel["VERBOSE"] = 5] = "VERBOSE";
})(VerbosityLevel || (exports.VerbosityLevel = VerbosityLevel = {}));
/**
 * Default console implementation of Logger
 */
class ConsoleLogger {
    /**
     * Creates a new ConsoleLogger
     * @param verbosityLevel The verbosity level for the logger
     * @param contextPrefix Optional prefix to prepend to all log messages (e.g., service or component name)
     */
    constructor(verbosityLevel = VerbosityLevel.INFO, contextPrefix) {
        this.verbosityLevel = verbosityLevel;
        this.contextPrefix = contextPrefix;
    }
    /**
     * Log an error message
     * @param message The message to log
     * @param context Optional context information
     */
    error(message, context) {
        if (this.verbosityLevel >= VerbosityLevel.ERROR) {
            // Use red color for error messages
            const coloredMessage = chalk.red(message);
            let output = this.formatMessage(coloredMessage);
            // Append context on a new line if provided
            if (context) {
                try {
                    const contextStr = typeof context === "string"
                        ? context
                        : JSON.stringify(context, null, 2);
                    output += `\n${contextStr}`;
                }
                catch (e) {
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
    warn(message, context) {
        if (this.verbosityLevel >= VerbosityLevel.WARN) {
            // Use yellow color for warning messages
            const coloredMessage = chalk.yellow(message);
            let output = this.formatMessage(coloredMessage);
            // Append context on a new line if provided
            if (context) {
                try {
                    const contextStr = typeof context === "string"
                        ? context
                        : JSON.stringify(context, null, 2);
                    output += `\n${contextStr}`;
                }
                catch (e) {
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
    log(message, context) {
        if (this.verbosityLevel >= VerbosityLevel.INFO) {
            // Use cyan color for info messages
            const coloredMessage = chalk.cyan(message);
            let output = this.formatMessage(coloredMessage);
            // Append context on a new line if provided
            if (context) {
                try {
                    const contextStr = typeof context === "string"
                        ? context
                        : JSON.stringify(context, null, 2);
                    output += `\n${contextStr}`;
                }
                catch (e) {
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
    info(message, context) {
        this.log(message, context);
    }
    /**
     * Log a debug message
     * @param message The message to log
     * @param context Optional context information
     */
    debug(message, context) {
        if (this.verbosityLevel >= VerbosityLevel.DEBUG) {
            // Use green color for debug messages
            const coloredMessage = chalk.green(message);
            let output = this.formatMessage(coloredMessage);
            // Append context on a new line if provided
            if (context) {
                try {
                    const contextStr = typeof context === "string"
                        ? context
                        : JSON.stringify(context, null, 2);
                    output += `\n${contextStr}`;
                }
                catch (e) {
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
    verbose(message, context) {
        if (this.verbosityLevel >= VerbosityLevel.VERBOSE) {
            // Use magenta color for verbose messages
            const coloredMessage = chalk.magenta(message);
            let output = `${this.formatMessage(coloredMessage)}`;
            // Append context on a new line if provided
            if (context) {
                try {
                    const contextStr = typeof context === "string"
                        ? context
                        : JSON.stringify(context, null, 2);
                    output += `\n${contextStr}`;
                }
                catch (e) {
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
    formatMessage(message) {
        if (this.contextPrefix) {
            // Create different background colors based on verbosity level
            let coloredPrefix;
            // Choose background color based on the context prefix
            if (this.contextPrefix.includes("Error") ||
                this.contextPrefix.includes("error")) {
                coloredPrefix = chalk.bgRed.white.bold(` [ ${this.contextPrefix} ] `);
            }
            else if (this.contextPrefix.includes("Warn") ||
                this.contextPrefix.includes("warn")) {
                coloredPrefix = chalk.bgYellow.black.bold(` [ ${this.contextPrefix} ] `);
            }
            else if (this.contextPrefix.includes("Debug") ||
                this.contextPrefix.includes("debug")) {
                coloredPrefix = chalk.bgGreen.white.bold(` [ ${this.contextPrefix} ] `);
            }
            else if (this.contextPrefix.includes("Test") ||
                this.contextPrefix.includes("test")) {
                coloredPrefix = chalk.bgCyan.white.bold(` [ ${this.contextPrefix} ] `);
            }
            else {
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
    setVerbosityLevel(level) {
        this.verbosityLevel = level;
    }
    /**
     * Get the current verbosity level
     * @returns The current verbosity level
     */
    getVerbosityLevel() {
        return this.verbosityLevel;
    }
}
exports.ConsoleLogger = ConsoleLogger;
