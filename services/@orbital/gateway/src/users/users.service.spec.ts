import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

describe("UsersService", () => {
  let service: UsersService;
  let usersRepository: UsersRepository;

  const mockUsersRepository = {
    bulkCreate: jest.fn(),
    bulkUpdate: jest.fn(),
    bulkFindByUsername: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should bulk insert users and return successes", async () => {
      const dtos = [
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ];
      const docs = [
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ];
      mockUsersRepository.bulkCreate.mockResolvedValue(docs);

      const result = await service.create(dtos);
      expect(result.items.success).toHaveLength(2);
      expect(result.items.fail).toHaveLength(0);
      expect(result.items.success[0].data).toEqual(docs[0]);
      expect(result.items.success[1].data).toEqual(docs[1]);
    });

    it("should handle partial failures in bulk insert", async () => {
      const dtos = [
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ];
      // Simulate only one doc inserted
      const docs = [{ username: "a", password: "1" }];
      mockUsersRepository.bulkCreate.mockResolvedValue(docs);

      const result = await service.create(dtos);
      expect(result.items.success).toHaveLength(1);
      expect(result.items.fail).toHaveLength(1);
      expect(result.items.success[0].data).toEqual(docs[0]);
      expect(result.items.fail[0].item).toEqual(dtos[1]);
    });
  });

  describe("update", () => {
    it("should bulk update users and return successes", async () => {
      const updates = [
        { username: "a", update: { password: "x" } },
        { username: "b", update: { password: "y" } },
      ];
      const docs = [
        { username: "a", password: "x" },
        { username: "b", password: "y" },
      ];
      mockUsersRepository.bulkUpdate.mockResolvedValue(docs);

      const result = await service.update(updates);
      expect(result.items.success).toHaveLength(2);
      expect(result.items.fail).toHaveLength(0);
    });

    it("should handle not found in bulk update", async () => {
      const updates = [
        { username: "a", update: { password: "x" } },
        { username: "b", update: { password: "y" } },
      ];
      const docs = [{ username: "a", password: "x" }];
      mockUsersRepository.bulkUpdate.mockResolvedValue(docs);

      const result = await service.update(updates);
      expect(result.items.success).toHaveLength(1);
      expect(result.items.fail).toHaveLength(1);
      expect(result.items.fail[0].item.username).toBe("b");
    });
  });

  describe("findByUsername", () => {
    it("should find users by single username", async () => {
      mockUsersRepository.bulkFindByUsername.mockResolvedValue([
        { username: "a", password: "1" },
      ]);
      const result = await service.findByUsername("a");
      expect(result.items.success[0].data).toEqual({
        username: "a",
        password: "1",
      });
    });

    it("should find users by multiple usernames", async () => {
      mockUsersRepository.bulkFindByUsername.mockResolvedValue([
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ]);
      const result = await service.findByUsername(["a", "b"]);
      expect(result.items.success).toHaveLength(2);
    });

    it("should return null for not found usernames", async () => {
      mockUsersRepository.bulkFindByUsername.mockResolvedValue([
        { username: "a", password: "1" },
      ]);
      const result = await service.findByUsername(["a", "b"]);
      expect(
        result.items.success.find((s: any) => s.item === "b")?.data
      ).toBeNull();
    });
  });
});
