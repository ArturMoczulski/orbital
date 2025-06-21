import Atom, {
  AtomConfig,
  AtomState,
  AtomStateStyleProperties,
  AtomStyleProperties,
} from "./Atom";
import Phaser from "phaser";
import Colors from "../utils/Colors";

/**
 * Configuration for a Button, extends AtomConfig.
 */
export interface ButtonConfig extends AtomConfig {
  /** Text label for the button */
  text: string;
}

/**
 * Button component with text label and hover styling.
 */
export default class Button extends Atom {
  /**
   * Define base styles for Button component.
   */
  protected override baseStyle(): AtomStateStyleProperties {
    const baseStyles = super.baseStyle();
    const normalTheme = this.theme.buttonStyles[AtomState.Normal];
    const hoverTheme = this.theme.buttonStyles[AtomState.Hover];
    return {
      [AtomState.Normal]: { ...baseStyles[AtomState.Normal], ...normalTheme },
      [AtomState.Hover]: { ...baseStyles[AtomState.Hover], ...hoverTheme },
    };
  }

  /**
   * Create and add the text object to the button
   */
  protected createTextObject(text: string): Phaser.GameObjects.Text {
    const props = this.calculatedProperties;

    return this.scene.add
      .text(0, 0, text, {
        fontFamily: this.theme.fontFamily,
        fontSize: props.fontSize as string,
        color: props.color as string,
        align: "center",
      })
      .setOrigin(0.5)
      .disableInteractive();
  }

  /**
   * Override init method for Button-specific initialization
   */
  protected override init(): void {
    // Call parent init first
    super.init();

    // Get the text from the config
    const config = this.styleProps[AtomState.Normal] as ButtonConfig;
    if (!config.text) return;

    // Create and add the text object
    const textObj = this.createTextObject(config.text);

    // Add the text object directly to the button's sizer with expand: true
    this.sizer.add(textObj, { align: "center", expand: true });

    // Layout the button's sizer after adding content
    this.sizer.layout();
  }

  constructor(config: ButtonConfig) {
    super(config);
    // Button-specific initialization is handled in init()
  }
}
