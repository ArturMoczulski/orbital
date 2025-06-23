import Phaser from "phaser";
import type { AreaMapProps } from "@orbital/core/src/types/area-map";
// @ts-ignore: no declaration file for rexui plugin
import UIPlugin from "phaser3-rex-plugins/dist/rexuiplugin.js";
import { ClientSettingsPopup, Theme, Button } from "@orbital/phaser-ui";
import { MapViewer } from "@orbital/phaser";

export default class MainScene extends Phaser.Scene {
  private theme: Theme;
  private mapData!: AreaMapProps;
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

  // removed init; map will be loaded in preload()

  preload() {
    // load areaMap JSON from public folder
    this.load.json("areaMap", "map.json");
  }

  create() {
    // @ts-ignore
    window.currentPhaserScene = this;

    // Create and display Game Settings Popup with theme from DI container
    const settingsPopup = new ClientSettingsPopup({
      scene: this,
      theme: this.theme,
    });
    settingsPopup.create();
    // hide initially
    settingsPopup.toggle();
    // add a Settings button at top-right that toggles popup
    new Button({
      scene: this,
      theme: this.theme,
      text: "Settings",
      x: this.scale.width - 100,
      y: 20,
      onClick: () => settingsPopup.toggle(),
    });

    // get loaded map data and instantiate MapViewer
    let mapData = this.cache.json.get("areaMap") as AreaMapProps;
    if (!mapData || typeof mapData.width !== "number") {
      console.error("areaMap asset missing or invalid", mapData);
      return;
    }
    const gameWidth = this.scale.gameSize.width;
    const gameHeight = this.scale.gameSize.height;
    const tileSize = Math.min(
      gameWidth / mapData.width,
      gameHeight / mapData.height
    );
    const offsetX = (gameWidth - tileSize * mapData.width) / 2;
    const offsetY = (gameHeight - tileSize * mapData.height) / 2;
    const viewer = new MapViewer(
      this,
      offsetX,
      offsetY,
      gameWidth,
      gameHeight,
      mapData
    );
    viewer.setZoom(1).setScroll(0, 0);
  }

  update() {
    // Update game logic here
  }
}
