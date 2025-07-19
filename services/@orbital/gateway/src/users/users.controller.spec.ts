import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue("mockCreateResponse"),
            findByUsername: jest.fn().mockResolvedValue("mockFindResponse"),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should delegate create to service and return its result", async () => {
    const dto = { username: "test", password: "pass" };
    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith([dto]);
    expect(result).toBe("mockCreateResponse");
  });

  it("should delegate findByUsername to service and return its result", async () => {
    const username = "test";
    const result = await controller.findByUsername(username);
    expect(service.findByUsername).toHaveBeenCalledWith([username]);
    expect(result).toBe("mockFindResponse");
  });
});
