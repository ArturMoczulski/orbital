import { IntervalsRegistryService } from "./intervals-registry.service";
export declare class IntervalsMonitorService {
    private readonly intervalsRegistry;
    private readonly logger;
    constructor(intervalsRegistry: IntervalsRegistryService);
    /**
     * Build a CLI Table of the current intervals' status.
     *
     */
    table(): any;
    /**
     * Print the table to the logger.
     */
    printStatusReport(): void;
    /**
     * Convert milliseconds into a short human-readable string (e.g. "3s", "500ms").
     */
    private humanizeDuration;
    /**
     * Map an IntervalState to an emoji or short string.
     */
    private stateToEmoji;
}
