import { Test, TestingModule } from "@nestjs/testing";
import { Character } from "@orbital/characters";
import {
  CreatureType,
  Gender,
  Race,
} from "@orbital/characters-typegoose/dist/models/character.model";
import { CharactersCRUDService } from "./characters.crud.service";
import { CharactersRepository } from "./characters.repository";

describe("CharactersCRUDService", () => {
  let service: CharactersCRUDService;
  let repository: CharactersRepository;

  beforeEach(async () => {
    // Create a mock repository
    const mockRepository = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Create a test module with the service and mock repository
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersCRUDService,
        {
          provide: CharactersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get the service and repository from the test module
    service = module.get<CharactersCRUDService>(CharactersCRUDService);
    repository = module.get<CharactersRepository>(CharactersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("find", () => {
    it("should call repository.find with empty filter to get all characters", async () => {
      // Arrange
      const expectedResult = [
        Character.mock({
          _id: "1",
          firstName: "John",
          lastName: "Doe",
          gender: Gender.Male,
          race: Race.Human,
          creatureType: CreatureType.Humanoid,
          worldId: "world-id-1",
          attributes: {
            ST: 10,
            DX: 10,
            IQ: 10,
            HT: 10,
          },
          psychologicalProfile: {},
        }),
      ];
      jest.spyOn(repository, "find").mockResolvedValue(expectedResult);

      // Act
      const result = await service.find();

      // Assert
      expect(repository.find).toHaveBeenCalledWith({}, undefined, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call repository.findById with the correct id", async () => {
      // Arrange
      const id = "character-id-1";
      const expectedResult = Character.mock({
        _id: id,
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        creatureType: CreatureType.Humanoid,
        worldId: "world-id-1",
        attributes: {
          ST: 10,
          DX: 10,
          IQ: 10,
          HT: 10,
        },
        psychologicalProfile: {},
      });
      jest.spyOn(repository, "findById").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(id, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByIds", () => {
    it("should call repository.find with the correct ids", async () => {
      // Arrange
      const ids = ["character-id-1", "character-id-2"];
      const expectedResult = [
        Character.mock({
          _id: ids[0],
          firstName: "John",
          lastName: "Doe",
          gender: Gender.Male,
          race: Race.Human,
          creatureType: CreatureType.Humanoid,
          worldId: "world-id-1",
          attributes: {
            ST: 10,
            DX: 10,
            IQ: 10,
            HT: 10,
          },
          psychologicalProfile: {},
        }),
        Character.mock({
          _id: ids[1],
          firstName: "Jane",
          lastName: "Smith",
          gender: Gender.Female,
          race: Race.Elf,
          creatureType: CreatureType.Humanoid,
          worldId: "world-id-1",
          attributes: {
            ST: 10,
            DX: 10,
            IQ: 10,
            HT: 10,
          },
          psychologicalProfile: {},
        }),
      ];
      jest.spyOn(repository, "find").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByIds(ids);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({ _id: { $in: ids } });
      expect(result).toEqual(expectedResult);
    });
  });

  describe("create", () => {
    it("should call repository.create with the correct character", async () => {
      // Arrange
      const character = Character.mock({
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        creatureType: CreatureType.Humanoid,
        worldId: "world-id-1",
        attributes: {
          ST: 10,
          DX: 10,
          IQ: 10,
          HT: 10,
        },
        psychologicalProfile: {},
      });
      const expectedResult = Character.mock({
        _id: "new-id",
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        creatureType: CreatureType.Humanoid,
        worldId: "world-id-1",
        attributes: {
          ST: 10,
          DX: 10,
          IQ: 10,
          HT: 10,
        },
        psychologicalProfile: {},
      });
      jest.spyOn(repository, "create").mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(character);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(character);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call repository.update with the correct character", async () => {
      // Arrange
      const character = Character.mock({
        _id: "character-id-1",
        firstName: "Updated",
        lastName: "Character",
      });
      const expectedResult = Character.mock({
        _id: "character-id-1",
        firstName: "Updated",
        lastName: "Character",
        gender: Gender.Male,
        race: Race.Human,
        creatureType: CreatureType.Humanoid,
        worldId: "world-id-1",
        attributes: {
          ST: 10,
          DX: 10,
          IQ: 10,
          HT: 10,
        },
        psychologicalProfile: {},
      });
      jest.spyOn(repository, "update").mockResolvedValue(expectedResult);

      // Act
      const result = await service.update(character);

      // Assert
      expect(repository.update).toHaveBeenCalledWith(character);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call repository.delete with the correct id", async () => {
      // Arrange
      const id = "character-id-1";
      const expectedResult = true; // delete returns true for successful deletion
      jest.spyOn(repository, "delete").mockResolvedValue(expectedResult);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
