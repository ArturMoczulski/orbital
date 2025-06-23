/**
 * Type for state change listeners
 */
type StateChangeListener<T> = (newState: T, oldState: T) => void;

/**
 * Generic UI Store class for managing component state
 */
export class UIStore<T> {
  private state: T;
  private listeners: StateChangeListener<T>[] = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  public getState(): T {
    return this.state;
  }

  /**
   * Update state and notify listeners
   */
  public setState(newState: Partial<T>): void {
    const oldState = { ...this.state };
    const mergedState = { ...this.state, ...newState };
    // Only notify if state actually changed
    const changed = Object.keys(mergedState).some(
      (key) => mergedState[key as keyof T] !== (this.state as any)[key]
    );
    this.state = mergedState;
    if (!changed) {
      return;
    }
    // Notify all listeners
    this.listeners.forEach((listener) => listener(this.state, oldState));
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: StateChangeListener<T>): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
