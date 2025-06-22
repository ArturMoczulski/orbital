import Button, { ButtonConfig } from "../atoms/Button";
import { ClientEvent } from "../events";
import Theme from "../theme/Theme";

export type LogoutButtonConfig = Omit<ButtonConfig, "text">;

/**
 * LogoutButton extends the base Button to emit a centralized logout event.
 */
export default class LogoutButton extends Button {
  constructor(config: LogoutButtonConfig) {
    super({
      ...config,
      theme: config.theme ?? Theme.active,
      text: "Logout",
      onClick: () => {
        const scene = config.scene;
        scene.events.emit(ClientEvent.AuthLogout);
        if (scene.game?.events) {
          scene.game.events.emit(ClientEvent.AuthLogout);
        }
      },
    });
  }
}
