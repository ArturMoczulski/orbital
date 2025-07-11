import { Test, TestingModule } from "@nestjs/testing";
import {
  Character,
  CharacterProps,
  CreatureType,
  Gender,
  Race,
} from "@orbital/characters";
import { CharactersCRUDService } from "./characters.crud.service";
import { CharactersRepository } from "./characters.repository";

describe("CharactersCRUDService", () => {
  let service: CharactersCRUDService;
  let repository: CharactersRepository;

  // Mock repository methods
  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByLocationId: jest.fn(),
  };

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersCRUDService,
        {
          provide: CharactersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get service and repository instances
    service = module.get<CharactersCRUDService>(CharactersCRUDService);
    repository = module.get<CharactersRepository>(CharactersRepository);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByLocationId", () => {
    it("should call repository.findByLocationId with correct parameters", async () => {
      // Arrange
      const locationId = "test-location";
      const projection = { name: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult = [
        { _id: "1", name: "Test Character" },
      ] as unknown as Character[];
      mockRepository.findByLocationId.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByLocationId(
        locationId,
        projection,
        options
      );

      // Assert
      expect(mockRepository.findByLocationId).toHaveBeenCalledWith(
        locationId,
        projection,
        options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("findByWorldId", () => {
    it("should call repository.find with correct parameters", async () => {
      // Arrange
      const worldId = "test-world";
      const projection = { name: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult = [
        { _id: "1", name: "Test Character" },
      ] as unknown as Character[];
      mockRepository.find.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByWorldId(worldId, projection, options);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith(
        { worldId },
        projection,
        options
      );
      expect(result).toBe(expectedResult);
    });
  });

  // Test inherited methods from CRUDService
  describe("find", () => {
    it("should call repository.find with correct parameters", async () => {
      // Arrange
      const filter = { name: "Test" };
      const projection = { name: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult = [
        { _id: "1", name: "Test Character" },
      ] as unknown as Character[];
      mockRepository.find.mockResolvedValue(expectedResult);

      // Act
      const result = await service.find(filter, projection, options);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call repository.findById with correct parameters", async () => {
      // Arrange
      const id = "test-id";
      const projection = { name: 1 };
      const expectedResult = {
        _id: "1",
        name: "Test Character",
      } as unknown as Character;
      mockRepository.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findById(id, projection);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(id, projection);
      expect(result).toBe(expectedResult);
    });
  });

  describe("create", () => {
    it("should call repository.create with correct parameters", async () => {
      // Arrange
      const character = {
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
      mockRepository.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(
        character as unknown as CharacterProps
      );

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(character);
      expect(result).toBe(expectedResult);
    });
  });

  describe("update", () => {
    it("should call repository.update with correct parameters", async () => {
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
      mockRepository.update.mockResolvedValue(expectedResult);

      // Act
      const result = await service.update(character);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(character);
      expect(result).toBe(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call repository.delete with correct parameters", async () => {
      // Arrange
      const id = "test-id";
      const expectedResult = true;
      mockRepository.delete.mockResolvedValue(expectedResult);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });
});
