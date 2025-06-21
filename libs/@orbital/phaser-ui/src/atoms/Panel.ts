// @ts-nocheck
import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import Atom, {
  AtomConfig,
  AtomState,
  AtomStateStyleProperties,
  AtomStyleProperties,
} from "./Atom";
import Theme from "../theme/Theme";
import Colors from "../utils/Colors";

interface SceneWithRexUI extends Phaser.Scene {
  rexUI: UIPlugin;
}

/**
 * Configuration for Panel component, extends AtomConfig.
 */
export interface PanelConfig extends AtomConfig {
  // Panel-specific properties can be added here
}

/**
 * Panel is a vertical container for child elements with a background.
 * It always uses auto height to size itself to its children.
 */
export default class Panel extends Atom {
  protected override baseStyle(): AtomStateStyleProperties {
    const baseStyles = super.baseStyle();

    const normalState: AtomStyleProperties = {
      ...baseStyles[AtomState.Normal],
      height: "auto",
      borderColor: this.theme.panel.borderColor,
      borderWidth: this.theme.panel.borderWidth,
      padding: this.theme.panel.padding,
      margin: this.theme.panel.padding,
    };

    const hoverState: AtomStyleProperties = {
      ...baseStyles[AtomState.Hover],
      height: "auto",
      borderColor: this.theme.panel.borderColor,
      borderWidth: this.theme.panel.borderWidth,
      padding: this.theme.panel.padding,
      margin: this.theme.panel.padding,
    };

    return {
      [AtomState.Normal]: normalState,
      [AtomState.Hover]: hoverState,
    };
  }

  constructor(config: PanelConfig) {
    // Force vertical orientation and auto height
    config.orientation = "y";
    config.height = "auto";
    super(config);

    // Enforce panel border settings regardless of config overrides
    this.style(AtomState.Normal, {
      borderColor: this.theme.panel.borderColor,
      borderWidth: this.theme.panel.borderWidth,
    });
    this.style(AtomState.Hover, {
      borderColor: this.theme.panel.borderColor,
      borderWidth: this.theme.panel.borderWidth,
    });
  }

  /**
   * Show the panel with a scale tween.
   */
  public show(duration: number = 500): this {
    this.sizer.setScale(0);
    if (this.scene.tweens && this.scene.tweens.add) {
      this.scene.tweens.add({
        targets: this.sizer,
        scaleX: 1,
        scaleY: 1,
        duration,
        ease: "Back.easeOut",
      });
    }
    return this;
  }

  protected setupOrigin(): void {
    if (this.sizer && typeof this.sizer.setOrigin === "function") {
      this.sizer.setOrigin(0.5);
    } else if (typeof (this.element as any).setOrigin === "function") {
      (this.element as any).setOrigin(0.5);
    }
  }

  protected disableBackgroundInteractions(): void {
    if (!this.backgroundRect) return;
    if (typeof (this.backgroundRect as any).off === "function") {
      (this.backgroundRect as any).off("pointerover");
      (this.backgroundRect as any).off("pointerout");
    }
    if (typeof (this.backgroundRect as any).disableInteractive === "function") {
      (this.backgroundRect as any).disableInteractive();
    }
  }

  protected setupBackgroundDepth(): void {
    if (!this.backgroundRect) return;
    if (typeof (this.backgroundRect as any).setDepth === "function") {
      (this.backgroundRect as any).setDepth(0);
    }
  }

  protected override init(): void {
    super.init();
    this.setupOrigin();
    this.disableBackgroundInteractions();
    this.setupBackgroundDepth();
  }
}
