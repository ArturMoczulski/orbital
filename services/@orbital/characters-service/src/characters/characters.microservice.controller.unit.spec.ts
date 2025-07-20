import { Test, TestingModule } from "@nestjs/testing";
import {
  BulkItemizedResponse,
  BulkOperationSuccessItem,
} from "@orbital/bulk-operations";
import { Character } from "@orbital/characters";
import {
  CreatureType,
  Gender,
  Race,
} from "@orbital/characters-typegoose/dist/models/character.model";
import { WithId } from "@orbital/core";
import { CharacterService } from "./character.service";
import { CharactersCRUDService } from "./characters.crud.service";
import { CharactersMicroserviceController } from "./characters.microservice.controller";

describe("CharactersMicroserviceController", () => {
  let controller: CharactersMicroserviceController;
  let charactersCRUDService: CharactersCRUDService;
  let characterService: CharacterService;

  beforeEach(async () => {
    // Create mock services
    const mockCharactersCRUDService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockCharacterService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Create a test module with the controller and mock services
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharactersMicroserviceController],
      providers: [
        {
          provide: CharactersCRUDService,
          useValue: mockCharactersCRUDService,
        },
        {
          provide: CharacterService,
          useValue: mockCharacterService,
        },
      ],
    }).compile();

    // Get the controller and services from the test module
    controller = module.get<CharactersMicroserviceController>(
      CharactersMicroserviceController
    );
    charactersCRUDService = module.get<CharactersCRUDService>(
      CharactersCRUDService
    );
    characterService = module.get<CharacterService>(CharacterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call charactersCRUDService.create with the correct character", async () => {
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
      jest
        .spyOn(charactersCRUDService, "create")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(character);

      // Assert
      expect(charactersCRUDService.create).toHaveBeenCalledWith(character);
      expect(result).toEqual(expectedResult);
    });

    it("should call charactersCRUDService.create with an array of characters", async () => {
      // Arrange
      const characters = [
        Character.mock({
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

      // Create a BulkItemizedResponse with success items
      const bulkResponse = new BulkItemizedResponse();
      characters.forEach((character, index) => {
        const successItem = new BulkOperationSuccessItem(
          character,
          Character.mock({
            _id: `new-id-${index + 1}`,
            firstName: character.firstName,
            lastName: character.lastName,
            gender: character.gender,
            race: character.race,
            creatureType: character.creatureType,
            worldId: character.worldId,
            attributes: character.attributes,
            psychologicalProfile: character.psychologicalProfile,
          })
        );
        bulkResponse.addSuccess(successItem);
      });

      jest
        .spyOn(charactersCRUDService, "create")
        .mockResolvedValue(bulkResponse);

      // Act
      const result = await controller.create(characters);

      // Assert
      expect(charactersCRUDService.create).toHaveBeenCalledWith(characters);
      expect(result).toEqual(bulkResponse);
    });
  });

  describe("find", () => {
    it("should call charactersCRUDService.find with the correct parameters", async () => {
      // Arrange
      const filter = { firstName: "John" };
      const projection = { firstName: 1, lastName: 1 };
      const options = { sort: { createdAt: -1 } };
      const payload = { filter, projection, options };

      const expectedResult = [
        Character.mock({
          _id: "character-id-1",
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

      jest
        .spyOn(charactersCRUDService, "find")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.find(payload);

      // Assert
      expect(charactersCRUDService.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });

    it("should use empty filter if none provided", async () => {
      // Arrange
      const payload = {};

      const expectedResult = [
        Character.mock({
          _id: "character-id-1",
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

      jest
        .spyOn(charactersCRUDService, "find")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.find(payload);

      // Assert
      expect(charactersCRUDService.find).toHaveBeenCalledWith(
        {},
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call charactersCRUDService.findById with the correct id", async () => {
      // Arrange
      const id = "character-id-1";
      const projection = { firstName: 1, lastName: 1 };
      const payload = { id, projection };

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

      jest
        .spyOn(charactersCRUDService, "findById")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findById(payload);

      // Assert
      expect(charactersCRUDService.findById).toHaveBeenCalledWith(
        id,
        projection
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call charactersCRUDService.findById without projection if not provided", async () => {
      // Arrange
      const id = "character-id-1";
      const payload = { id };

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

      jest
        .spyOn(charactersCRUDService, "findById")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findById(payload);

      // Assert
      expect(charactersCRUDService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByIds", () => {
    it("should call charactersCRUDService.findByIds with the correct ids", async () => {
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

      jest
        .spyOn(charactersCRUDService, "findByIds")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByIds(ids);

      // Assert
      expect(charactersCRUDService.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call charactersCRUDService.update with the correct character", async () => {
      // Arrange
      const character = Character.mock({
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
      }) as WithId<Character>;

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

      jest
        .spyOn(charactersCRUDService, "update")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(character);

      // Assert
      expect(charactersCRUDService.update).toHaveBeenCalledWith(character);
      expect(result).toEqual(expectedResult);
    });

    it("should call charactersCRUDService.update with an array of characters", async () => {
      // Arrange
      const characters = [
        Character.mock({
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
        }),
        Character.mock({
          _id: "character-id-2",
          firstName: "Another",
          lastName: "Update",
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
      ] as WithId<Character>[];

      // Create a BulkItemizedResponse with success items
      const bulkResponse = new BulkItemizedResponse();
      characters.forEach((character) => {
        const successItem = new BulkOperationSuccessItem(
          character,
          Character.mock({
            _id: character._id,
            firstName: character.firstName,
            lastName: character.lastName,
            gender: character.gender,
            race: character.race,
            creatureType: character.creatureType,
            worldId: character.worldId,
            attributes: character.attributes,
            psychologicalProfile: character.psychologicalProfile,
          })
        );
        bulkResponse.addSuccess(successItem);
      });

      jest
        .spyOn(charactersCRUDService, "update")
        .mockResolvedValue(bulkResponse);

      // Act
      const result = await controller.update(characters);

      // Assert
      expect(charactersCRUDService.update).toHaveBeenCalledWith(characters);
      expect(result).toEqual(bulkResponse);
    });
  });

  describe("delete", () => {
    it("should call charactersCRUDService.delete with the correct id", async () => {
      // Arrange
      const id = "character-id-1";
      const expectedResult = true; // delete returns true for successful deletion

      jest
        .spyOn(charactersCRUDService, "delete")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.delete(id);

      // Assert
      expect(charactersCRUDService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it("should call charactersCRUDService.delete with an array of ids", async () => {
      // Arrange
      const ids = ["character-id-1", "character-id-2"];

      // Create a BulkItemizedResponse for the delete operation
      const bulkResponse = new BulkItemizedResponse();
      ids.forEach((id) => {
        const successItem = new BulkOperationSuccessItem(id, true);
        bulkResponse.addSuccess(successItem);
      });

      jest
        .spyOn(charactersCRUDService, "delete")
        .mockResolvedValue(bulkResponse);

      // Act
      const result = await controller.delete(ids);

      // Assert
      expect(charactersCRUDService.delete).toHaveBeenCalledWith(ids);
      expect(result).toEqual(bulkResponse);
    });
  });
});
