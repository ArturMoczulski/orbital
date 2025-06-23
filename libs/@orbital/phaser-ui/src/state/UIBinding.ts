import { UIStore } from "./UIStore";
import Atom from "../atoms/Atom";
import { AtomStyleProperties } from "../atoms/Atom";

/**
 * Binding configuration for connecting store state to component props
 */
export interface BindingConfig<T, K extends keyof T> {
  store: UIStore<T>;
  property: K;
  componentProp: keyof AtomStyleProperties;
  transform?: (value: T[K]) => any;
}

/**
 * Class to handle binding store state to UI components
 */
export class UIBinding {
  private bindings: Map<
    Atom,
    Array<{
      unsubscribe: () => void;
      config: BindingConfig<any, any>;
    }>
  > = new Map();

  /**
   * Bind a component property to a store state property
   */
  public bind<T, K extends keyof T>(
    component: Atom,
    config: BindingConfig<T, K>
  ): void {
    const { store, property, componentProp, transform } = config;

    // Create update function
    const updateComponent = (state: T) => {
      const value = transform ? transform(state[property]) : state[property];

      // Update component style with new value
      component.style({
        [componentProp]: value,
      });
    };

    // Initial update
    updateComponent(store.getState());

    // Subscribe to store changes
    const unsubscribe = store.subscribe((newState) => {
      updateComponent(newState);
    });

    // Store binding for cleanup
    if (!this.bindings.has(component)) {
      this.bindings.set(component, []);
    }

    this.bindings.get(component)!.push({
      unsubscribe,
      config,
    });
  }

  /**
   * Unbind all bindings for a component
   */
  public unbind(component: Atom): void {
    const componentBindings = this.bindings.get(component);
    if (componentBindings) {
      componentBindings.forEach((binding) => binding.unsubscribe());
      this.bindings.delete(component);
    }
  }

  /**
   * Unbind all components
   */
  public unbindAll(): void {
    this.bindings.forEach((bindings, component) => {
      bindings.forEach((binding) => binding.unsubscribe());
    });
    this.bindings.clear();
  }
}
