import {
  Controller,
  Post,
  Body,
  HttpCode,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() body: { username: string; password: string }) {
    return this.authService.signup(body.username, body.password);
  }

  @HttpCode(200)
  @Post("login")
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(
      body.username,
      body.password
    );
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(user);
  }
}
