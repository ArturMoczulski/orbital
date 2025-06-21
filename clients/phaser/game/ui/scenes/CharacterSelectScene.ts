import Phaser from "phaser";
// @ts-ignore: no declaration file for rexui plugin
import UIPlugin from "phaser3-rex-plugins/dist/rexuiplugin.js";
import GameSettingsPopup from "../organisms/GameSettingsPopup";
import { container, TYPES, Theme } from "../../../di";

export default class CharacterSelectScene extends Phaser.Scene {
  private theme: Theme;
  rexUI!: any;

  constructor() {
    super({
      key: "CharacterSelectScene",
      plugins: {
        scene: [
          {
            key: "rexUI",
            plugin: UIPlugin,
            mapping: "rexUI",
          },
        ],
      },
    });

    // Get theme from the container
    this.theme = container.get<Theme>(TYPES.Theme);
  }

  preload() {
    this.load.image("logo", "/assets/logo.png");
  }

  create() {
    // @ts-ignore
    window.currentPhaserScene = this;

    // Create game objects and UI here
    this.add.image(400, 300, "logo");

    // Create and display Game Settings Popup with theme from DI container
    const settingsPopup = new GameSettingsPopup({
      scene: this,
      theme: this.theme,
    });
    settingsPopup.create();
  }

  update() {
    // Update game logic here
  }
}
