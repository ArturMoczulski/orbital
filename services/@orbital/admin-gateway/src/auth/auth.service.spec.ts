import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByUsername: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("token"),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset bcrypt mocks
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("returns user data when credentials are valid", async () => {
      const user = { username: "u", password: "hashed", _id: "id" };
      (usersService.findByUsername as jest.Mock).mockResolvedValue({
        items: { success: [{ data: user }], fail: [] },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser("u", "p");
      expect(result).toEqual({ username: "u", _id: "id" });
    });

    it("returns null when credentials are invalid", async () => {
      (usersService.findByUsername as jest.Mock).mockResolvedValue({
        items: { success: [], fail: [] },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser("u", "p");
      expect(result).toBeNull();
    });
  });

  describe("signup", () => {
    it("creates user and returns token", async () => {
      const user = { username: "u", password: "hashed", _id: "id" };
      (usersService.create as jest.Mock).mockResolvedValue({
        items: { success: [{ data: user }], fail: [] },
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      const result = await authService.signup("u", "p");
      expect(result.access_token).toBe("token");
    });

    it("throws if user creation fails", async () => {
      (usersService.create as jest.Mock).mockResolvedValue({
        items: {
          success: [],
          fail: [{ item: { username: "u", password: "hashed" } }],
        },
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      await expect(authService.signup("u", "p")).rejects.toThrow(
        "User creation failed"
      );
    });
  });
});
