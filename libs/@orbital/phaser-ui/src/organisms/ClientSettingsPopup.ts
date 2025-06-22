import Popup, { PopupConfig } from "../molecules/Popup";
import type { AGO } from "../atoms/Atom";
import LogoutButton, { LogoutButtonConfig } from "../molecules/LogoutButton";

export type ClientSettingsPopupConfig = PopupConfig;

/**
 * ClientSettingsPopup displays a settings popup that includes a logout button.
 */
export default class ClientSettingsPopup extends Popup {
  constructor(config: PopupConfig) {
    super(config);
  }

  protected content(): AGO[] {
    return [
      new LogoutButton({
        scene: this.scene,
        theme: this.theme,
      } as LogoutButtonConfig),
    ];
  }
}
