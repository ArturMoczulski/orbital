import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import Panel from "../atoms/Panel";
import { AtomState } from "../atoms/Atom";
/**
 * PopupPanel extends Panel to use theme.popup style defaults.
 */
class PopupPanel extends Panel {
  protected override baseStyle(): import("../atoms/Atom").AtomStateStyleProperties {
    const baseStyles = super.baseStyle();
    const normalTheme = this.theme.popupStyles[AtomState.Normal];
    const hoverTheme = this.theme.popupStyles[AtomState.Hover];
    return {
      [AtomState.Normal]: { ...baseStyles[AtomState.Normal], ...normalTheme },
      [AtomState.Hover]: { ...baseStyles[AtomState.Hover], ...hoverTheme },
    };
  }
}
import Theme from "../theme/Theme";
import Atom, { AGO, AtomConfig } from "../atoms/Atom";

interface SceneWithRexUI extends Phaser.Scene {
  rexUI: UIPlugin;
}

// Popup config extends AtomConfig for consistency
export interface PopupConfig extends Omit<AtomConfig, "element" | "content"> {
  // Popup-specific properties can be added here
}

export default abstract class Popup {
  protected scene: SceneWithRexUI;
  protected theme: Theme;
  protected panel?: Panel;

  constructor(config: PopupConfig) {
    this.scene = config.scene;
    this.theme = config.theme ?? Theme.active;
  }

  protected abstract content(): AGO[];

  create() {
    const content = this.content();

    const popupWidth = this.scene.scale.width * this.theme.popupWidthRatio;
    const popupHeight = this.scene.scale.height * this.theme.popupHeightRatio;

    this.panel = new PopupPanel({
      scene: this.scene,
      theme: this.theme,
      x: this.scene.scale.width / 2,
      y: this.scene.scale.height / 2,
      width: popupWidth,
      content,
    });

    this.panel.show();
    return this.panel.getElement();
  }

  destroy() {
    if (this.panel) {
      this.panel.getElement().destroy();
    }
  }
}
