// @ts-nocheck
import Phaser, { Game } from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import Theme from "../theme/Theme";
import Colors from "../utils/Colors";

interface SceneWithRexUI extends Phaser.Scene {
  rexUI: UIPlugin;
}

export interface AtomStyleProperties {
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  backgroundColor?: number | string | Phaser.Display.Color;
  backgroundAlpha?: number;
  borderColor?: number | string | Phaser.Display.Color;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  color?: string | number;
  fontSize?: string | number;
  letterSpacing?: number;
}

export enum AtomState {
  Normal = "normal",
  Hover = "hover",
}

export type AtomStateStyleProperties = Record<AtomState, AtomStyleProperties>;

// Define a type for GameObjects that have the setDepth method
export type GameObjectWithDepth = Phaser.GameObjects.GameObject & {
  setDepth(value: number): any;
};

export interface AtomConfig extends AtomStyleProperties {
  scene: SceneWithRexUI;
  theme?: Theme;
  onClick?: () => void;
  hover?: AtomStyleProperties;
  content?: AGO[];
  orientation?: "x" | "y"; // Allow configuring horizontal or vertical orientation
  element?: GameObjectWithDepth; // Optional custom element with depth functionality
}

// GameObjectWithDepth is already defined above

export type AGO =
  | Atom
  | GameObjectWithDepth
  | { getElement: () => GameObjectWithDepth };

export default class Atom extends Phaser.GameObjects.GameObject {
  protected scene: SceneWithRexUI;
  protected rexUI: UIPlugin;
  protected element!: Phaser.GameObjects.GameObject;
  protected theme: Theme;
  protected styleProps: AtomStateStyleProperties;
  protected state: AtomState = AtomState.Normal;
  protected backgroundRect!: Phaser.GameObjects.GameObject;
  protected sizer!: ReturnType<UIPlugin["add"]["sizer"]>;
  protected children: AGO[];

  // Cached calculated properties
  protected calculatedProperties: AtomStyleProperties = {};

  constructor(config: AtomConfig) {
    // Call super with the scene and type
    super(config.scene, "Atom");

    // Initialize properties
    this.initializeProperties(config);
    this.recalculateProperties();
    const props = this.calculatedProperties;

    // Setup element - either custom or created
    if (config.element) {
      this.setupCustomElement(config.element);
    } else {
      this.createBackgroundAndSizer(config, props);
    }

    // Add content if provided
    this.addInitialContent(config.content);

    // Setup rendering
    this.setupRenderEvents();

    // Call init method for subclass-specific initialization
    this.init();
  }

  /**
   * Subclass-specific initialization
   * This is called at the end of the constructor and can be overridden by subclasses
   */
  protected init(): void {
    // Empty by default, to be overridden by subclasses
  }

  /**
   * Initialize basic properties
   */
  protected initializeProperties(config: AtomConfig): void {
    this.scene = config.scene;
    this.rexUI = config.scene.rexUI;
    this.theme = config.theme ?? new Theme();
    this.children = [];
    this.styleProps = this.buildStyleProps(config);
    this.calculatedProperties = {};
  }

  /**
   * Setup a custom element when provided
   */
  protected setupCustomElement(element: GameObjectWithDepth): void {
    this.element = element;
    this.backgroundRect = element; // Use the element as background too
  }

  /**
   * Create background rectangle and configure it
   */
  protected createBackgroundRect(
    config: AtomConfig,
    props: AtomStyleProperties
  ): Phaser.GameObjects.GameObject {
    const style = this.styleProps[this.state];

    // For the initial rectangle, use a default height if "auto" is specified
    const rectHeight =
      props.height === "auto"
        ? this.theme.buttonHeight // Use default height initially
        : (props.height as number);

    // Ensure we have valid border values
    const borderRadius = style.borderRadius ?? 0;
    const backgroundColor = style.backgroundColor;

    // Create the rectangle
    const rect = this.rexUI.add.roundRectangle(
      0,
      0,
      props.width as number,
      rectHeight,
      borderRadius,
      backgroundColor
    );

    // Position the rectangle
    rect.setPosition(props.x ?? 0, props.y ?? 0);

    // Apply border style immediately after creation
    if (typeof rect.setStrokeStyle === "function") {
      const borderWidth = style.borderWidth ?? 2;
      const borderColor = style.borderColor ?? 0xffffff;
      rect.setStrokeStyle(borderWidth, borderColor);
    }

    // Setup interactivity
    this.setupBackgroundInteractivity(rect, config);

    return rect;
  }

