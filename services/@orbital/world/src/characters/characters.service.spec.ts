// @ts-nocheck
import { CharactersService } from "./characters.service";
import { CharactersRepository } from "./characters.repository";

describe("CharactersService", () => {
  let service: CharactersService;
  let repositoryMock: Partial<CharactersRepository>;

  beforeEach(() => {
    repositoryMock = {
      create: jest.fn().mockResolvedValue({ _id: "1", name: "Hero", level: 5 }),
      findById: jest
        .fn()
        .mockResolvedValue({ _id: "1", name: "Hero", level: 5 }),
    };
    service = new CharactersService(repositoryMock as CharactersRepository);
  });

  it("should create a character via repository", async () => {
    const dto = { name: "Hero", level: 5 };
    const result = await service.createCharacter(dto);
    expect(repositoryMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ _id: "1", name: "Hero", level: 5 });
  });

  it("should get a character by id via repository", async () => {
    const id = "1";
    const result = await service.getCharacter(id);
    expect(repositoryMock.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual({ _id: "1", name: "Hero", level: 5 });
  });
});
