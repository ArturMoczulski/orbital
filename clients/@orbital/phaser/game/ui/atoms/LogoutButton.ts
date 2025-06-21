import { Button, ButtonConfig } from "@orbital/phaser-ui";
import Phaser from "phaser";
import { ClientEvent } from "../../events";
import { container, TYPES, Theme } from "../../../di";

interface SceneWithRexUI extends Phaser.Scene {
  rexUI: any;
}

/**
 * Configuration for LogoutButton: inherits ButtonConfig minus text and onClick.
 */
export type LogoutButtonConfig = Omit<ButtonConfig, "text" | "onClick">;

/**
 * LogoutButton extends Button to provide a standard logout action.
 */
export default class LogoutButton extends Button {
  constructor(config: LogoutButtonConfig) {
    // If theme is not provided in config, get it from the container or use the singleton
    if (!config.theme) {
      // Try to get from container first
      try {
        config.theme = container.get<Theme>(TYPES.Theme);
      } catch (e) {
        // Fallback to the singleton instance
        config.theme = Theme.active;
      }
    }

    super({
      ...config,
      text: "Logout",
      onClick: () => {
        // Emit logout event for centralized handling
        this.scene.events.emit(ClientEvent.AuthLogout);
        // Also bubble up to Phaser.Game so AuthService can listen
        if (this.scene.game?.events) {
          this.scene.game.events.emit(ClientEvent.AuthLogout);
        }
      },
    });
  }
}
