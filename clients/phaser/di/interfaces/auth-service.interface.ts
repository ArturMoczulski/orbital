export interface IAuthService {
  /**
   * Log out the current user by clearing the token.
   */
  logout(): void;

  /**
   * Retrieve the stored authentication token.
   * @returns the token string or null if not set
   */
  getToken(): string | null;

  /**
   * Check if a user is currently authenticated.
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean;
}
