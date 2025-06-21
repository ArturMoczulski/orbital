import Phaser from "phaser";
// Import base Popup and its config type directly from source
import { Popup, type PopupConfig, type AGO } from "@orbital/phaser-ui";
import { ClientEvent } from "../../events";
// Import the LogoutButton component and its config type
import LogoutButton, { type LogoutButtonConfig } from "../atoms/LogoutButton";
import { container, TYPES, Theme } from "../../../di";

/**
 * GameSettingsPopup displays a settings popup that includes a logout button.
 */
export default class GameSettingsPopup extends Popup {
  constructor(config: PopupConfig) {
    super(config);
  }

  protected content(): AGO[] {
    // Create LogoutButton with theme from the container
    return [
      new LogoutButton({
        scene: this.scene,
        theme: this.theme,
      } as LogoutButtonConfig),
    ];
  }
}
