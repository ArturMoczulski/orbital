import Phaser from "phaser";
// @ts-ignore: no declaration file for rexui plugin
import UIPlugin from "phaser3-rex-plugins/dist/rexuiplugin.js";
import MainScene from "../../game/ui/scenes/MainScene";

export const phaserClientFactory = (): Phaser.Game => {
  console.log("phaserClientFactory: Creating new Phaser game instance");

  // Define game config directly here
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS, // Force Canvas renderer instead of WebGL
    width: 800, // Set explicit width
    height: 600, // Set explicit height
    backgroundColor: "#333333", // Dark background
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
      mode: Phaser.Scale.FIT, // Use FIT instead of RESIZE for more predictable sizing
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      transparent: false, // Ensure non-transparent canvas
    },
    scene: [MainScene],
    // The parent will be set when the game is mounted
  };

  const game = new Phaser.Game(config);

  // Log when the game is ready
  game.events.once("ready", () => {
    console.log("phaserClientFactory: Phaser game ready event fired");
  });

  return game;
};