  /**
   * Setup interactivity for the background rectangle
   */
  protected setupBackgroundInteractivity(
    rect: Phaser.GameObjects.GameObject,
    config: AtomConfig
  ): void {
    rect.setInteractive();

    if (config.onClick) {
      rect.on("pointerdown", config.onClick);
    }

    rect.on("pointerover", () => {
      this.state = AtomState.Hover;
      this.recalculateProperties(); // State change requires recalculation
    });
    rect.on("pointerout", () => {
      this.state = AtomState.Normal;
      this.recalculateProperties(); // State change requires recalculation
    });
  }

  /**
   * Create sizer configuration object
   */
  protected createSizerConfig(
    config: AtomConfig,
    props: AtomStyleProperties
  ): any {
    const sizerConfig: any = {
      x: props.x,
      y: props.y,
      width: props.width,
      orientation: config.orientation || "x", // Use provided orientation or default to horizontal
      space: {
        // Apply padding as uniform spacing for container edges
        left: props.padding ?? 0,
        right: props.padding ?? 0,
        top: props.padding ?? 0,
        bottom: props.padding ?? 0,
        // Apply padding between items
        item: props.padding ?? 0,
      },
    };

    // Handle auto height
    if (props.height !== "auto") {
      sizerConfig.height = props.height;
    }

    return sizerConfig;
  }

  /**
   * Apply padding to the sizer
   */
  protected applySizerPadding(
    config: AtomConfig,
    props: AtomStyleProperties
  ): void {
    if (props.padding) {
      const padding = props.padding;
      this.sizer.setInnerPadding(padding, padding, padding, padding);
    }
  }

  /**
   * Create background and sizer elements
   */
  protected createBackgroundAndSizer(
    config: AtomConfig,
    props: AtomStyleProperties
  ): void {
    // Create background rectangle
    const rect = this.createBackgroundRect(config, props);
    this.backgroundRect = rect;

    // Create and configure sizer
    const sizerConfig = this.createSizerConfig(config, props);
    this.sizer = this.rexUI.add.sizer(sizerConfig).addBackground(rect);

    // Initial layout
    this.sizer.layout();

    // Apply padding
    this.applySizerPadding(config, props);

    // Set element to sizer
    this.element = this.sizer;
  }

  /**
   * Add initial content if provided in config
   */
  protected addInitialContent(content?: AGO[]): void {
    if (content) {
      for (const item of content) {
        this.add(item);
      }
    }
  }

  /**
   * Setup render events
   */
  protected setupRenderEvents(): void {
    this.scene.events.on("update", this.updateRender, this);
    this.updateRender();
  }

  /**
   * Calculate runtime properties and store them in calculatedProperties.
   */
  public recalculateProperties(): AtomStyleProperties {
    const raw = this.styleProps[this.state];
    const reference = this.getReferenceDimensions();
    const width = this.computeDimension(raw.width, reference.width);
    const height = this.computeDimension(raw.height, reference.height);

    // normalize fontSize: number => "px", string as-is, fallback to theme default
    let fontSize: string;
    if (typeof raw.fontSize === "number") {
      fontSize = `${raw.fontSize}px`;
    } else if (typeof raw.fontSize === "string") {
      fontSize = raw.fontSize;
    } else {
      fontSize = this.theme.fontSizes.md;
    }

    // normalize color: number => hex string, string as-is, Phaser.Color or any => hex, fallback to theme text color
    let color: string;
    if (raw.color != null) {
      if (typeof raw.color === "string") {
        color = raw.color;
      } else {
        const num = Colors.toNumber(raw.color as any);
        color = `#${num.toString(16)}`;
      }
    } else {
      const num = Colors.toNumber(this.theme.colors.text);
      color = `#${num.toString(16)}`;
    }

    const backgroundColorNum =
      raw.backgroundColor !== undefined
        ? Colors.toNumber(raw.backgroundColor as any)
        : Colors.toNumber(this.theme.background);
    const borderColorNum =
      raw.borderColor !== undefined
        ? Colors.toNumber(raw.borderColor as any)
        : Colors.toNumber(this.theme.formBorderColor);

    // Store the calculated properties
    this.calculatedProperties = {
      ...raw,
      width,
      height,
      fontSize,
      color,
      backgroundColor: backgroundColorNum,
      borderColor: borderColorNum,
    };

    return this.calculatedProperties;
  }

