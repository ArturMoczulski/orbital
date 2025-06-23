import { Test, TestingModule } from "@nestjs/testing";
import { WorldsService } from "./worlds.service";
import { WorldsRepository } from "./worlds.repository";

describe("WorldsService", () => {
  let service: WorldsService;
  const mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorldsService,
        { provide: WorldsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(WorldsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createWorld", () => {
    it("should create and return a new world", async () => {
      const dto = { name: "Test", shard: "A", techLevel: 5 };
      const mockWorld = { _id: "1", ...dto };
      mockRepo.create.mockResolvedValue(mockWorld);

      await expect(service.createWorld(dto)).resolves.toEqual(mockWorld);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("getWorld", () => {
    it("should return a world by id", async () => {
      const mockWorld = { _id: "1", name: "Test", shard: "A", techLevel: 5 };
      mockRepo.findById.mockResolvedValue(mockWorld);

      await expect(service.getWorld("1")).resolves.toEqual(mockWorld);
      expect(mockRepo.findById).toHaveBeenCalledWith("1");
    });
  });

  describe("getAllWorlds", () => {
    it("should return all worlds", async () => {
      const mockWorlds = [
        { _id: "1", name: "Test1", shard: "A", techLevel: 5 },
        { _id: "2", name: "Test2", shard: "B", techLevel: 3 },
      ];
      mockRepo.findAll.mockResolvedValue(mockWorlds);

      await expect(service.getAllWorlds()).resolves.toEqual(mockWorlds);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });
  });
});
