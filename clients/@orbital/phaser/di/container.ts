import { Container } from "inversify";
import Phaser from "phaser";
import { TYPES } from "./types/types";
// Factories

const container = new Container();

// Bind Phaser.Game directly using factory
container
  .bind<Phaser.Game>(TYPES.PhaserClient)
  .toDynamicValue((context) => {
    const { phaserGameFactory } = require("./factories/phaser-game.factory");
    return phaserGameFactory(context);
  })
  .inSingletonScope();

export { container };
