/**
 * Interface for authentication service used in Phaser UI.
 */
export interface IAuthService {
  /** Perform logout logic (e.g., clear token and redirect). */
  logout(): void;
  /** Retrieve the current authentication token, if any. */
  getToken(): string | null;
  /** Determine if the user is authenticated. */
  isAuthenticated(): boolean;
}
