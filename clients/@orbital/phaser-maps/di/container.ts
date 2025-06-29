import { Container } from "inversify";
import Phaser from "phaser";
import { TYPES } from "./types/types";
// Factories

const container = new Container();

// Bind Phaser.Game directly using factory
container
  .bind<Phaser.Game>(TYPES.PhaserClient)
  .toDynamicValue(() => {
    const {
      phaserClientFactory,
    } = require("./factories/phaser-client.factory");
    return phaserClientFactory();
  })
  .inSingletonScope();

export { container };
