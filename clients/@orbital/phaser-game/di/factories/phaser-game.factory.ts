import { interfaces } from "inversify";
import Phaser from "phaser";
// @ts-ignore: no declaration file for rexui plugin
import UIPlugin from "phaser3-rex-plugins/dist/rexuiplugin.js";
import CharacterSelectScene from "../../game/ui/scenes/CharacterSelectScene";

export const phaserGameFactory = (): Phaser.Game => {
  // Define game config directly here
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    plugins: {
      scene: [
        {
          key: "rexUI",
          plugin: UIPlugin,
          mapping: "rexUI",
        },
      ],
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [CharacterSelectScene],
    // The parent will be set when the game is mounted
  };

  return new Phaser.Game(config);
};
