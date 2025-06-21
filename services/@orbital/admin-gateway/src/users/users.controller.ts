import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "./schemas/user.schema";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: { username: string; password: string }) {
    return this.usersService.create([createUserDto]);
  }

  @Get(":username")
  async findByUsername(@Param("username") username: string) {
    return this.usersService.findByUsername([username]);
  }
}