  /**
   * Helper to resolve number or percentage string against reference.
   */
  /**
   * Resolve a numeric or percentage dimension, defaulting to reference height if none provided.
   */
  protected computeDimension(
    value: number | string | undefined,
    reference?: number
  ): number | "auto" {
    // Handle "auto" height specifically
    if (typeof value === "string" && value.trim() === "auto") {
      return "auto";
    }

    const refVal =
      reference !== undefined
        ? reference
        : this.getReferenceDimensions().height;
    if (typeof value === "string" && value.trim().endsWith("%")) {
      return (parseFloat(value) / 100) * refVal;
    }
    if (typeof value === "number") {
      return value;
    }
    return refVal;
  }

  /**
   * Determine reference dimensions: parent container or canvas.
   */
  protected getReferenceDimensions(): { width: number; height: number } {
    const el: any = this.element;
    if (
      el &&
      el.parentContainer &&
      typeof el.parentContainer.width === "number" &&
      typeof el.parentContainer.height === "number"
    ) {
      return {
        width: el.parentContainer.width,
        height: el.parentContainer.height,
      };
    }
    if (
      this.scene.scale &&
      typeof this.scene.scale.width === "number" &&
      typeof this.scene.scale.height === "number"
    ) {
      return {
        width: this.scene.scale.width,
        height: this.scene.scale.height,
      };
    }
    // fallback to theme defaults
    return {
      width: this.theme.buttonWidth,
      height: this.theme.buttonHeight,
    };
  }

  /**
   * Default style for each state.
   * This includes padding settings that will be applied to all Atom instances
   */
  protected baseStyle(): AtomStateStyleProperties {
    const formStyle = this.theme.formStyles[AtomState.Normal] ?? {};
    const base: AtomStyleProperties = {
      x: this.scene?.scale?.width ? this.scene.scale.width / 2 : 0,
      y: this.scene?.scale?.height ? this.scene.scale.height / 2 : 0,
      width: this.theme.buttonWidth,
      height: this.theme.buttonHeight,
      backgroundColor: formStyle.backgroundColor ?? this.theme.background,
      backgroundAlpha: formStyle.backgroundAlpha,
      borderColor: formStyle.borderColor,
      borderWidth: formStyle.borderWidth,
      borderRadius: formStyle.borderRadius,
      // Use padding and margin from form style
      padding: formStyle.padding,
      margin: formStyle.margin,
      color: `#${Colors.toNumber(this.theme.colors.text).toString(16)}`,
      fontSize: this.theme.fontSizes.md,
      letterSpacing: 0,
    };
    return {
      [AtomState.Normal]: { ...base },
      [AtomState.Hover]: { ...base },
    };
  }

  /**
   * Empty style overrides by subclass.
   */
  protected defaultStyle(): AtomStateStyleProperties {
    return {
      [AtomState.Normal]: {},
      [AtomState.Hover]: {},
    };
  }

  /**
   * Merge default, subclass, and user-defined styles.
   */
  protected buildStyleProps(config: AtomConfig): AtomStateStyleProperties {
    const defaults = this.baseStyle();
    const subclass = this.defaultStyle();
    const { scene, theme, onClick, hover = {}, ...rest } = config;
    return {
      [AtomState.Normal]: {
        ...defaults[AtomState.Normal],
        ...subclass[AtomState.Normal],
        ...rest,
      },
      [AtomState.Hover]: {
        ...defaults[AtomState.Hover],
        ...subclass[AtomState.Hover],
        ...hover,
      },
    };
  }

  /**
   * Accessor/mutator for style at runtime.
   */
  public style(): AtomStateStyleProperties;
  public style(overrides: AtomStyleProperties): this;
  public style(state: AtomState, overrides: AtomStyleProperties): this;
  public style(arg1?: any, arg2?: any): any {
    if (arg1 === undefined) {
      return this.styleProps;
    }
    if (typeof arg1 !== "string") {
      Object.assign(this.styleProps[AtomState.Normal], arg1);
      this.recalculateProperties(); // Style change requires recalculation
      return this;
    }
    Object.assign(this.styleProps[arg1], arg2);
    this.recalculateProperties(); // Style change requires recalculation
    return this;
  }

