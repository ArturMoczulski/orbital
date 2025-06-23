import { UIStore } from "./UIStore";

describe("UIStore", () => {
  interface TestState {
    count: number;
    text: string;
    isActive: boolean;
  }

  let store: UIStore<TestState>;
  const initialState: TestState = {
    count: 0,
    text: "initial",
    isActive: false,
  };

  beforeEach(() => {
    store = new UIStore<TestState>(initialState);
  });

  it("should initialize with the provided state", () => {
    expect(store.getState()).toEqual(initialState);
  });

  it("should update state when setState is called", () => {
    store.setState({ count: 5 });
    expect(store.getState().count).toBe(5);
    expect(store.getState().text).toBe("initial"); // Other properties remain unchanged
    expect(store.getState().isActive).toBe(false); // Other properties remain unchanged
  });

  it("should update multiple properties when setState is called with multiple values", () => {
    store.setState({ count: 10, text: "updated" });
    expect(store.getState().count).toBe(10);
    expect(store.getState().text).toBe("updated");
    expect(store.getState().isActive).toBe(false); // Unchanged property
  });

  it("should notify subscribers when state changes", () => {
    const listener = jest.fn();
    store.subscribe(listener);

    store.setState({ count: 5 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      { count: 5, text: "initial", isActive: false }, // New state
      { count: 0, text: "initial", isActive: false } // Old state
    );
  });

  it("should not notify subscribers when state does not change", () => {
    const listener = jest.fn();
    store.subscribe(listener);

    store.setState({ count: 0 }); // Same as initial value

    expect(listener).not.toHaveBeenCalled();
  });

  it("should allow unsubscribing listeners", () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState({ count: 5 });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle multiple subscribers", () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    store.subscribe(listener1);
    store.subscribe(listener2);

    store.setState({ count: 5 });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });
});
