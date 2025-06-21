import Phaser from "phaser";
import Colors from "../utils/Colors";
import {
  AtomState,
  AtomStyleProperties,
  AtomStateStyleProperties,
} from "../atoms/Atom";

/**
 * Color palette for thematic colors.
 */
export interface ColorPalette {
  primary: any;
  secondary: any;
  accent: any;
  success: any;
  danger: any;
  background: any;
  text: any;
  light: any;
  dark: any;
}

/**
 * Spacing scale in pixels.
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Border radius definitions.
 */
export interface BorderRadius {
  small: number;
  medium: number;
  large: number;
}

/**
 * Popup width/height ratios relative to viewport.
 */
export interface PopupRatios {
  widthRatio: number;
  heightRatio: number;
}

/**
 * Font size definitions.
 */
export interface FontSizes {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Singleton Theme class centralizing UI styling values.
 */
export default class Theme {
  private static _active: Theme;
  public static get active(): Theme {
    if (!this._active) {
      this._active = new Theme();
    }
    return this._active;
  }

  public static parseColor(
    value: string | number | Phaser.Display.Color
  ): number {
    return Colors.parse(value);
  }

  public static lighten(
    color: string | number | Phaser.Display.Color,
    percent: number
  ): number {
    return Colors.lighten(color, percent);
  }

  public static darken(
    color: string | number | Phaser.Display.Color,
    percent: number
  ): number {
    return Colors.darken(color, percent);
  }

  private _colors: ColorPalette = {
    primary: Theme.parseColor("#afa888"),
    secondary: Theme.parseColor("#c57659"),
    accent: Theme.parseColor("#1a1d45"),
    success: Theme.parseColor(0x00ff00),
    danger: Theme.parseColor(0xff8a80),
    background: Theme.parseColor("#1a1d45"),
    text: Theme.parseColor("#ffffff"),
    light: Theme.parseColor("#ffffff"),
    dark: Theme.parseColor("#000000"),
  };

  private _fontFamily: string = "MedievalSharp";
  private _fontSizes: FontSizes = {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "20px",
    xl: "24px",
  };

  private _spacing: Spacing = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 };
  private _borderRadius: BorderRadius = { small: 4, medium: 5, large: 10 };
  private _popupRatios: PopupRatios = { widthRatio: 0.3, heightRatio: 0.4 };

