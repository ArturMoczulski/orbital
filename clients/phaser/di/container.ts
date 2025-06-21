import { Container } from "inversify";
import Phaser from "phaser";
import { Theme } from "@orbital/phaser-ui";
import { TYPES } from "./types/types";
import { IAuthService } from "./interfaces/auth-service.interface";

// Factories
import { AuthService } from "./services/auth.service";

const container = new Container();

// Bind Theme directly using the singleton instance
container.bind<Theme>(TYPES.Theme).toConstantValue(Theme.active);

// Bind Phaser.Game directly using factory
container
  .bind<Phaser.Game>(TYPES.PhaserGame)
  .toDynamicValue((context) => {
    const { phaserGameFactory } = require("./factories/phaser-game.factory");
    return phaserGameFactory(context);
  })
  .inSingletonScope();

// Bind AuthService
container
  .bind<IAuthService>(TYPES.AuthService)
  .to(AuthService)
  .inSingletonScope();

export { container };
