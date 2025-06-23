// @ts-nocheck
// @ts-nocheck
import { CharactersRepository } from "./characters.repository";

describe("CharactersRepository", () => {
  let repository: CharactersRepository;
  let modelMock: any;

  beforeEach(() => {
    // Mock Mongoose Model constructor
    modelMock = jest.fn().mockImplementation((dto) => {
      return { ...dto, save: jest.fn().mockResolvedValue(dto) };
    });
    // Mock static findById returning object with exec()
    modelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue("found-character"),
    });
    repository = new CharactersRepository(modelMock);
  });

  it("should create a new character and save it", async () => {
    const dto = { name: "TestChar", level: 1 };
    const result = await repository.create(dto);
    expect(modelMock).toHaveBeenCalledWith(dto);
    expect(result).toEqual(dto);
  });

  it("should find a character by id", async () => {
    const id = "abc123";
    const found = await repository.findById(id);
    expect(modelMock.findById).toHaveBeenCalledWith(id);
    expect(found).toBe("found-character");
  });
});
