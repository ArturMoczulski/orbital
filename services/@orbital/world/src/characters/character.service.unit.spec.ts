import { Test, TestingModule } from "@nestjs/testing";
import { BulkItemizedResponse } from "@orbital/bulk-operations";
import {
  Character,
  CharacterProps,
  CreatureType,
  Gender,
  Race,
} from "@orbital/characters";
import { CharacterService } from "./character.service";
import { CharactersCRUDService } from "./characters.crud.service";

describe("CharacterService", () => {
  let service: CharacterService;
  let crudService: CharactersCRUDService;

  // Mock CRUD service methods
  const mockCrudService = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByLocationId: jest.fn(),
    findByWorldId: jest.fn(),
  };

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        {
          provide: CharactersCRUDService,
          useValue: mockCrudService,
        },
      ],
    }).compile();

    // Get service and CRUD service instances
    service = module.get<CharacterService>(CharacterService);
    crudService = module.get<CharactersCRUDService>(CharactersCRUDService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should call crudService.create with correct parameters", async () => {
      // Arrange
      const character = {
        _id: "test-character-id",
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        attributes: {
          ST: 10,
          DX: 12,
          IQ: 14,
          HT: 10,
        },
        psychologicalProfile: {
          normAdherence: 5,
          altruism: 7,
          selfCenteredness: 3,
          ambition: 6,
          happiness: 8,
          selfDrive: 7,
          authorityNeed: 4,
          authorityObedience: 6,
          entrepreneurialTendency: 5,
          sociability: 8,
        },
        creatureType: CreatureType.Humanoid,
        worldId: "test-world",
      };
      const expectedResult = { _id: "1", ...character } as unknown as Character;
      mockCrudService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(
        character as unknown as CharacterProps
      );

      // Assert
      expect(mockCrudService.create).toHaveBeenCalledWith(character);
      expect(result).toBe(expectedResult);
    });

    it("should handle bulk create operations", async () => {
      // Arrange
      const characters = [
        {
          _id: "test-character-id-1",
          firstName: "John",
          lastName: "Doe",
          gender: Gender.Male,
          race: Race.Human,
          attributes: {
            ST: 10,
            DX: 12,
            IQ: 14,
            HT: 10,
          },
          psychologicalProfile: {
            normAdherence: 5,
            altruism: 7,
            selfCenteredness: 3,
            ambition: 6,
            happiness: 8,
            selfDrive: 7,
            authorityNeed: 4,
            authorityObedience: 6,
            entrepreneurialTendency: 5,
            sociability: 8,
          },
          creatureType: CreatureType.Humanoid,
          worldId: "test-world",
        },
        {
          _id: "test-character-id-2",
          firstName: "Jane",
          lastName: "Smith",
          gender: Gender.Female,
          race: Race.Elf,
          attributes: {
            ST: 8,
            DX: 14,
            IQ: 16,
            HT: 9,
          },
          psychologicalProfile: {
            normAdherence: 6,
            altruism: 8,
            selfCenteredness: 2,
            ambition: 5,
            happiness: 7,
            selfDrive: 6,
            authorityNeed: 3,
            authorityObedience: 7,
            entrepreneurialTendency: 4,
            sociability: 9,
          },
          creatureType: CreatureType.Humanoid,
          worldId: "test-world",
        },
      ];
      const expectedResult = {
        success: true,
        count: 2,
        items: [
          { success: true, item: { _id: "1", ...characters[0] } },
          { success: true, item: { _id: "2", ...characters[1] } },
        ],
      } as unknown as BulkItemizedResponse<Character>;
      mockCrudService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(
        characters as unknown as CharacterProps[]
      );

      // Assert
      expect(mockCrudService.create).toHaveBeenCalledWith(characters);
      expect(result).toBe(expectedResult);
    });
  });

  describe("find", () => {
    it("should call crudService.find with correct parameters", async () => {
      // Arrange
      const filter = { worldId: "test-world" };
      const projection = { firstName: 1, lastName: 1 };
      const options = { sort: { firstName: 1 } };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe" },
        { _id: "2", firstName: "Jane", lastName: "Smith" },
      ] as unknown as Character[];
      mockCrudService.find.mockResolvedValue(expectedResult);

      // Act
      const result = await service.find(filter, projection, options);

      // Assert
      expect(mockCrudService.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call crudService.findById with correct parameters", async () => {
      // Arrange
      const id = "test-id";
      const projection = { firstName: 1, lastName: 1 };
      const expectedResult = {
        _id: "test-id",
        firstName: "John",
        lastName: "Doe",
      } as unknown as Character;
      mockCrudService.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findById(id, projection);

      // Assert
      expect(mockCrudService.findById).toHaveBeenCalledWith(id, projection);
      expect(result).toBe(expectedResult);
    });
  });

  describe("findByLocationId", () => {
    it("should call crudService.findByLocationId with correct parameters", async () => {
      // Arrange
      const locationId = "test-location";
      const projection = { firstName: 1, lastName: 1 };
      const options = { sort: { firstName: 1 } };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe" },
        { _id: "2", firstName: "Jane", lastName: "Smith" },
      ] as unknown as Character[];
      mockCrudService.findByLocationId.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByLocationId(
        locationId,
        projection,
        options
      );

      // Assert
      expect(mockCrudService.findByLocationId).toHaveBeenCalledWith(
        locationId,
        projection,
        options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("findByWorldId", () => {
    it("should call crudService.findByWorldId with correct parameters", async () => {
      // Arrange
      const worldId = "test-world";
      const projection = { firstName: 1, lastName: 1 };
      const options = { sort: { firstName: 1 } };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe" },
        { _id: "2", firstName: "Jane", lastName: "Smith" },
      ] as unknown as Character[];
      mockCrudService.findByWorldId.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByWorldId(worldId, projection, options);

      // Assert
      expect(mockCrudService.findByWorldId).toHaveBeenCalledWith(
        worldId,
        projection,
        options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("update", () => {
    it("should call crudService.update with correct parameters", async () => {
      // Arrange
      const character = {
        _id: "1",
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        attributes: {
          ST: 10,
          DX: 12,
          IQ: 14,
          HT: 10,
        },
        psychologicalProfile: {
          normAdherence: 5,
          altruism: 7,
          selfCenteredness: 3,
          ambition: 6,
          happiness: 8,
          selfDrive: 7,
          authorityNeed: 4,
          authorityObedience: 6,
          entrepreneurialTendency: 5,
          sociability: 8,
        },
        creatureType: CreatureType.Humanoid,
        worldId: "test-world",
      };
      const expectedResult = { ...character } as unknown as Character;
      mockCrudService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await service.update(
        character as unknown as CharacterProps
      );

      // Assert
      expect(mockCrudService.update).toHaveBeenCalledWith(character);
      expect(result).toBe(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call crudService.delete with correct parameters", async () => {
      // Arrange
      const id = "test-id";
      const expectedResult = true;
      mockCrudService.delete.mockResolvedValue(expectedResult);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(mockCrudService.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });
});
