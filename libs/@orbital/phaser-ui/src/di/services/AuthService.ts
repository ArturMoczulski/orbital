import { injectable, inject } from "inversify";
import Phaser from "phaser";
import { IAuthService } from "../../interfaces/auth-service.interface";
import { TYPES } from "../types";
import { ClientEvent } from "../../events";

/**
 * AuthService handles authentication actions in Phaser UI context.
 */
@injectable()
export class AuthService implements IAuthService {
  constructor(@inject(TYPES.PhaserClient) private game: Phaser.Game) {
    // Subscribe to logout event
    this.game.events.on(ClientEvent.AuthLogout, this.logout.bind(this));
  }

  logout(): void {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
