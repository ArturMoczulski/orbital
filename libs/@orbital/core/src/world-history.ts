import { HistoryEventProps } from "./types/history-event";

/**
 * Registry for all historical events in the world.
 */
export class WorldHistory {
  /** Collection of recorded history events */
  protected events: HistoryEventProps[] = [];

  /**
   * Record a new history event.
   * @param event The event to add to history
   */
  protected record(event: HistoryEventProps): void {
    this.events.push(event);
  }

  /**
   * Retrieve all recorded events.
   */
  protected getAll(): HistoryEventProps[] {
    return this.events;
  }

  /**
   * Returns a stringified version of this instance.
   */
  public toString(): string {
    return JSON.stringify(this);
  }
}