  /**
   * Get underlying GameObject.
   */
  public getElement(): GameObjectWithDepth {
    // Return the element as a GameObjectWithDepth
    return this.element as GameObjectWithDepth;
  }

  /**
   * Render updates each frame.
   */
  protected updateRender(): void {
    // Use the cached properties directly
    const props = this.calculatedProperties;
    const bg: any = this.backgroundRect;

    // Only call methods if they exist on the background rectangle
    if (
      bg &&
      props.backgroundColor !== undefined &&
      typeof bg.setFillStyle === "function"
    ) {
      bg.setFillStyle(props.backgroundColor);
    }

    if (
      bg &&
      props.backgroundAlpha !== undefined &&
      typeof bg.setAlpha === "function"
    ) {
      bg.setAlpha(props.backgroundAlpha);
    }

    if (
      bg &&
      typeof bg.setStrokeStyle === "function" &&
      props.borderWidth !== undefined &&
      props.borderColor !== undefined
    ) {
      // Apply the stroke style with the calculated properties
      bg.setStrokeStyle(props.borderWidth, props.borderColor);

      // Keep the stroke alpha setting to ensure visibility
      if (typeof bg.setStrokeAlpha === "function") {
        bg.setStrokeAlpha(1);
      }
    }

    // Update background rectangle size if height is auto and we have a sizer
    if (
      props.height === "auto" &&
      this.sizer &&
      bg &&
      typeof bg.setSize === "function"
    ) {
      // Only update if we have valid dimensions and they're not zero
      if (this.sizer.width && this.sizer.height && this.sizer.height > 0) {
        bg.setSize(this.sizer.width, this.sizer.height);
      }
    }
  }

  /**
   * Check if an object is a RexUI object
   */
  protected isRexUIObject(obj: any): boolean {
    return (
      obj.type &&
      (obj.type === "rexSizer" ||
        obj.type === "rexLabel" ||
        obj.type === "rexButtons" ||
        obj.type.startsWith("rex"))
    );
  }

  /**
   * Get element from an Atom instance
   */
  protected getElementFromAtom(atom: Atom): Phaser.GameObjects.GameObject {
    return atom.getElement();
  }

  /**
   * Get element from a GameObject
   */
  protected getElementFromGameObject(
    gameObject: Phaser.GameObjects.GameObject
  ): Phaser.GameObjects.GameObject {
    return gameObject;
  }

  /**
   * Get element from an object with getElement method
   */
  protected getElementFromObjectWithGetElement(
    obj: any
  ): Phaser.GameObjects.GameObject {
    // Check if it's a RexUI object
    if (this.isRexUIObject(obj)) {
      // For RexUI objects, use the object itself instead of calling getElement
      return obj;
    }

    // For other objects with getElement, use the object itself as a fallback
    return obj;
  }

  /**
   * Add a child element or Atom into the sizer, with optional expand.
   */
  public add(ago: AGO, align: string = "center", expand: boolean = true): this {
    // Adding content may change dimensions, so recalculate properties
    this.recalculateProperties();
    let element: Phaser.GameObjects.GameObject;

    // Determine the element based on the type of ago
    if (ago instanceof Atom) {
      element = this.getElementFromAtom(ago);
    } else if (ago instanceof Phaser.GameObjects.GameObject) {
      element = this.getElementFromGameObject(ago);
    } else if (ago && typeof ago.getElement === "function") {
      element = this.getElementFromObjectWithGetElement(ago);
    } else {
      // If all else fails, try to use the object directly
      element = ago;
    }

    // Set content element to higher depth to ensure it's above background
    if (element && typeof element.setDepth === "function") {
      element.setDepth(1);
    }

    // If we're using a sizer, add the element to it
    if (this.sizer) {
      this.sizer.add(element, {
        align,
        expand,
      });
      // Layout the sizer to update its dimensions
      this.sizer.layout();

      // If height is auto, update the background rectangle size after layout
      if (
        this.calculatedProperties.height === "auto" &&
        this.backgroundRect &&
        typeof (this.backgroundRect as any).setSize === "function"
      ) {
        // Get the actual content height from the sizer
        const contentHeight = this.sizer.height;

        // Update the background rectangle size to match the content
        (this.backgroundRect as any).setSize(this.sizer.width, contentHeight);

        // Don't force another layout as it might be causing issues
      }
    }
    return this;
  }
}
