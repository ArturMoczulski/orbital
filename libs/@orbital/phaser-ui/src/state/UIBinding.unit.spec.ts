import { UIBinding, BindingConfig } from "./UIBinding";
import { UIStore } from "./UIStore";
import Atom from "../atoms/Atom";

// Mock the Atom class since we can't use the real one in tests
jest.mock("../atoms/Atom", () => {
  return {
    __esModule: true,
    default: class MockAtom {
      constructor(config = {}) {
        // Mock constructor that accepts config
      }
      style = jest.fn().mockReturnThis();
    },
  };
});

describe("UIBinding", () => {
  interface TestState {
    color: number;
    visible: boolean;
    size: number;
  }

  let binding: UIBinding;
  let store: UIStore<TestState>;
  let component: Atom;
  let initialState: TestState;
  let mockScene: any;

  beforeEach(() => {
    binding = new UIBinding();
    initialState = {
      color: 0xff0000,
      visible: true,
      size: 100,
    };
    store = new UIStore<TestState>(initialState);
    // Create a mock scene
    mockScene = { rexUI: {} } as any;
    component = new Atom({ scene: mockScene }) as any;
  });

  it("should bind a component property to a store state property", () => {
    const config: BindingConfig<TestState, "color"> = {
      store,
      property: "color",
      componentProp: "backgroundColor",
    };

    binding.bind(component, config);

    // Initial binding should set the component property
    expect(component.style).toHaveBeenCalledWith({
      backgroundColor: 0xff0000,
    });
  });

  it("should update component when store state changes", () => {
    const config: BindingConfig<TestState, "color"> = {
      store,
      property: "color",
      componentProp: "backgroundColor",
    };

    binding.bind(component, config);

    // Reset mock to clear initial binding call
    jest.clearAllMocks();

    // Update store state
    store.setState({ color: 0x0000ff });

    // Component should be updated with new value
    expect(component.style).toHaveBeenCalledWith({
      backgroundColor: 0x0000ff,
    });
  });

  it("should apply transform function when provided", () => {
    const config: BindingConfig<TestState, "visible"> = {
      store,
      property: "visible",
      componentProp: "display",
      transform: (visible) => (visible ? "block" : "none"),
    };

    binding.bind(component, config);

    // Initial binding should transform the value
    expect(component.style).toHaveBeenCalledWith({
      display: "block",
    });

    // Reset mock to clear initial binding call
    jest.clearAllMocks();

    // Update store state
    store.setState({ visible: false });

    // Component should be updated with transformed value
    expect(component.style).toHaveBeenCalledWith({
      display: "none",
    });
  });

  it("should support multiple bindings for a single component", () => {
    const colorConfig: BindingConfig<TestState, "color"> = {
      store,
      property: "color",
      componentProp: "backgroundColor",
    };

    const sizeConfig: BindingConfig<TestState, "size"> = {
      store,
      property: "size",
      componentProp: "width",
    };

    binding.bind(component, colorConfig);
    binding.bind(component, sizeConfig);

    // Reset mock to clear initial binding calls
    jest.clearAllMocks();

    // Update store state with multiple properties
    store.setState({ color: 0x0000ff, size: 200 });

    // Component should be updated with both properties
    expect(component.style).toHaveBeenCalledWith({
      backgroundColor: 0x0000ff,
    });
    expect(component.style).toHaveBeenCalledWith({
      width: 200,
    });
  });

  it("should unbind a component", () => {
    const config: BindingConfig<TestState, "color"> = {
      store,
      property: "color",
      componentProp: "backgroundColor",
    };

    binding.bind(component, config);
    binding.unbind(component);

    // Reset mock to clear initial binding call
    jest.clearAllMocks();

    // Update store state
    store.setState({ color: 0x0000ff });

    // Component should not be updated after unbinding
    expect(component.style).not.toHaveBeenCalled();
  });

  it("should unbind all components", () => {
    const component2 = new Atom({ scene: mockScene }) as any;

    const config1: BindingConfig<TestState, "color"> = {
      store,
      property: "color",
      componentProp: "backgroundColor",
    };

    const config2: BindingConfig<TestState, "size"> = {
      store,
      property: "size",
      componentProp: "width",
    };

    binding.bind(component, config1);
    binding.bind(component2, config2);

    binding.unbindAll();

    // Reset mocks to clear initial binding calls
    jest.clearAllMocks();

    // Update store state
    store.setState({ color: 0x0000ff, size: 200 });

    // Components should not be updated after unbinding all
    expect(component.style).not.toHaveBeenCalled();
    expect(component2.style).not.toHaveBeenCalled();
  });
});
