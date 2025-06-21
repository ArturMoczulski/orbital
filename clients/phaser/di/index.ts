import { container } from "./container";
import { IAuthService } from "./interfaces/auth-service.interface";
import { AuthService } from "./services/auth.service";
import { TYPES } from "./types/types";
import { Theme } from "@orbital/phaser-ui";

// Factories
import { phaserGameFactory } from "./factories/phaser-game.factory";

export {
  container,
  TYPES,
  // Core types
  Theme,
  // Services
  AuthService,
  // Factories
  phaserGameFactory,
};

export type { IAuthService };
