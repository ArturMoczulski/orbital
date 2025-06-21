import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { UsersRepository } from "./users.repository";
import { User } from "./schemas/user.schema";

describe("UsersRepository", () => {
  let repository: UsersRepository;
  const mockUserModel = {
    insertMany: jest.fn(),
    bulkWrite: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken("User"),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("bulkCreate", () => {
    it("should insert many users", async () => {
      const dtos = [
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ];
      const docs = [
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ];
      mockUserModel.insertMany.mockResolvedValue(docs);

      const result = await repository.bulkCreate(dtos);
      expect(result).toEqual(docs);
      expect(mockUserModel.insertMany).toHaveBeenCalledWith(dtos, {
        ordered: false,
      });
    });
  });

  describe("bulkUpdate", () => {
    it("should bulk update users and return updated docs", async () => {
      const updates = [
        { username: "a", update: { password: "x" } },
        { username: "b", update: { password: "y" } },
      ];
      const docs = [
        { username: "a", password: "x" },
        { username: "b", password: "y" },
      ];
      mockUserModel.bulkWrite.mockResolvedValue({});
      mockUserModel.find.mockReturnValue({
        exec: () => Promise.resolve(docs),
      });

      const result = await repository.bulkUpdate(updates);
      expect(result).toEqual(docs);
      expect(mockUserModel.bulkWrite).toHaveBeenCalled();
      expect(mockUserModel.find).toHaveBeenCalled();
    });
  });

  describe("bulkFindByUsername", () => {
    it("should find users by usernames", async () => {
      const docs = [
        { username: "a", password: "1" },
        { username: "b", password: "2" },
      ];
      mockUserModel.find.mockReturnValue({
        exec: () => Promise.resolve(docs),
      });

      const result = await repository.bulkFindByUsername(["a", "b"]);
      expect(result).toEqual(docs);
      expect(mockUserModel.find).toHaveBeenCalledWith({
        username: { $in: ["a", "b"] },
      });
    });
  });
});
