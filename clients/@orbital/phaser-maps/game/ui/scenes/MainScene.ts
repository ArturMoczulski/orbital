import Phaser from "phaser";
// @ts-ignore: no declaration file for rexui plugin
import UIPlugin from "phaser3-rex-plugins/dist/rexuiplugin.js";
import { ClientSettingsPopup, Theme } from "@orbital/phaser-ui";

export default class MainScene extends Phaser.Scene {
  private theme: Theme;
  rexUI!: any;

  constructor() {
    super({
      key: "MainScene",
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

    // Use the active theme directly
    this.theme = Theme.active;
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
    const settingsPopup = new ClientSettingsPopup({
      scene: this,
      theme: this.theme,
    });
    settingsPopup.create();
  }

  update() {
    // Update game logic here
  }
}
