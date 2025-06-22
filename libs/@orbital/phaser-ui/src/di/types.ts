/**
 * Dependency‐injection symbols for Phaser UI components and services.
 */
const TYPES = {
  LogoutButton: Symbol.for("LogoutButton"),
  ClientSettingsPopup: Symbol.for("ClientSettingsPopup"),
  Theme: Symbol.for("Theme"),
  AuthService: Symbol.for("AuthService"),
  PhaserClient: Symbol.for("PhaserClient"),
};

export { TYPES };