  /** Consolidated style definitions for components */
  public formStyles: AtomStateStyleProperties = {
    [AtomState.Normal]: {
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.accent),
      borderWidth: 2,
      borderRadius: this._borderRadius.large,
      padding: 32,
      margin: 32,
    },
    [AtomState.Hover]: {
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.accent),
      borderWidth: 2,
      borderRadius: this._borderRadius.large,
      padding: 32,
      margin: 32,
    },
  };

  public inputStyles: AtomStateStyleProperties = {
    [AtomState.Normal]: {
      backgroundColor: 0x1e0f28,
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.primary),
      borderWidth: 1,
      borderRadius: this._borderRadius.small,
      padding: 12,
      margin: 12,
    },
    [AtomState.Hover]: {
      backgroundColor: 0x1e0f28,
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.primary),
      borderWidth: 1,
      borderRadius: this._borderRadius.small,
      padding: 12,
      margin: 12,
    },
  };

  public buttonStyles: AtomStateStyleProperties = {
    [AtomState.Normal]: {
      backgroundColor: Colors.toNumber(this._colors.primary),
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.primary),
      borderWidth: 2,
      borderRadius: this._borderRadius.medium,
      padding: 16,
      margin: 24,
      width: 150,
      height: 50,
      letterSpacing: 0,
    },
    [AtomState.Hover]: {
      backgroundColor: Colors.toNumber(this._colors.secondary),
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.secondary),
      borderWidth: 2,
      borderRadius: this._borderRadius.medium,
      padding: 16,
      margin: 24,
      width: 150,
      height: 50,
      letterSpacing: 1,
    },
  };

  public linkStyles: AtomStateStyleProperties = {
    [AtomState.Normal]: {
      color: `#${Colors.toNumber(this._colors.accent).toString(16)}`,
      margin: 24,
    },
    [AtomState.Hover]: {
      color: `#${Colors.toNumber(this._colors.text).toString(16)}`,
      margin: 24,
    },
  };

  public popupStyles: AtomStateStyleProperties = {
    [AtomState.Normal]: {
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.primary),
      borderWidth: 2,
      borderRadius: this._borderRadius.medium,
      padding: 16,
      margin: 16,
    },
    [AtomState.Hover]: {
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      borderColor: Colors.toNumber(this._colors.primary),
      borderWidth: 2,
      borderRadius: this._borderRadius.medium,
      padding: 16,
      margin: 16,
    },
  };

  /** Convenience getters for normal-state style properties */
  get form(): AtomStyleProperties {
    return this.formStyles[AtomState.Normal];
  }
  get input(): AtomStyleProperties {
    return this.inputStyles[AtomState.Normal];
  }
  get button(): AtomStyleProperties {
    return this.buttonStyles[AtomState.Normal];
  }
  get link(): AtomStyleProperties {
    return this.linkStyles[AtomState.Normal];
  }
  get popup(): AtomStyleProperties {
    return this.popupStyles[AtomState.Normal];
  }

  /** Panel defaults consumed by Panel component */
  public panel = {
    borderColor: Colors.toNumber(this._colors.text),
    borderWidth: 2,
    padding: 32,
  };

  /** Font and spacing getters */
  get fontFamily(): string {
    return this._fontFamily;
  }
  get fontSizes(): FontSizes {
    return this._fontSizes;
  }
  get spacing(): Spacing {
    return this._spacing;
  }
  set spacing(value: Spacing) {
    this._spacing = value;
  }
  get borderRadius(): BorderRadius {
    return this._borderRadius;
  }
  get smallRadius(): number {
    return this._borderRadius.small;
  }
  set smallRadius(value: number) {
    this._borderRadius.small = value;
  }
  get mediumRadius(): number {
    return this._borderRadius.medium;
  }
  set mediumRadius(value: number) {
    this._borderRadius.medium = value;
  }
  get largeRadius(): number {
    return this._borderRadius.large;
  }
  set largeRadius(value: number) {
    this._borderRadius.large = value;
  }
  get popupWidthRatio(): number {
    return this._popupRatios.widthRatio;
  }
  set popupWidthRatio(value: number) {
    this._popupRatios.widthRatio = value;
  }
  get popupHeightRatio(): number {
    return this._popupRatios.heightRatio;
  }
  set popupHeightRatio(value: number) {
    this._popupRatios.heightRatio = value;
  }
  get colors(): ColorPalette {
    return this._colors;
  }
  set colors(value: ColorPalette) {
    this._colors = value;
  }

  // Individual color getters and setters
  get primary(): number {
    return this._colors.primary;
  }
  set primary(value: number) {
    this._colors.primary = value;
  }
  get secondary(): number {
    return this._colors.secondary;
  }
  set secondary(value: number) {
    this._colors.secondary = value;
  }
  get accent(): number {
    return this._colors.accent;
  }
  set accent(value: number) {
    this._colors.accent = value;
  }
  get success(): number {
    return this._colors.success;
  }
  set success(value: number) {
    this._colors.success = value;
  }
  get danger(): number {
    return this._colors.danger;
  }
  set danger(value: number) {
    this._colors.danger = value;
  }
  get background(): number {
    return this._colors.background;
  }
  set background(value: number) {
    this._colors.background = value;
  }
  get text(): number {
    return this._colors.text;
  }
  set text(value: number) {
    this._colors.text = value;
  }
  get light(): number {
    return this._colors.light;
  }
  set light(value: number) {
    this._colors.light = value;
  }
  get dark(): number {
    return this._colors.dark;
  }
  set dark(value: number) {
    this._colors.dark = value;
  }

  /** Legacy-style convenience getters and setters for component tests */
  // Button dimensions
  get buttonWidth(): number {
    return this.buttonStyles[AtomState.Normal].width as number;
  }
  set buttonWidth(value: number) {
    this.buttonStyles[AtomState.Normal].width = value;
    this.buttonStyles[AtomState.Hover].width = value;
  }
  get buttonHeight(): number {
    return this.buttonStyles[AtomState.Normal].height as number;
  }
  set buttonHeight(value: number) {
    this.buttonStyles[AtomState.Normal].height = value;
    this.buttonStyles[AtomState.Hover].height = value;
  }

  // Form style
  get formPadding(): number {
    return this.formStyles[AtomState.Normal].padding as number;
  }
  get formBackgroundAlpha(): number {
    return this.formStyles[AtomState.Normal].backgroundAlpha as number;
  }
  get formBorderColor(): number {
    return this.formStyles[AtomState.Normal].borderColor as number;
  }
  get formBorderWidth(): number {
    return this.formStyles[AtomState.Normal].borderWidth as number;
  }
  get formBorderRadius(): number {
    return this.formStyles[AtomState.Normal].borderRadius as number;
  }

  // Input style
  get inputPadding(): number {
    return this.inputStyles[AtomState.Normal].padding as number;
  }
  get inputMargin(): number {
    return this.inputStyles[AtomState.Normal].margin as number;
  }
  get inputBackgroundColor(): number {
    return this.inputStyles[AtomState.Normal].backgroundColor as number;
  }
  get inputBackgroundAlpha(): number {
    return this.inputStyles[AtomState.Normal].backgroundAlpha as number;
  }
  get inputBorderColor(): number {
    return this.inputStyles[AtomState.Normal].borderColor as number;
  }
  get inputBorderWidth(): number {
    return this.inputStyles[AtomState.Normal].borderWidth as number;
  }
  get inputBorderRadius(): number {
    return this.inputStyles[AtomState.Normal].borderRadius as number;
  }

  // Button style
  get buttonPadding(): number {
    return this.buttonStyles[AtomState.Normal].padding as number;
  }
  get buttonMarginTop(): number {
    return this.buttonStyles[AtomState.Normal].margin as number;
  }
  get buttonGradientStart(): number {
    return this.buttonStyles[AtomState.Normal].backgroundColor as number;
  }
  get buttonGradientEnd(): number {
    return this.buttonStyles[AtomState.Normal].borderColor as number;
  }
  get buttonHoverGradientStart(): number {
    return this.buttonStyles[AtomState.Hover].backgroundColor as number;
  }
  get buttonHoverGradientEnd(): number {
    return this.buttonStyles[AtomState.Hover].borderColor as number;
  }
  get buttonLetterSpacing(): number {
    return this.buttonStyles[AtomState.Normal].letterSpacing as number;
  }

  // Link style
  get linkMarginTop(): number {
    return this.linkStyles[AtomState.Normal].margin as number;
  }
  get linkColor(): number {
    return Colors.toNumber(this.linkStyles[AtomState.Normal].color as any);
  }
  get linkHoverColor(): number {
    return Colors.toNumber(this.linkStyles[AtomState.Hover].color as any);
  }

  // Error color
  get errorColor(): number {
    return Colors.toNumber(this._colors.danger);
  }

  /** Instance color manipulation */
  public lighten(
    color: string | number | Phaser.Display.Color,
    percent: number
  ): number {
    return Colors.lighten(color, percent);
  }
  public darken(
    color: string | number | Phaser.Display.Color,
    percent: number
  ): number {
    return Colors.darken(color, percent);
  }
  public toNumber(color: string | number | Phaser.Display.Color): number {
    return Colors.toNumber(color);
  }
}
