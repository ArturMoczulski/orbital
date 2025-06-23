"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractService = void 0;
const logger_1 = require("./logger");
/**
 * Abstract base class for services
 * Provides common functionality for logging and verbosity control
 */
class AbstractService {
    /**
     * Creates a new AbstractService
     * @param logger The logger to use
     */
    constructor(logger) {
        const levelEnv = process.env.VERBOSITY;
        const verbosity = levelEnv && logger_1.VerbosityLevel[levelEnv]
            ? logger_1.VerbosityLevel[levelEnv]
            : logger_1.VerbosityLevel.INFO;
        this.logger = logger !== null && logger !== void 0 ? logger : new logger_1.ConsoleLogger(verbosity, this.constructor.name);
    }
    /**
     * Set the logger
     * @param logger The new logger
     */
    setLogger(logger) {
        this.logger = logger;
    }
    /**
     * Get the current logger
     * @returns The current logger
     */
    getLogger() {
        return this.logger;
    }
}
exports.AbstractService = AbstractService;
